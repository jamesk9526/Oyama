const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '../assets');
const svgPath = path.join(assetsDir, 'icon.svg');
const pngPath = path.join(assetsDir, 'icon.png');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Convert SVG to PNG (256x256 for Windows)
sharp(svgPath)
  .resize(256, 256, {
    fit: 'contain',
    background: { r: 99, g: 102, b: 241, alpha: 1 } // Indigo color
  })
  .png()
  .toFile(pngPath)
  .then(info => {
    console.log('✓ Icon converted successfully:', info);
  })
  .catch(err => {
    console.error('✗ Failed to convert icon:', err);
    process.exit(1);
  });
