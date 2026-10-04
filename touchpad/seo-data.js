// Page metadata that cannot be read out of the HTML itself.
//
// Titles, descriptions and canonical URLs are NOT listed here on purpose —
// build.js parses those straight from each page, so there is exactly one
// source of truth for them and the JSON-LD can never drift from the <head>.
module.exports = {
  siteUrl: "https://hardwaretesthub.net",
  siteName: "Hardware Test Hub",
  ogImage: "/og-image.png",

  // Every language the site is published in. English lives at the root; each
  // other language is a full copy of a page under its own subdirectory
  // (es/mouse-test.html -> /es/mouse-test), with the same file name as the
  // English original — that shared name is how build.js pairs translations
  // for hreflang. A page with no translation simply has no file there.
  // `home` and `sections` are the breadcrumb labels in the JSON-LD.
  languages: {
    en: { prefix: "", hreflang: "en", inLanguage: "en-US", label: "English", short: "EN", home: "Home" },
    es: { prefix: "es", hreflang: "es", inLanguage: "es", label: "Español", short: "ES", home: "Inicio", sitemapTitle: "En español" },
    de: { prefix: "de", hreflang: "de", inLanguage: "de", label: "Deutsch", short: "DE", home: "Startseite", sitemapTitle: "Auf Deutsch" },
  },
  sections: {
    "Mouse & Trackpad": { es: "Mouse y touchpad", de: "Maus & Touchpad" },
    Keyboard: { es: "Teclado", de: "Tastatur" },
    Gaming: { es: "Gaming", de: "Gaming" },
    Display: { es: "Pantalla", de: "Bildschirm" },
  },

  // The date the site's original pages went live. Anything added later needs
  // a `published` entry below; everything falls back to this.
  defaultDate: "2026-08-27",

  // datePublished — when the page first went live. Set once, then never
  // touched again. A page that claims to be published later than it was
  // loses the age signal it has already earned.
  published: {
    "contact.html": "2026-09-08",
    "cookies-policy.html": "2026-09-23",
    "sitemap.html": "2026-09-23",
    "blog/keyboard/spacebar-stuck-mushy.html": "2026-09-23",
    "blog/keyboard/spacebar-rattle-fix.html": "2026-09-23",
    "blog/keyboard/shift-key-not-working.html": "2026-09-23",
    "blog/keyboard/sticky-mechanical-switch-fix.html": "2026-09-23",
    "blog/keyboard/mechanical-switch-squeaking.html": "2026-09-23",
    "blog/keyboard/keyboard-rgb-not-working.html": "2026-09-23",
    "blog/keyboard/windows-key-disabled-fix.html": "2026-09-23",
    "blog/keyboard/keyboard-ghosting-rollover-guide.html": "2026-09-23",
    "blog/keyboard/laptop-keyboard-after-windows-update.html": "2026-09-23",
    "blog/keyboard/keyboard-disconnects-randomly.html": "2026-09-23",
    "blog/mouse/mouse-cursor-jumping.html": "2026-09-23",
    "blog/mouse/clean-mouse-sensor-lens.html": "2026-09-23",
    "blog/mouse/mouse-side-buttons-not-working.html": "2026-09-23",
    "blog/mouse/middle-click-not-working.html": "2026-09-23",
    "blog/mouse/wireless-mouse-stuttering.html": "2026-09-23",
    "blog/mouse/bluetooth-mouse-keeps-disconnecting.html": "2026-09-23",
    "blog/mouse/mouse-polling-rate-test.html": "2026-09-23",
    "blog/mouse/mouse-dpi-changed-reset.html": "2026-09-23",
    "blog/mouse/mouse-drag-drop-not-working.html": "2026-09-23",
    "blog/mouse/mouse-sensor-blinking-cursor-frozen.html": "2026-09-23",
    "terms-and-conditions.html": "2026-09-14",
    "disclaimer.html": "2026-09-14",
    "blog/mouse/mouse-double-clicking-single-click.html": "2026-09-03",
    "blog/mouse/mouse-scrolling-wrong-direction.html": "2026-09-03",
    "blog/mouse/mouse-light-on-cursor-not-moving.html": "2026-09-03",
    "blog/keyboard/keyboard-typing-multiple-letters.html": "2026-09-14",
    "blog/keyboard/wasd-arrow-keys-swapped.html": "2026-09-14",
    "blog/keyboard/keyboard-typing-numbers-instead-of-letters.html": "2026-09-14",
    // Spanish and German launch.
    "es/index.html": "2026-10-04",
    "es/mouse-test.html": "2026-10-04",
    "es/mouse-double-click-test.html": "2026-10-04",
    "es/mouse-scroll-test.html": "2026-10-04",
    "es/trackpad-test.html": "2026-10-04",
    "es/keyboard-test.html": "2026-10-04",
    "es/keyboard-ghosting-test.html": "2026-10-04",
    "es/cps-test.html": "2026-10-04",
    "es/reaction-time-test.html": "2026-10-04",
    "es/about.html": "2026-10-04",
    "es/contact.html": "2026-10-04",
    "de/index.html": "2026-10-04",
    "de/mouse-test.html": "2026-10-04",
    "de/mouse-double-click-test.html": "2026-10-04",
    "de/mouse-scroll-test.html": "2026-10-04",
    "de/trackpad-test.html": "2026-10-04",
    "de/keyboard-test.html": "2026-10-04",
    "de/keyboard-ghosting-test.html": "2026-10-04",
    "de/cps-test.html": "2026-10-04",
    "de/reaction-time-test.html": "2026-10-04",
    "de/about.html": "2026-10-04",
    "de/contact.html": "2026-10-04",
    "screen-test.html": "2026-10-04",
    "es/screen-test.html": "2026-10-04",
    "de/screen-test.html": "2026-10-04",
  },

  // dateModified — and the sitemap's lastmod. Bump the entry for a page when
  // you meaningfully rewrite it; dateModified is a ranking input for guides,
  // and lying about it is worse than leaving it stale. Pages with no entry
  // fall back to their published date.
  dates: {
    "contact.html": "2026-09-08",
    "privacy-policy.html": "2026-09-23",
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
    "screen-test.html": { section: "Display" },
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
    "screen-test",
  ],
}
