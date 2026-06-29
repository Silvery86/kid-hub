#!/usr/bin/env node
// Generates PWA icon PNGs for Kid Hub using only Node.js built-ins.
// Output: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png, favicon-32.png
//
// Design: solid blue (#3B82F6) background + white 5-pointed star (top point up)
//         with three small yellow sparkle dots — matches app theme.

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 (required for PNG chunks) ──────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk builder ─────────────────────────────────────────────────────────
function chunk(type, data) {
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t    = Buffer.from(type, 'ascii');
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcB]);
}

// ── Encode RGBA pixel array → PNG buffer ─────────────────────────────────────
function toPNG(w, h, pixels) {
  // pixels: Uint8Array of length w*h*4 (RGBA, row-major)
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  // Add filter byte (0 = None) before each row
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 4;
      const dst = y * (1 + w * 4) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function starPolygon(cx, cy, outerR, innerR, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    // Start at top (-90°), each spoke is 360/(2n) degrees
    const angle = (i * Math.PI) / n - Math.PI / 2;
    const r = (i % 2 === 0) ? outerR : innerR;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ── Per-pixel renderer ────────────────────────────────────────────────────────
// Colors
const BG_R = 59, BG_G = 130, BG_B = 246;   // #3B82F6  (theme blue)
const STAR_R = 255, STAR_G = 255, STAR_B = 255;  // white star
const DOT_R = 250, DOT_G = 204, DOT_B = 21;      // #FACC15  yellow sparkles

function drawPixel(x, y, w, h, starPoly, dotCentres, dotRadius, safeR) {
  const cx = w / 2, cy = h / 2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Circular clip for apple-touch-icon (safeR > 0)
  if (safeR > 0 && dist > safeR) {
    return [0, 0, 0, 0]; // transparent
  }

  // Background
  let r = BG_R, g = BG_G, b = BG_B, a = 255;

  // Yellow sparkle dots
  for (const [dcx, dcy] of dotCentres) {
    const dd = Math.sqrt((x - dcx) ** 2 + (y - dcy) ** 2);
    if (dd <= dotRadius) {
      return [DOT_R, DOT_G, DOT_B, 255];
    }
  }

  // White star
  if (pointInPolygon(x, y, starPoly)) {
    r = STAR_R; g = STAR_G; b = STAR_B;
  }

  return [r, g, b, a];
}

// ── Generate one icon ─────────────────────────────────────────────────────────
function genIcon(w, h, { roundClip = false } = {}) {
  const cx = w / 2, cy = h / 2;
  const outerR = w * 0.40;
  const innerR = outerR * 0.40;
  const star = starPolygon(cx, cy, outerR, innerR);

  // Three sparkle dots — top-right, left, bottom-right
  const dotR  = Math.max(2, w * 0.045);
  const orbR  = outerR * 1.55;
  const dots  = [
    [cx + orbR * Math.cos(-0.4), cy + orbR * Math.sin(-0.4)],
    [cx + orbR * Math.cos(Math.PI - 0.4), cy + orbR * Math.sin(Math.PI - 0.4)],
    [cx + orbR * Math.cos(Math.PI + 1.2), cy + orbR * Math.sin(Math.PI + 1.2)],
  ];

  const safeR = roundClip ? w * 0.46 : 0;

  const pixels = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [pr, pg, pb, pa] = drawPixel(x, y, w, h, star, dots, dotR, safeR);
      const i = (y * w + x) * 4;
      pixels[i] = pr; pixels[i+1] = pg; pixels[i+2] = pb; pixels[i+3] = pa;
    }
  }
  return toPNG(w, h, pixels);
}

// ── Write files ───────────────────────────────────────────────────────────────
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const icons = [
  { file: 'icon-192.png',         w: 192, h: 192 },
  { file: 'icon-512.png',         w: 512, h: 512 },
  { file: 'apple-touch-icon.png', w: 180, h: 180, roundClip: true },
  { file: 'favicon-32.png',       w:  32, h:  32 },
];

for (const { file, w, h, roundClip } of icons) {
  const buf = genIcon(w, h, { roundClip });
  fs.writeFileSync(path.join(OUT_DIR, file), buf);
  console.log(`✓  ${file}  (${w}×${h}, ${buf.length} bytes)`);
}
console.log('\nIcons saved to public/icons/');
