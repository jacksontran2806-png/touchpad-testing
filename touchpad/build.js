// Syncs shared header/footer/head-common into every page that carries the
// matching marker comments. Not a deploy step — Cloudflare serves the plain
// HTML files as-is. Run this by hand after editing anything in partials/,
// then commit the regenerated pages: `node build.js`.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, "partials");

const PARTIALS = {};
for (const file of fs.readdirSync(PARTIALS_DIR)) {
  const name = path.basename(file, ".html").toUpperCase().replace(/-/g, "_");
  PARTIALS[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), "utf8").trim();
}

const TARGET_GLOBS = [
  "index.html",
  "404.html",
  "privacy-policy.html",
  "blog/mac-trackpad-not-working.html",
  "blog/windows-touchpad-not-working.html",
  "blog/keyboard-not-working.html",
];

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
