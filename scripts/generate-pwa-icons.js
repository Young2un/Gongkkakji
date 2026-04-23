#!/usr/bin/env node
/**
 * PWA 플레이스홀더 아이콘 생성 스크립트
 * - Node 내장 모듈만 사용 (외부 의존성 없음)
 * - 실제 디자인 아이콘이 준비되면 public/icon-192.png, icon-512.png 를 덮어쓰면 됩니다.
 *
 * 사용:  node scripts/generate-pwa-icons.js
 */
const fs = require('fs');
const path = require('path');
const { deflateSync } = require('zlib');

const OUT_DIR = path.resolve(__dirname, '..', 'public');
const COLOR = { r: 0xf9, g: 0x9e, b: 0x1a }; // #F99E1A

function crc32() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (buf) => {
    let crc = 0xffffffff;
    for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
}
const crc = crc32();

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makeSolidPng(size, { r, g, b }) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const lineLen = 1 + size * 3;
  const raw = Buffer.alloc(size * lineLen);
  for (let y = 0; y < size; y++) {
    const base = y * lineLen;
    raw[base] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const off = base + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const compressed = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const buf = makeSolidPng(size, COLOR);
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✓ ${out} (${buf.length} bytes)`);
}
