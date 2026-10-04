// Path helpers for the language subdirectories. Build-time only, like
// seo-build.js — never loaded by a page.
//
// A page's language comes from its top-level folder (es/, de/); anything else
// is English. The "base" path is the page with that folder stripped, which is
// also the English original's path — so es/mouse-test.html and
// mouse-test.html share the base "mouse-test.html" and are translations of
// each other.
const fs = require("fs")
const path = require("path")
const data = require("./seo-data.js")

const ROOT = __dirname
const LANGS = Object.keys(data.languages)
const PREFIXED = LANGS.filter((l) => data.languages[l].prefix)

function norm(rel) {
  return rel.split(path.sep).join("/")
}

function langOf(rel) {
  const first = norm(rel).split("/")[0]
  return PREFIXED.find((l) => data.languages[l].prefix === first) || "en"
}

function basePath(rel) {
  const n = norm(rel)
  const lang = langOf(n)
  return lang === "en" ? n : n.slice(data.languages[lang].prefix.length + 1)
}

function fileFor(lang, base) {
  const prefix = data.languages[lang].prefix
  return prefix ? `${prefix}/${base}` : base
}

// Root-relative clean URL, matching wrangler's drop-trailing-slash handling:
// index.html -> "/", es/index.html -> "/es", es/mouse-test.html -> "/es/mouse-test".
function pathFor(lang, base) {
  const prefix = data.languages[lang].prefix
  const slug = base.replace(/\.html$/, "").replace(/(^|\/)index$/, "")
  const parts = [prefix, slug].filter(Boolean)
  return "/" + parts.join("/")
}

function urlFor(lang, base) {
  const p = pathFor(lang, base)
  return p === "/" ? `${data.siteUrl}/` : `${data.siteUrl}${p}`
}

// Every language that actually has a file for this page, English first.
function translationsOf(base) {
  return LANGS.filter((l) => fs.existsSync(path.join(ROOT, fileFor(l, base))))
}

module.exports = { LANGS, langOf, basePath, fileFor, pathFor, urlFor, translationsOf }
