// ESM version. Works locally and in GitHub Actions.
// Locally it loads .env.sync-local; in Actions you rely on repo secrets.

import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

// Load local env file if present (safe if missing)
dotenv.config({ path: ".env.sync-local" });

const {
  GH_OWNER = "chenzhuoyi86",  // change if needed
  GH_REPO = "blog",           // change if needed
  GH_TOKEN,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env;

if (!GH_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required env vars: GH_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const octokit = new Octokit({ auth: GH_TOKEN });

// Adjust to your utterances issue-term (e.g., 'pathname' makes issue.title the path)
function deriveSlugFromIssue(issue) {
  return (issue.title || "").toLowerCase().trim();
}

async function upsertComments(rows) {
  if (!rows.length) return;

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/gh_comments`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates", // merge on PK conflict
    },
    body: JSON.stringify(rows),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase upsert failed: ${resp.status} ${text}`);
  }
}

async function run() {
  // Prefer issues labeled "utterances"
  let issues = await octokit.paginate(octokit.issues.listForRepo, {
    owner: GH_OWNER,
    repo: GH_REPO,
    state: "all",
    labels: "utterances",
    per_page: 100,
  });

  // Fallback: fetch all issues and heuristically filter if no label
  if (issues.length === 0) {
    const all = await octokit.paginate(octokit.issues.listForRepo, {
      owner: GH_OWNER,
      repo: GH_REPO,
      state: "all",
      per_page: 100,
    });
    issues = all.filter((iss) => {
      const labels = (iss.labels || []).map((l) => (l.name || "").toLowerCase());
      const opener = (iss.user?.login || "").toLowerCase();
      return labels.includes("utterances") || opener.includes("app") || opener.includes("bot");
    });
  }

  let total = 0;

  for (const issue of issues) {
    const postSlug = deriveSlugFromIssue(issue);

    const comments = await octokit.paginate(octokit.issues.listComments, {
      owner: GH_OWNER,
      repo: GH_REPO,
      issue_number: issue.number,
      per_page: 100,
    });

    const rows = comments.map((c) => ({
      gh_comment_id: Number(c.id),          // PK in your Supabase table
      repo_issue_id: Number(issue.id),
      repo_issue_number: Number(issue.number),
      post_slug: postSlug,
      author_login: c.user?.login || "unknown",
      author_id: Number(c.user?.id || 0),
      body: c.body || "",
      commented_at: c.created_at,
    }));

    await upsertComments(rows);
    total += rows.length;
  }

  console.log(`Synced ${issues.length} issues and ${total} comments.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
