// Rebuild the published page after editing _source/index.html:
//   SITE_PASSWORD='the password' node _source/encrypt.mjs
// GitHub Pages does not publish this _source directory.

import { webcrypto } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ITERATIONS = 100000;
const root = dirname(fileURLToPath(import.meta.url));
const password = process.env.SITE_PASSWORD;

if (!password) {
  console.error("Set SITE_PASSWORD to the site password, then re-run.");
  process.exit(1);
}

const page = readFileSync(join(root, "index.html"));
const salt = webcrypto.getRandomValues(new Uint8Array(16));
const iv = webcrypto.getRandomValues(new Uint8Array(12));

const keyMaterial = await webcrypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveKey"]
);
const key = await webcrypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  keyMaterial,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt", "decrypt"]
);
const cipher = new Uint8Array(
  await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, page)
);
const packed = new Uint8Array(salt.length + iv.length + cipher.length);
packed.set(salt, 0);
packed.set(iv, salt.length);
packed.set(cipher, salt.length + iv.length);

const roundTrip = new TextDecoder().decode(
  await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    packed.slice(salt.length + iv.length)
  )
);
if (roundTrip !== new TextDecoder().decode(page)) {
  console.error("Decrypt check failed.");
  process.exit(1);
}

const payload = Buffer.from(packed).toString("base64");
const gate = readFileSync(join(root, "gate.html"), "utf8")
  .replaceAll("__PAYLOAD__", payload)
  .replaceAll("__ITERATIONS__", String(ITERATIONS));

const leaked = ["__PAYLOAD__", "__ITERATIONS__", password, "Barbara Lee", "Measure EE", "Vote NO"];
for (const phrase of leaked) {
  if (gate.includes(phrase)) {
    console.error(`Published page still contains ${JSON.stringify(phrase)}.`);
    process.exit(1);
  }
}

writeFileSync(join(root, "..", "index.html"), gate);
console.log(`Wrote index.html (${gate.length} bytes).`);
