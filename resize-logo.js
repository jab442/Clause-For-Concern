const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Source image
const sourceImage = path.join(__dirname, 'src/views/icons/icon128.png');

// Target directory for logo icons
const logoDir = path.join(__dirname, 'src/icons/logo');

// Sizes needed for the logo
const sizes = [16, 32, 48, 64, 128];

async function resizeLogos() {
    // Ensure the logo directory exists
    if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
    }

    console.log(`Source image: ${sourceImage}`);
    console.log(`Target directory: ${logoDir}`);
    console.log('');

    for (const size of sizes) {
        const outputPath = path.join(logoDir, `logo${size}.png`);
        try {
            await sharp(sourceImage)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toFile(outputPath);
            console.log(`✓ Created logo${size}.png (${size}x${size})`);
        } catch (error) {
            console.error(`✗ Failed to create logo${size}.png:`, error.message);
        }
    }

    console.log('\nDone! Logo icons have been resized.');
}

resizeLogos().catch(console.error);
