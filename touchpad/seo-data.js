// Page metadata that cannot be read out of the HTML itself.
//
// Titles, descriptions and canonical URLs are NOT listed here on purpose —
// build.js parses those straight from each page, so there is exactly one
// source of truth for them and the JSON-LD can never drift from the <head>.
module.exports = {
  siteUrl: "https://hardwaretesthub.net",
  siteName: "Hardware Test Hub",
  ogImage: "/og-image.png",

  // Every page carries this until a post is genuinely revised. Bump the entry
  // for a page when you meaningfully rewrite it — dateModified is a ranking
  // input for guides, and lying about it is worse than leaving it stale.
  defaultDate: "2026-08-27",
  dates: {},

  // Interactive tools -> WebApplication. `section` drives the breadcrumb.
  tools: {
    "mouse-test.html": { section: "Mouse & Trackpad" },
    "mouse-double-click-test.html": { section: "Mouse & Trackpad" },
    "mouse-scroll-test.html": { section: "Mouse & Trackpad" },
    "trackpad-test.html": { section: "Mouse & Trackpad" },
    "keyboard-test.html": { section: "Keyboard" },
    "keyboard-ghosting-test.html": { section: "Keyboard" },
    "cps-test.html": { section: "Gaming" },
    "reaction-time-test.html": { section: "Gaming" },
  },

  // Ordered as they appear on the homepage, for the ItemList on `/`.
  homepageTools: [
    "mouse-test",
    "mouse-double-click-test",
    "mouse-scroll-test",
    "trackpad-test",
    "keyboard-test",
    "keyboard-ghosting-test",
    "cps-test",
    "reaction-time-test",
  ],
}
