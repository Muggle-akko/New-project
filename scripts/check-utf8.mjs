import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([".git", ".astro", "dist", "node_modules"]);
const TEXT_EXTENSIONS = new Set([
  ".astro",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
]);

const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walk(join(dir, entry.name));
      }
      continue;
    }

    const file = join(dir, entry.name);
    if (!TEXT_EXTENSIONS.has(extname(file))) continue;
    if (!statSync(file).isFile()) continue;

    try {
      decoder.decode(readFileSync(file));
    } catch {
      failures.push(file);
    }
  }
}

walk(ROOT);

if (failures.length) {
  console.error("Non-UTF-8 files detected:");
  for (const file of failures) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("UTF-8 check passed.");
