// 一次性补丁：盒子以墨迹为中心（用后即删）
const fs = require('fs');
const file = 'apk/assets/tydlig.html';
let s = fs.readFileSync(file, 'utf8');

const a = `  const v = textInk(f, text);
  const vc = n.y + (label ? 8 : 0);             // 数值墨迹中心
  let top = vc - v.asc, bottom = vc + v.desc, w = v.w;
  if (label) {
    labelInk = textInk(\`400 12px \${FONT_STACK}\`, label);
    const lc = n.y - px / 2;                    // 标签墨迹中心
    top = Math.min(top, lc - labelInk.asc);
    bottom = Math.max(bottom, lc + labelInk.desc);
    w = Math.max(w, labelInk.w);
  }`;

const b = `  const v = textInk(f, text);
  const vc = n.y + (label ? 8 : 0);             // 数值墨迹中心
  let top = vc - (v.asc + v.desc) / 2, bottom = vc + (v.asc + v.desc) / 2, w = v.w;
  if (label) {
    labelInk = textInk(\`400 12px \${FONT_STACK}\`, label);
    const lc = n.y - px / 2;                    // 标签墨迹中心
    top = Math.min(top, lc - (labelInk.asc + labelInk.desc) / 2);
    bottom = Math.max(bottom, lc + (labelInk.asc + labelInk.desc) / 2);
    w = Math.max(w, labelInk.w);
  }`;

if (!s.includes(a)) { console.log('MISS'); process.exit(1); }
s = s.split(a).join(b);
fs.writeFileSync(file, s);
console.log('bounds centered on ink center');
