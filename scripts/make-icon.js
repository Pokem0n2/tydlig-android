// Generate launcher icons (mipmap-*) for 有数 without any image library:
// software rasterizer (4x supersampled) + raw PNG encoder (node:zlib).
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- helpers over an Float RGBA accumulator ----------
function canvas(S) { return { S, px: new Float32Array(S * S * 4) }; }
function blend(cv, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= cv.S || y >= cv.S || a <= 0) return;
  const i = (y * cv.S + x) * 4, d = cv.px;
  const ia = a + d[i + 3] * (1 - a);
  if (ia <= 0) return;
  d[i]     = (r * a + d[i]     * d[i + 3] * (1 - a)) / ia;
  d[i + 1] = (g * a + d[i + 1] * d[i + 3] * (1 - a)) / ia;
  d[i + 2] = (b * a + d[i + 2] * d[i + 3] * (1 - a)) / ia;
  d[i + 3] = ia;
}
// Signed distance to a rounded rect (negative inside) — textbook form.
function rrSDF(x, y, cx, cy, hw, hh, rad) {
  const qx = Math.abs(x - cx) - hw + rad;
  const qy = Math.abs(y - cy) - hh + rad;
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - rad;
}
function lerp(a, b, t) { return a + (b - a) * t; }

// Draw the icon at supersample factor 4, then box-downsample.
function render(size) {
  const SS = 4, S = size * SS;
  const cv = canvas(S);
  const u = S / 100; // percent units

  // background rounded square, vertical gradient #2E2E34 -> #1B1B20
  const bgRad = 22 * u;
  for (let y = 0; y < S; y++) {
    const t = y / S;
    const r = lerp(0x2e, 0x1b, t), g = lerp(0x2e, 0x1b, t), b = lerp(0x34, 0x20, t);
    for (let x = 0; x < S; x++) {
      const d = rrSDF(x + .5, y + .5, S / 2, S / 2, S / 2, S / 2, bgRad);
      if (d < 0) blend(cv, x, y, r, g, b, 1);
    }
  }

  // subtle top sheen (white alpha inside the same rounded shape, upper half)
  for (let y = 0; y < S; y++) {
    const t = Math.max(0, 1 - (y / S) / 0.55);
    if (t <= 0) continue;
    for (let x = 0; x < S; x++) {
      const d = rrSDF(x + .5, y + .5, S / 2, S / 2, S / 2, S / 2, bgRad);
      if (d < 0) blend(cv, x, y, 255, 255, 255, 0.07 * t);
    }
  }

  // blue "=" (two rounded bars), gradient #4AA8FF -> #0A84FF, soft shadow
  const bar = { hw: 24 * u, hh: 5 * u, rad: 5 * u };
  const bars = [39, 61];
  for (const cyPct of bars) {
    const cy = cyPct * u, cx = S / 2;
    for (let y = 0; y < S; y++) {
      const tg = (y - (cy - bar.hh)) / (2 * bar.hh);
      const r = lerp(0x4a, 0x0a, Math.min(1, Math.max(0, tg)));
      const g = lerp(0xa8, 0x84, Math.min(1, Math.max(0, tg)));
      const b = lerp(0xff, 0xff, Math.min(1, Math.max(0, tg)));
      for (let x = 0; x < S; x++) {
        const d = rrSDF(x + .5, y + .5, cx, cy, bar.hw, bar.hh, bar.rad);
        if (d < 0) blend(cv, x, y, r, g, b, 1);
        else if (d < 1.5 * SS) blend(cv, x, y, 0, 0, 0, 0.25 * (1 - d / (1.5 * SS))); // shadow halo
      }
    }
  }

  // downsample 4x4 -> pixel
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const i = ((y * SS + sy) * S + (x * SS + sx)) * 4;
        const al = cv.px[i + 3]; // alpha stored 0..1
        r += cv.px[i] * al; g += cv.px[i + 1] * al; b += cv.px[i + 2] * al; a += al;
      }
      const o = (y * size + x) * 4;
      if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
      out[o + 3] = (a / (SS * SS)) * 255;
    }
  }
  return encodePNG(size, size, out);
}

const root = path.join(__dirname, '..', 'apk', 'res');
const sizes = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
for (const [dir, size] of Object.entries(sizes)) {
  const p = path.join(root, dir, 'ic_launcher.png');
  fs.writeFileSync(p, render(size));
  console.log('wrote', p, size + 'px');
}
