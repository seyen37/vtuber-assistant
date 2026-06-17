// 零相依產生托盤/視窗圖示 assets/icon.png（64x64 RGBA）。
// 純用 Node 內建 zlib 手刻 PNG，避免引入 canvas 等相依。
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 64;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// 畫一個圓底（助手主色）＋小高光，背景透明
function buildPixels() {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 3;
  // RGBA scanlines, 每行前綴 filter byte 0
  const row = SIZE * 4 + 1;
  const raw = Buffer.alloc(row * SIZE, 0);
  const bg = [124, 92, 255];     // 主色 紫
  const hl = [255, 255, 255];    // 高光
  for (let y = 0; y < SIZE; y++) {
    raw[y * row] = 0; // filter
    for (let x = 0; x < SIZE; x++) {
      const off = y * row + 1 + x * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // 抗鋸齒：邊緣 1px 漸變
      let a = 0;
      if (dist <= r - 1) a = 255;
      else if (dist < r) a = Math.round((r - dist) * 255);
      let col = bg;
      // 左上小高光圓
      const hx = x - (cx - r * 0.32), hy = y - (cy - r * 0.32);
      if (Math.sqrt(hx * hx + hy * hy) < r * 0.26) col = hl;
      raw[off] = col[0];
      raw[off + 1] = col[1];
      raw[off + 2] = col[2];
      raw[off + 3] = a;
    }
  }
  return raw;
}

function main() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(buildPixels(), { level: 9 });
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
  const out = path.join(__dirname, '..', 'assets', 'icon.png');
  fs.writeFileSync(out, png);
  console.log('wrote', out, png.length, 'bytes');
}
main();
