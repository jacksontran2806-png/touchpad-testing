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

// The visible FAQ accordion is the single source of truth for FAQ structured
// data. Posts used to carry a hand-written FAQPage block alongside the markup,
// which meant every FAQ edit had to be made twice or the two silently drifted
// apart — exactly the failure Google penalises, since the schema then claims
// text the page does not show.
function faqFrom(html) {
  const items = []
  const itemRe = /<details class="faq-item">([\s\S]*?)<\/details>/g
  let m
  while ((m = itemRe.exec(html))) {
    const block = m[1]
    const summary = block.match(/<summary>([\s\S]*?)<\/summary>/)
    const answerBlock = block.match(/<div class="faq-answer">([\s\S]*?)<\/div>/)
    if (!summary || !answerBlock) continue

    const paras = []
    const pRe = /<p>([\s\S]*?)<\/p>/g
    let pm
    while ((pm = pRe.exec(answerBlock[1]))) paras.push(stripTags(pm[1]))
    if (!paras.length) continue

    items.push({
      "@type": "Question",
      name: stripTags(summary[1]),
      acceptedAnswer: { "@type": "Answer", text: paras.join(" ") },
    })
  }
  return items
}

// Any page carrying a visible FAQ accordion gets FAQPage data — the tool pages
// have them too, not just the guides.
function pushFaq(graph, canonical, html, parentId) {
  const faq = faqFrom(html)
  if (!faq.length) return
  graph.push({
    "@type": "FAQPage",
    "@id": `${canonical}#faq`,
    isPartOf: { "@id": parentId },
    mainEntity: faq,
  })
}

// Inline markup (<em>, <code>, <strong>, links) is presentation; structured
// data wants the plain sentence.
function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim()
}

function schemaFor(rel, html) {
  const title = read(html, /<title>([\s\S]*?)<\/title>/)
  const description = read(html, /<meta name="description" content="([\s\S]*?)"\s*\/?>/)
  const canonical = read(html, /<link rel="canonical" href="([^"]+)"/)
  const headline = read(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)

  // No canonical means the page is not meant to be indexed (404). Skip it.
  if (!canonical) return null

  const home = { name: "Home", url: `${data.siteUrl}/` }
  // Published is set once and frozen; modified moves when a page is rewritten.
  // Falling back to published (not defaultDate) keeps a brand-new page from
  // claiming it was modified before it existed.
  const published = data.published[rel] || data.defaultDate
  const modified = data.dates[rel] || published
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
      datePublished: published,
      dateModified: modified,
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

    pushFaq(graph, canonical, html, `${canonical}#article`)
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
    pushFaq(graph, canonical, html, `${canonical}#app`)
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
  pushFaq(graph, canonical, html, `${canonical}#webpage`)
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
    else if (
      norm === "privacy-policy.html" ||
      norm === "terms-and-conditions.html" ||
      norm === "disclaimer.html"
    )
      priority = "0.3"

    entries.push({
      loc: canonical,
      lastmod: data.dates[norm] || data.published[norm] || data.defaultDate,
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

// The human-readable sitemap at /sitemap is generated from the same file walk
// as sitemap.xml, so the two can never disagree and a new page cannot be added
// to the site and forgotten in the index.
const HTML_SITEMAP_MARKER = /<!-- SITEMAP_LINKS:START -->[\s\S]*?<!-- SITEMAP_LINKS:END -->/

const SITEMAP_SECTIONS = [
  { title: "Diagnostic tools", match: (rel) => !!data.tools[rel] },
  { title: "Keyboard guides", match: (rel) => rel.startsWith("blog/keyboard/") },
  { title: "Mouse guides", match: (rel) => rel.startsWith("blog/mouse/") },
  { title: "Trackpad guides", match: (rel) => rel.startsWith("blog/trackpad/") },
  { title: "Site pages", match: () => true },
]

function buildHtmlSitemap(files) {
  const pages = []
  for (const rel of files) {
    const norm = rel.split(path.sep).join("/")
    if (norm === "sitemap.html" || norm === "index.html") continue
    const html = fs.readFileSync(path.join(ROOT, rel), "utf8")
    const canonical = read(html, /<link rel="canonical" href="([^"]+)"/)
    if (!canonical) continue // 404 and the verification stub
    const h1 = read(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)
    const title = read(html, /<title>([\s\S]*?)<\/title>/)
    pages.push({
      norm,
      href: canonical.replace(data.siteUrl, ""),
      label: stripTags(h1 || title || norm),
    })
  }

  const used = new Set()
  let out = ""
  for (const section of SITEMAP_SECTIONS) {
    const inSection = pages
      .filter((p) => !used.has(p.norm) && section.match(p.norm))
      .sort((a, b) => a.label.localeCompare(b.label))
    if (!inSection.length) continue
    inSection.forEach((p) => used.add(p.norm))
    out += `\n    <h2>${section.title}</h2>\n    <ul>\n`
    for (const p of inSection) {
      out += `      <li><a href="${p.href}">${escapeHtml(p.label)}</a></li>\n`
    }
    out += "    </ul>\n"
  }

  const filePath = path.join(ROOT, "sitemap.html")
  if (!fs.existsSync(filePath)) return false
  const original = fs.readFileSync(filePath, "utf8")
  if (!HTML_SITEMAP_MARKER.test(original)) return false
  const output = original.replace(
    HTML_SITEMAP_MARKER,
    `<!-- SITEMAP_LINKS:START -->${out}    <!-- SITEMAP_LINKS:END -->`
  )
  if (output === original) return false
  fs.writeFileSync(filePath, output)
  return true
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

module.exports = { applySchema, buildSitemap, buildHtmlSitemap }
