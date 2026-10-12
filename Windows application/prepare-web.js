const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "..", "web application", "dist");
const dest = path.join(__dirname, "dist");

if (!fs.existsSync(src)) {
  console.error(`[prepare-web] Web build not found at ${src}. Run the web export first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[prepare-web] Copied web build -> ${dest}`);
