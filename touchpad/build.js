// Syncs shared header/footer/head-common into every page that carries the
// matching marker comments. Not a deploy step — Cloudflare serves the plain
// HTML files as-is. Run this by hand after editing anything in partials/,
// then commit the regenerated pages: `node build.js`.
const fs = require("fs");
const path = require("path");
const { applySchema, buildSitemap, buildHtmlSitemap } = require("./seo-build.js");
const i18n = require("./i18n.js");
const data = require("./seo-data.js");

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, "partials");

// partials/*.html is the English set. partials/<lang>/*.html overrides any of
// them for pages in that language's folder; a partial with no translation
// (adsense.html) falls through to the English one.
function readPartials(dir) {
  const out = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const name = path.basename(entry.name, ".html").toUpperCase().replace(/-/g, "_");
    out[name] = fs.readFileSync(path.join(dir, entry.name), "utf8").trim();
  }
  return out;
}

const PARTIALS = {};
for (const lang of i18n.LANGS) {
  const dir = path.join(PARTIALS_DIR, data.languages[lang].prefix);
  PARTIALS[lang] = lang === "en" || !fs.existsSync(dir)
    ? readPartials(PARTIALS_DIR)
    : Object.assign(readPartials(PARTIALS_DIR), readPartials(dir));
}

// Every .html file in the site, at any depth (root, blog/, and blog's topic
// subfolders like blog/mouse/) — any file carrying marker comments gets
// synced, so a new page just needs the markers pasted in, never an entry
// added here.
const SKIP_DIRS = new Set(["node_modules", ".git", "partials"]);
const TARGET_GLOBS = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      TARGET_GLOBS.push(path.relative(ROOT, path.join(dir, entry.name)));
    } else if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      walk(path.join(dir, entry.name));
    }
  }
}
walk(ROOT);

// The language switcher (inside the header partial) and the hreflang tags
// (in <head>) both list the same thing: this page in every language it
// exists in. They are generated per page because the header partial is
// shared — only the build knows which translations a given page has.
const SWITCH_MARKER = /<!-- LANG_SWITCH:START -->[\s\S]*?<!-- LANG_SWITCH:END -->/;
const HREFLANG_MARKER = /\n?<!-- HREFLANG:START -->[\s\S]*?<!-- HREFLANG:END -->/;

function applyLanguageLinks(rel, html) {
  const lang = i18n.langOf(rel);
  const base = i18n.basePath(rel);
  const available = i18n.translationsOf(base);

  if (SWITCH_MARKER.test(html)) {
    // A language with no translation of this page links to its homepage
    // instead, so the switcher never points at a 404.
    const links = i18n.LANGS.map((l) => {
      const conf = data.languages[l];
      const href = available.includes(l) ? i18n.pathFor(l, base) : i18n.pathFor(l, "index.html");
      const current = l === lang ? ' aria-current="true"' : "";
      return `        <a href="${href}" hreflang="${conf.hreflang}" lang="${conf.hreflang}" title="${conf.label}"${current}>${conf.short}</a>`;
    });
    html = html.replace(
      SWITCH_MARKER,
      `<!-- LANG_SWITCH:START -->\n      <div class="lang-switch">\n${links.join("\n")}\n      </div>\n      <!-- LANG_SWITCH:END -->`
    );
  }

  // hreflang only for indexable pages (they carry a canonical) that actually
  // have another language. Every member of the set lists all the others and
  // itself, and English is the x-default.
  const indexable = /<link rel="canonical"/.test(html);
  if (!indexable || available.length < 2) return html.replace(HREFLANG_MARKER, "");

  const tags = available.map(
    (l) => `<link rel="alternate" hreflang="${data.languages[l].hreflang}" href="${i18n.urlFor(l, base)}">`
  );
  if (available.includes("en")) {
    tags.push(`<link rel="alternate" hreflang="x-default" href="${i18n.urlFor("en", base)}">`);
  }
  const block = `<!-- HREFLANG:START -->\n${tags.join("\n")}\n<!-- HREFLANG:END -->`;
  if (HREFLANG_MARKER.test(html)) return html.replace(HREFLANG_MARKER, "\n" + block);
  // First run on this page: right after the canonical, which it extends.
  return html.replace(/(<link rel="canonical"[^>]*>)/, `$1\n${block}`);
}

let changedCount = 0;

for (const rel of TARGET_GLOBS) {
  const filePath = path.join(ROOT, rel);
  const original = fs.readFileSync(filePath, "utf8");
  let output = original;

  const lang = i18n.langOf(rel);
  for (const [name, content] of Object.entries(PARTIALS[lang])) {
    const marker = new RegExp(
      `<!-- ${name}:START -->[\\s\\S]*?<!-- ${name}:END -->`
    );
    if (!marker.test(output)) continue;
    output = output.replace(
      marker,
      `<!-- ${name}:START -->\n${content}\n<!-- ${name}:END -->`
    );
  }

  output = applyLanguageLinks(rel, output);

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
console.log(buildHtmlSitemap(TARGET_GLOBS) ? "sitemap.html regenerated." : "sitemap.html already in sync.");
