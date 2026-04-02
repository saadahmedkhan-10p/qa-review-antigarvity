const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createFavicon() {
    const logoPath = path.join(__dirname, '../public/logo.png');
    const faviconPath = path.join(__dirname, '../public/favicon.ico');

    // Create a 32x32 PNG first
    const pngBuffer = await sharp(logoPath)
        .resize(32, 32, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

    // For now, just save as PNG (browsers accept PNG as .ico)
    fs.writeFileSync(faviconPath, pngBuffer);
    console.log('Favicon created successfully at:', faviconPath);
}

createFavicon().catch(console.error);
