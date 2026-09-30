import { cp } from "node:fs/promises";
import path from "node:path";

const dist = process.env.NEXT_DIST_DIR || ".next";
const standalone = path.join(dist, "standalone");
await cp("public", path.join(standalone, "public"), { recursive: true });
await cp(path.join(dist, "static"), path.join(standalone, dist, "static"), {
  recursive: true,
});
console.log("Standalone server assets are ready.");
