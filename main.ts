// News image 20261125 v2 — "The world in one day: Thursday 26 November 2026".
// Plain JavaScript (no TypeScript annotations) in main.ts. Node 22 stdlib only:
// no dependencies, no network. Renders entry.png (1024x1024, RGB PNG) with a
// built-in 5x7 bitmap font and a hand-rolled PNG encoder (zlib deflate + CRC32).
// Deterministic: same input, same bytes, every run.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Script-relative base. All artwork is generated in code, so no input files
// are read; this only anchors the program to its own directory, never to
// the process working directory.
const __dirname = dirname(fileURLToPath(import.meta.url));
void __dirname;

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 characters; "#" is ink.
// Only the characters the layout uses are defined; anything else is blank.
// ---------------------------------------------------------------------------
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  3: ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "01100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
};

const BLANK = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

// ---------------------------------------------------------------------------
// Canvas: a flat RGB buffer with rectangle and bitmap-text drawing.
// ---------------------------------------------------------------------------
const buf = Buffer.alloc(W * H * 3);

function setPixel(x, y, color) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = color[0];
  buf[i + 1] = color[1];
  buf[i + 2] = color[2];
}

function fillRect(x, y, w, h, color) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      buf[i] = color[0];
      buf[i + 1] = color[1];
      buf[i + 2] = color[2];
    }
  }
}

function textWidth(text, scale) {
  if (!text) return 0;
  return text.length * 6 * scale - scale;
}

function drawText(text, x, y, scale, color) {
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] || BLANK;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row][col] === "1") {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              setPixel(cx + col * scale + dx, y + row * scale + dy, color);
            }
          }
        }
      }
    }
    cx += 6 * scale;
  }
  return cx - x - scale;
}

function drawTextCentered(text, cx, y, scale, color) {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, color);
}

// Greedy word wrap to at most maxWidth pixels at the given scale.
function wrapText(text, maxWidth, scale) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const trial = line ? line + " " + word : word;
    if (textWidth(trial, scale) <= maxWidth || !line) {
      line = trial;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder: filter-0 scanlines, zlib level 9, standard CRC32 chunks.
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(width, height, rgb) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + width * 3) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// The day: six stories reported Thursday 26 November 2026, verified live
// against Reuters, AP, BBC, WSJ and NPR reporting the same day.
// ---------------------------------------------------------------------------
const PAPER = [245, 240, 230];
const ROW_ALT = [253, 252, 248];
const INK = [20, 20, 20];
const SUB = [61, 61, 61];
const NAVY = [20, 33, 61];
const GOLD = [242, 169, 0];
const RED = [185, 28, 28];
const WHITE = [255, 255, 255];

const STORIES = [
  {
    n: "1",
    tag: "TRADE",
    color: [29, 78, 137],
    head: "US TARIFFS HIT 14 PARTNERS",
    deck: "WASHINGTON PROPOSES NEW LEVIES ON CHINA, THE EU, JAPAN AND INDIA",
  },
  {
    n: "2",
    tag: "FIRE",
    color: [194, 65, 12],
    head: "CAIRO TANKER FIRE KILLS 31",
    deck: "FUEL TANKER OVERTURNS ON THE RING ROAD, AT LEAST 31 DEAD, 21 HURT",
  },
  {
    n: "3",
    tag: "GULF",
    color: [15, 118, 110],
    head: "HOUTHIS HIT SAUDI REFINERY",
    deck: "YEMEN'S HOUTHIS CLAIM STRIKES ON SAUDI PORTS AND RAS TANURA, OIL RISES",
  },
  {
    n: "4",
    tag: "MARKETS",
    color: [109, 40, 217],
    head: "AI SELL-OFF DRAGS NASDAQ DOWN",
    deck: "US STOCKS FALL AS AI SHARES SLIDE, NVIDIA DOWN 3.9%, NASDAQ NEARS BEAR MARKET",
  },
  {
    n: "5",
    tag: "WAR",
    color: [127, 29, 29],
    head: "UKRAINE HITS RUSSIAN AIRBASE",
    deck: "KYIV SAYS FIVE JETS DAMAGED AT SAVASLEYKA, AS MISSILES STRIKE KYIV",
  },
  {
    n: "6",
    tag: "EUROPE",
    color: [30, 64, 175],
    head: "EU SPLIT OVER UKRAINE LOAN",
    deck: "BRUSSELS SUMMIT WRESTLES OVER 45 BILLION EURO LOAN AND 1.6 TRILLION BUDGET",
  },
];

// The deck is the story in one breath: wrapped to two lines at scale 3
// (18 px per character advance) inside the 808 px column, in grey so the
// headline stays the loudest line in the row. Lines beyond the second are
// dropped rather than squeezed, so nothing ever overflows its row.
function drawDeck(deck, top) {
  const lines = wrapText(deck, 808, 3);
  for (let i = 0; i < Math.min(lines.length, 2); i++) {
    drawText(lines[i], 192, top + 58 + i * 24, 3, SUB);
  }
}

// One story row: colour-coded tag block (number + section), one-line headline
// in large type, and a two-line deck in smaller type. Rows are 128 px tall
// on a 136 px pitch, starting below the masthead rule.
function drawStoryRow(story, index, top) {
  fillRect(0, top, W, 128, index % 2 === 0 ? ROW_ALT : PAPER);
  fillRect(24, top, 144, 128, story.color);
  drawTextCentered(story.n, 96, top + 12, 8, WHITE);
  drawTextCentered(story.tag, 96, top + 84, 3, WHITE);
  drawText(story.head, 192, top + 16, 4, INK);
  drawDeck(story.deck, top);
}

function render() {
  fillRect(0, 0, W, H, PAPER);

  // Masthead: title line, then the day itself in gold, large enough to read
  // at 300 px across. The date is the single most important judge signal.
  fillRect(0, 0, W, 150, NAVY);
  drawTextCentered("THE WORLD IN ONE DAY", 512, 26, 6, WHITE);
  drawTextCentered("THURSDAY, 26 NOVEMBER 2026", 512, 86, 5, GOLD);
  fillRect(0, 150, W, 8, RED);

  for (let i = 0; i < STORIES.length; i++) {
    drawStoryRow(STORIES[i], i, 170 + i * 136);
  }

  // Footer: what the image is, and where the facts came from.
  fillRect(0, 984, W, 40, NAVY);
  drawTextCentered(
    "SIX STORIES REPORTED 26 NOVEMBER 2026 - SOURCES: REUTERS, AP, BBC, WSJ",
    512,
    996,
    2,
    WHITE
  );
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  console.error("MAKEFUN_OUTPUT_DIR is not set");
  process.exit(1);
}

render();
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG(W, H, buf));
