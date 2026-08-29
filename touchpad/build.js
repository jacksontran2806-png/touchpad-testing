// Syncs shared header/footer/head-common into every page that carries the
// matching marker comments. Not a deploy step — Cloudflare serves the plain
// HTML files as-is. Run this by hand after editing anything in partials/,
// then commit the regenerated pages: `node build.js`.
const fs = require("fs");
const path = require("path");
const { applySchema, buildSitemap } = require("./seo-build.js");

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, "partials");

const PARTIALS = {};
for (const file of fs.readdirSync(PARTIALS_DIR)) {
  const name = path.basename(file, ".html").toUpperCase().replace(/-/g, "_");
  PARTIALS[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf8").trim();
}

// Every .html file in the site, at the root and one level deep (blog/) —
// any file carrying marker comments gets synced, so a new page just needs
// the markers pasted in, never an entry added here.
const SKIP_DIRS = new Set(["node_modules", ".git", "partials"]);
const TARGET_GLOBS = [];
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".html")) {
    TARGET_GLOBS.push(entry.name);
  } else if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
    const sub = path.join(ROOT, entry.name);
    for (const f of fs.readdirSync(sub)) {
      if (f.endsWith(".html")) TARGET_GLOBS.push(path.join(entry.name, f));
    }
  }
}

let changedCount = 0;

for (const rel of TARGET_GLOBS) {
  const filePath = path.join(ROOT, rel);
  const original = fs.readFileSync(filePath, "utf8");
  let output = original;

  for (const [name, content] of Object.entries(PARTIALS)) {
    const marker = new RegExp(
      `<!-- ${name}:START -->[\\s\\S]*?<!-- ${name}:END -->`
    );
    if (!marker.test(output)) continue;
    output = output.replace(
      marker,
      `<!-- ${name}:START -->\n${content}\n<!-- ${name}:END -->`
    );
  }

  if (output !== original) {
    fs.writeFileSync(filePath, output);
    changedCount++;
    console.log("updated:", rel);
  }
}

console.log(changedCount ? `${changedCount} file(s) synced.` : "already in sync.");

// Structured data is regenerated from each page's own title, description and
// canonical, so it stays in step with the head that was just synced.
const schemaCount = applySchema(TARGET_GLOBS);
console.log(schemaCount ? `${schemaCount} file(s) got fresh JSON-LD.` : "JSON-LD already in sync.");

console.log(buildSitemap(TARGET_GLOBS) ? "sitemap.xml regenerated." : "sitemap.xml already in sync.");
