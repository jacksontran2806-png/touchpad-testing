// Page metadata that cannot be read out of the HTML itself.
//
// Titles, descriptions and canonical URLs are NOT listed here on purpose —
// build.js parses those straight from each page, so there is exactly one
// source of truth for them and the JSON-LD can never drift from the <head>.
module.exports = {
  siteUrl: "https://hardwaretesthub.net",
  siteName: "Hardware Test Hub",
  ogImage: "/og-image.png",

  // The date the site's original pages went live. Anything added later needs
  // a `published` entry below; everything falls back to this.
  defaultDate: "2026-08-27",

  // datePublished — when the page first went live. Set once, then never
  // touched again. A page that claims to be published later than it was
  // loses the age signal it has already earned.
  published: {
    "contact.html": "2026-09-08",
    "terms-and-conditions.html": "2026-09-14",
    "disclaimer.html": "2026-09-14",
    "blog/mouse/mouse-double-clicking-single-click.html": "2026-09-03",
    "blog/mouse/mouse-scrolling-wrong-direction.html": "2026-09-03",
    "blog/mouse/mouse-light-on-cursor-not-moving.html": "2026-09-03",
    "blog/keyboard/keyboard-typing-multiple-letters.html": "2026-09-14",
    "blog/keyboard/wasd-arrow-keys-swapped.html": "2026-09-14",
    "blog/keyboard/keyboard-typing-numbers-instead-of-letters.html": "2026-09-14",
  },

  // dateModified — and the sitemap's lastmod. Bump the entry for a page when
  // you meaningfully rewrite it; dateModified is a ranking input for guides,
  // and lying about it is worse than leaving it stale. Pages with no entry
  // fall back to their published date.
  dates: {
    "contact.html": "2026-09-08",
    "privacy-policy.html": "2026-09-14",
    "terms-and-conditions.html": "2026-09-14",
    "disclaimer.html": "2026-09-14",
    // The 2026-09-04 entries below were the FAQ-accordion rewrite. They were
    // baked into the pages' JSON-LD but never recorded here, so a build was
    // silently rolling them back to defaultDate — pinned now.
    "blog/keyboard/keyboard-not-working.html": "2026-09-04",
    "blog/keyboard/keyboard-key-not-working.html": "2026-09-04",
    "blog/mouse/mouse-not-working.html": "2026-09-04",
    "blog/mouse/mouse-double-clicking-fix.html": "2026-09-04",
    "blog/mouse/mouse-scroll-not-working.html": "2026-09-04",
    "blog/trackpad/mac-trackpad-not-working.html": "2026-09-04",
    "blog/trackpad/windows-touchpad-not-working.html": "2026-09-04",
    "blog/mouse/mouse-double-clicking-single-click.html": "2026-09-03",
    "blog/mouse/mouse-scrolling-wrong-direction.html": "2026-09-03",
    "blog/mouse/mouse-light-on-cursor-not-moving.html": "2026-09-03",
    "blog/keyboard/keyboard-typing-multiple-letters.html": "2026-09-14",
    "blog/keyboard/wasd-arrow-keys-swapped.html": "2026-09-14",
    "blog/keyboard/keyboard-typing-numbers-instead-of-letters.html": "2026-09-14",
  },

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
