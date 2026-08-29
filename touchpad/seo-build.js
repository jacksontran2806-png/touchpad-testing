// Generates the JSON-LD block for every page, in place, between
//   <!-- SCHEMA:START -->  ...  <!-- SCHEMA:END -->
// Run via `node build.js`, which calls into this after syncing partials.
//
// Title, description and canonical URL are read from the page's own <head>,
// so the structured data cannot contradict the meta tags. Anything not
// derivable from the HTML lives in seo-data.js.
const fs = require("fs")
const path = require("path")
const data = require("./seo-data.js")

const ROOT = __dirname

function read(file, re) {
  const m = file.match(re)
  return m ? decodeEntities(m[1].trim()) : null
}

// The pages use &amp; and &#39; in places; JSON-LD wants the literal text.
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "\u2019")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

const publisher = {
  "@type": "Organization",
  "@id": `${data.siteUrl}/#organization`,
  name: data.siteName,
  url: `${data.siteUrl}/`,
  logo: {
    "@type": "ImageObject",
    url: `${data.siteUrl}/icon-512.png`,
    width: 512,
    height: 512,
  },
}

const website = {
  "@type": "WebSite",
  "@id": `${data.siteUrl}/#website`,
  url: `${data.siteUrl}/`,
  name: data.siteName,
  publisher: { "@id": `${data.siteUrl}/#organization` },
  inLanguage: "en-US",
}

function breadcrumb(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function schemaFor(rel, html) {
  const title = read(html, /<title>([\s\S]*?)<\/title>/)
  const description = read(html, /<meta name="description" content="([\s\S]*?)"\s*\/?>/)
  const canonical = read(html, /<link rel="canonical" href="([^"]+)"/)
  const headline = read(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)

  // No canonical means the page is not meant to be indexed (404). Skip it.
  if (!canonical) return null

  const home = { name: "Home", url: `${data.siteUrl}/` }
  const date = data.dates[rel] || data.defaultDate
  const graph = []

  if (rel === "index.html") {
    graph.push(publisher, website, {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { "@id": `${data.siteUrl}/#website` },
      about: { "@id": `${data.siteUrl}/#organization` },
      inLanguage: "en-US",
    })

    // The tool list is the substance of the homepage — spell it out rather
    // than leaving the page as a bare WebPage with no described content.
    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#tools`,
      name: "Hardware tests",
      itemListElement: data.homepageTools.map((slug, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${data.siteUrl}/${slug}`,
      })),
    })
    return graph
  }

  if (rel.startsWith("blog/") || rel.startsWith("blog\\")) {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${canonical}#article`,
      headline: headline || title,
      name: title,
      description,
      url: canonical,
      mainEntityOfPage: canonical,
      datePublished: date,
      dateModified: date,
      image: `${data.siteUrl}${data.ogImage}`,
      author: { "@id": `${data.siteUrl}/#organization` },
      publisher: { "@id": `${data.siteUrl}/#organization` },
      isPartOf: { "@id": `${data.siteUrl}/#website` },
      inLanguage: "en-US",
    })
    graph.push(
      breadcrumb([
        home,
        { name: "Guides", url: `${data.siteUrl}/#guides` },
        { name: headline || title, url: canonical },
      ])
    )
    return graph
  }

  const tool = data.tools[rel]
  if (tool) {
    graph.push({
      "@type": "WebApplication",
      "@id": `${canonical}#app`,
      name: headline || title,
      description,
      url: canonical,
      applicationCategory: "UtilitiesApplication",
      // Runs entirely client-side, so it genuinely works anywhere.
      operatingSystem: "Windows, macOS, Linux, Android, iOS",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": `${data.siteUrl}/#organization` },
      isPartOf: { "@id": `${data.siteUrl}/#website` },
      inLanguage: "en-US",
    })
    graph.push(
      breadcrumb([
        home,
        { name: tool.section, url: `${data.siteUrl}/` },
        { name: headline || title, url: canonical },
      ])
    )
    return graph
  }

  // about, privacy-policy, and anything else with a canonical.
  graph.push({
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { "@id": `${data.siteUrl}/#website` },
    inLanguage: "en-US",
  })
  graph.push(
    breadcrumb([home, { name: headline || title, url: canonical }])
  )
  return graph
}

function block(graph) {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)
  return `<!-- SCHEMA:START -->\n<script type="application/ld+json">\n${json}\n</script>\n<!-- SCHEMA:END -->`
}

const MARKER = /<!-- SCHEMA:START -->[\s\S]*?<!-- SCHEMA:END -->/

function applySchema(files) {
  let changed = 0
  for (const rel of files) {
    const filePath = path.join(ROOT, rel)
    const original = fs.readFileSync(filePath, "utf8")
    const graph = schemaFor(rel.split(path.sep).join("/"), original)
    if (!graph) continue

    const generated = block(graph)
    let output
    if (MARKER.test(original)) {
      output = original.replace(MARKER, generated)
    } else {
      // First run on this page: place the block just before </head>.
      output = original.replace("</head>", `${generated}\n</head>`)
    }

    if (output !== original) {
      fs.writeFileSync(filePath, output)
      changed++
      console.log("schema:", rel)
    }
  }
  return changed
}

// The sitemap is generated from the same canonical URLs the pages declare, so
// a new page can never be added to the site and forgotten in the sitemap.
// Pages with no canonical (404) are excluded automatically.
function buildSitemap(files) {
  const entries = []

  for (const rel of files) {
    const norm = rel.split(path.sep).join("/")
    const html = fs.readFileSync(path.join(ROOT, rel), "utf8")
    const canonical = read(html, /<link rel="canonical" href="([^"]+)"/)
    if (!canonical) continue

    let priority = "0.5"
    if (norm === "index.html") priority = "1.0"
    else if (data.tools[norm]) priority = "0.9"
    else if (norm.startsWith("blog/")) priority = "0.8"
    else if (norm === "about.html") priority = "0.4"
    else if (norm === "privacy-policy.html") priority = "0.3"

    entries.push({
      loc: canonical,
      lastmod: data.dates[norm] || data.defaultDate,
      priority,
      sort: Number(priority),
    })
  }

  entries.sort((a, b) => b.sort - a.sort || a.loc.localeCompare(b.loc))

  const body = entries
    .map(
      (e) =>
        `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`
    )
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

  const sitemapPath = path.join(ROOT, "sitemap.xml")
  const existing = fs.existsSync(sitemapPath)
    ? fs.readFileSync(sitemapPath, "utf8")
    : ""
  if (existing === xml) return false
  fs.writeFileSync(sitemapPath, xml)
  return true
}

module.exports = { applySchema, buildSitemap }
