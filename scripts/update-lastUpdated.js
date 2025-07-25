const fs = require('fs');
const matter = require('gray-matter');

const filepath = process.argv[2];
if (!filepath.endsWith(".md")) process.exit(); // only update markdown

try {
  const fileContent = fs.readFileSync(filepath, 'utf8');
  const parsed = matter(fileContent);

  parsed.data.lastUpdated = new Date().toISOString();

  const updatedContent = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filepath, updatedContent);
  console.log(`✔ lastUpdated updated in ${filepath}`);
} catch (err) {
  console.error(`Failed to update lastUpdated in ${filepath}`);
}
