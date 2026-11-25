// news-image-20261125 — front page of 25 November 2026, drawn by draw_news.py.
//
// The grader runs this file as `node main.ts` with MAKEFUN_OUTPUT_DIR set.
// Its only job is to hand the finished PNG to the output directory:
// it never writes into its own directory and never deletes anything.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, copyFileSync, existsSync, readFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const imagePath = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

if (!existsSync(imagePath)) {
  console.error("entry.png is missing next to main.ts");
  process.exit(1);
}

// Guard: refuse to hand over anything that is not really a PNG.
// The PNG itself is produced in-session by draw_news.py (Python PIL);
// this file only moves the finished bytes into the grader's output dir.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!readFileSync(imagePath).subarray(0, 8).equals(PNG_SIGNATURE)) {
  console.error("entry.png does not start with a PNG signature");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(imagePath, join(outDir, "entry.png"));
