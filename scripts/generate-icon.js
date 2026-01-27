const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '../assets');
const svgPath = path.join(assetsDir, 'icon.svg');
const pngPath = path.join(assetsDir, 'icon.png');
const icoPath = path.join(assetsDir, 'icon.ico');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function generateIcons() {
  try {
    // Dynamically import the ES module
    const pngToIco = await import('png-to-ico');
    
    // Convert SVG to PNG (256x256 for Windows)
    const info = await sharp(svgPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 99, g: 102, b: 241, alpha: 1 } // Indigo color
      })
      .png()
      .toFile(pngPath);

    const pngToIcoFn = pngToIco.default || pngToIco;
    const icoBuffer = await pngToIcoFn(pngPath);
    fs.writeFileSync(icoPath, icoBuffer);

    console.log('✓ Icon converted successfully:', info);
    console.log('✓ ICO generated successfully:', { path: icoPath });
  } catch (err) {
    console.error('✗ Failed to convert icon:', err);
    process.exit(1);
  }
}

generateIcons();
