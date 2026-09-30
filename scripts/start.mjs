import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = process.env.NEXT_DIST_DIR || ".next";
await import(pathToFileURL(path.resolve(dist, "standalone", "server.js")).href);
