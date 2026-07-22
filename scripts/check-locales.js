#!/usr/bin/env node
/**
 * Ensure all locale files share the same key set as en.json.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "locales");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

const en = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));
const enKeys = Object.keys(en).sort();
let failed = false;

for (const file of files) {
  if (file === "en.json") continue;
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const keys = Object.keys(data).sort();
  const missing = enKeys.filter((k) => !(k in data));
  const extra = keys.filter((k) => !(k in en));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`Locale ${file}:`);
    if (missing.length) console.error("  missing:", missing.join(", "));
    if (extra.length) console.error("  extra:", extra.join(", "));
  } else {
    console.log(`OK ${file} (${keys.length} keys)`);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`All locales match en.json (${enKeys.length} keys).`);
