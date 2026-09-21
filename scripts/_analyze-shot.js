// 截图像素分析：解码 PNG（处理全部行过滤器），输出蓝色像素的行/列分布（用后即删）
const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const buf = fs.readFileSync(file);
let pos = 8, w = 0, h = 0, idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.slice(pos + 8, pos + 8 + len);
  if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); }
  if (type === 'IDAT') idat.push(data);
  pos += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const bpp = 4, stride = w * bpp;
const out = Buffer.alloc(h * stride);
const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};
for (let y = 0; y < h; y++) {
  const ft = raw[y * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const xv = x % bpp;
    const r = raw[y * (stride + 1) + 1 + x];
    const a = xv >= bpp ? out[y * stride + x - bpp] : 0;
    const b = y > 0 ? out[(y - 1) * stride + x] : 0;
    const c = y > 0 && xv >= bpp ? out[(y - 1) * stride + x - bpp] : 0;
    let v;
    if (ft === 0) v = r;
    else if (ft === 1) v = r + a;
    else if (ft === 2) v = r + b;
    else if (ft === 3) v = r + ((a + b) >> 1);
    else v = r + paeth(a, b, c);
    out[y * stride + x] = v & 255;
  }
}
const isBlue = (x, y) => {
  const i = y * stride + x * 4;
  return out[i + 3] > 120 && out[i + 2] > 90 && out[i + 2] > out[i] + 25;
};
const rowHist = [], colHist = [];
for (let y = 0; y < h; y++) {
  let c = 0;
  for (let x = 0; x < w; x++) if (isBlue(x, y)) c++;
  rowHist.push(c);
}
for (let x = 0; x < w; x++) {
  let c = 0;
  for (let y = 0; y < h; y++) if (isBlue(x, y)) c++;
  colHist.push(c);
}
// 输出行直方图（有蓝色像素的行段）
let segs = [], start = -1;
for (let y = 0; y < h; y++) {
  if (rowHist[y] > 0 && start < 0) start = y;
  if (rowHist[y] === 0 && start >= 0) { segs.push([start, y - 1]); start = -1; }
}
if (start >= 0) segs.push([start, h - 1]);
console.log('size', w, 'x', h);
console.log('row segments (y: count):');
for (const [a, b] of segs) {
  let sum = 0; for (let y = a; y <= b; y++) sum += rowHist[y];
  console.log(`  y ${a}-${b} (${b - a + 1}px, total ${sum})`);
}
let csegs = []; start = -1;
for (let x = 0; x < w; x++) {
  if (colHist[x] > 0 && start < 0) start = x;
  if (colHist[x] === 0 && start >= 0) { csegs.push([start, x - 1]); start = -1; }
}
if (start >= 0) csegs.push([start, w - 1]);
console.log('col segments (x: count):');
for (const [a, b] of csegs) {
  let sum = 0; for (let x = a; x <= b; x++) sum += colHist[x];
  console.log(`  x ${a}-${b} (${b - a + 1}px, total ${sum})`);
}
