const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SIZE = 256;
const outputDir = path.join(__dirname, 'electron');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// ── Create SVG with transparent background ──
const svg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="48" fill="url(#bg)"/>
  <text x="128" y="164" font-family="Arial, sans-serif" font-size="160" font-weight="bold" fill="white" text-anchor="middle">B</text>
</svg>`;

async function createIcons() {
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  // Save PNG for electron main process
  await sharp(pngBuffer).toFile(path.join(outputDir, 'icon.png'));
  console.log('Created icon.png');

  // Also put in frontend/ for electron-builder
  await sharp(pngBuffer).toFile(path.join(__dirname, 'build', 'icon.png'));
  console.log('Created build/icon.png for electron-builder');
}

createIcons().catch(console.error);
