const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "..", "core", "dist");
const dest = path.join(__dirname, "dist");

if (!fs.existsSync(src)) {
  console.error(`[prepare-core] Core build not found at ${src}. Run the core build first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`[prepare-core] Copied core build -> ${dest}`);
