import * as React from "react"
import { Link, graphql, withPrefix } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { GatsbyImage, getImage } from "gatsby-plugin-image"



const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes

  if (posts.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <Bio />
        <p>
          No blog posts found. Add markdown posts to "content/blog" (or the
          directory you specified for the "gatsby-source-filesystem" plugin in
          gatsby-config.js).
        </p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <Bio />
      <ol style={{ listStyle: `none` }}>
        {posts.map(post => {
          const title = post.frontmatter.title || post.fields.slug

          return (
            <li key={post.fields.slug}>
             <article className="post-list-item" itemScope itemType="http://schema.org/Article">
  <header>
    <h2>
      <Link to={post.fields.slug} itemProp="url">
        <span itemProp="headline">{title}</span>
      </Link>
    </h2>
    <small>{post.frontmatter.date}</small>
  </header>

  {post.frontmatter.featuredImage && (
    <div style={{ margin: "0.75rem 0" }}>
      <GatsbyImage
        image={getImage(post.frontmatter.featuredImage)}
        alt={title}
        style={{
          borderRadius: "6px",
          maxHeight: "200px",
          objectFit: "cover",
        }}
        imgStyle={{ objectFit: "cover" }}
      />
    </div>
  )}

  <section>
    <p
      dangerouslySetInnerHTML={{
        __html: post.frontmatter.description || post.excerpt,
      }}
      itemProp="description"
    />
  </section>
</article>
            </li>
          )
        })}
      </ol>
    </Layout>
  )
}

export default BlogIndex

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => <Seo title="All posts" />

// export const pageQuery = graphql`
//   {
//     site {
//       siteMetadata {
//         title
//       }
//     }
//     allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
//       nodes {
//         excerpt
//         fields {
//           slug
//         }
//         frontmatter {
//           date(formatString: "MMMM DD, YYYY")
//           title
//           description
//         }
//       }
//     }
//   }
export const pageQuery = graphql`
  {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
          featuredImage {
            childImageSharp {
              gatsbyImageData(width: 600, placeholder: BLURRED)
            }
          }
        }
      }
    }
  }

`
