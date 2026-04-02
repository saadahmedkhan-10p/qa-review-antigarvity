const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, 'public', 'brand-logo.png');
const pagePath = path.join(__dirname, 'src', 'app', 'page.tsx');

try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    let pageContent = fs.readFileSync(pagePath, 'utf8');

    // Regex to find the img src
    const regex = /<img src="[^"]+" alt="QA Review Logo"/;

    if (regex.test(pageContent)) {
        const newContent = pageContent.replace(regex, `<img src="${dataUrl}" alt="QA Review Logo"`);
        fs.writeFileSync(pagePath, newContent);
        console.log('Successfully injected base64 logo into page.tsx');
    } else {
        console.error('Could not find img tag in page.tsx');
        process.exit(1);
    }

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
