import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { runInNewContext } from "node:vm";
import path from "node:path";
import assert from "node:assert/strict";

const dist = process.env.NEXT_DIST_DIR || ".next";
const sandbox = {};
runInNewContext(
  await readFile(
    path.join(dist, "server/app/page_client-reference-manifest.js"),
    "utf8",
  ),
  sandbox,
);
const manifest = sandbox.__RSC_MANIFEST["/page"];
const entry = Object.entries(manifest.clientModules).find(
  ([name]) =>
    name.endsWith("handscroll\\HandscrollController.tsx") ||
    name.endsWith("handscroll/HandscrollController.tsx"),
)?.[1];
assert(
  entry,
  "Handscroll controller must be present in the production manifest",
);
const chunks = await Promise.all(
  [...new Set(entry.chunks.filter((chunk) => chunk.endsWith(".js")))].map(
    async (chunk) => {
      const source = await readFile(path.join(dist, chunk));
      return {
        file: chunk,
        bytes: source.length,
        gzip: gzipSync(source).length,
      };
    },
  ),
);
// Conservative bound: count EVERY chunk referenced by the hero, including GSAP,
// shared UI, forms and navigation. No dependency subtraction can hide regressions.
const total = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);
console.table(chunks);
console.log(
  `Hero dependency chunks, INCLUDING GSAP and shared page UI: ${total} gzip bytes`,
);
assert(total < 60000, "Conservative hero dependency budget exceeds 60 KB gzip");
