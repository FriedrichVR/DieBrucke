const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = __dirname;

// Helper to minify JS files using Terser
function minifyJS() {
    console.log('Minifying JS files...');
    try {
        execSync('npx terser script.js --compress --mangle --output script.min.js', { stdio: 'inherit' });
        execSync('npx terser admin.js --compress --mangle --output admin.min.js', { stdio: 'inherit' });
        console.log('JS files minified successfully!\n');
    } catch (err) {
        console.error('Error minifying JS files:', err.message);
    }
}

// Dependency-free CSS minifier
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
        .replace(/\s*([{}|:;,])\s*/g, '$1') // remove spaces around braces and colons
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
}

// Helper to minify CSS files
function processCSS() {
    console.log('Minifying CSS stylesheet...');
    try {
        const cssPath = path.join(dir, 'styles.src.css');
        if (fs.existsSync(cssPath)) {
            const rawCss = fs.readFileSync(cssPath, 'utf8');
            const minifiedCss = minifyCSS(rawCss);
            fs.writeFileSync(path.join(dir, 'styles.css'), minifiedCss, 'utf8');
            console.log('CSS stylesheet minified successfully!\n');
        }
    } catch (err) {
        console.error('Error minifying CSS:', err.message);
    }
}

// Helper to get WebP dimensions dynamically from file
function getWebpDimensions(src) {
    // Clean up query parameters or leading slashes
    const cleanSrc = src.split('?')[0].replace(/^\//, '');
    const filePath = path.join(dir, cleanSrc);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const buffer = fs.readFileSync(filePath);
        if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
            return null;
        }
        const chunkType = buffer.toString('ascii', 12, 16);
        if (chunkType === 'VP8 ') {
            const width = buffer.readUInt16LE(26) & 0x3FFF;
            const height = buffer.readUInt16LE(28) & 0x3FFF;
            return { width, height };
        } else if (chunkType === 'VP8L') {
            const val = buffer.readUInt32LE(21);
            const width = (val & 0x3FFF) + 1;
            const height = ((val >> 14) & 0x3FFF) + 1;
            return { width, height };
        } else if (chunkType === 'VP8X') {
            const width = (buffer.readUInt32LE(24) & 0xFFFFFF) + 1;
            const height = (buffer.readUInt32LE(27) & 0xFFFFFF) + 1;
            return { width, height };
        }
    } catch (err) {
        // Fail silently
    }
    return null;
}

// Helper to optimize Lucide script
function optimizeLucide(content) {
    const lucideRegex = /<script\s+(?:defer\s+)?src="https:\/\/unpkg\.com\/lucide@?[^"]*"><\/script>/g;
    const optimizedTag = '<script defer src="https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js"></script>';
    return content.replace(lucideRegex, optimizedTag);
}

// Helper to optimize scripts and fonts
function optimizeScriptsAndFonts(content, isWeb = true) {
    // 1. Remove Google Fonts preload
    content = content.replace(/<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com\/css2\?[^>]*>\s*/g, '');

    // 2. Remove script.js or script.min.js references
    content = content.replace(/<script\s*(?:defer\s*)?src="script(?:\.min)?\.js"><\/script>\s*/g, '');

    // 3. Remove admin.js or admin.min.js references
    content = content.replace(/<script\s*(?:defer\s*)?src="admin(?:\.min)?\.js"><\/script>\s*/g, '');

    // 4. Add deferred script to head if not present
    if (isWeb) {
        if (!content.includes('script.min.js')) {
            content = content.replace('</head>', '    <script defer src="script.min.js"></script>\n</head>');
        }
    } else {
        if (!content.includes('admin.min.js')) {
            content = content.replace('</head>', '    <script defer src="admin.min.js"></script>\n</head>');
        }
    }

    return content;
}

// Helper to optimize image tags and insert dimensions
function optimizeImgTag(imgHtml, isLcp) {
    // Remove existing attributes to start clean
    let clean = imgHtml
        .replace(/\s+loading="[^"]*"/g, '')
        .replace(/\s+fetchpriority="[^"]*"/g, '')
        .replace(/\s+decoding="[^"]*"/g, '')
        .replace(/\s+width="[^"]*"/g, '')
        .replace(/\s+height="[^"]*"/g, '')
        .replace(/\s+/g, ' ');

    // Extract src to find dimensions
    const srcMatch = clean.match(/src="([^"]+)"/);
    let dims = null;
    if (srcMatch) {
        dims = getWebpDimensions(srcMatch[1]);
    }

    // Reconstruct with optimal attributes
    let attrs = '';
    if (isLcp) {
        attrs += ' fetchpriority="high" decoding="async"';
    } else {
        attrs += ' loading="lazy" decoding="async"';
    }

    if (dims) {
        attrs += ` width="${dims.width}" height="${dims.height}"`;
    }

    clean = clean.replace('<img', `<img${attrs}`);
    clean = clean.replace(/\s*\/?>$/, '>');
    return clean;
}

// Helper to optimize a carousel block
function optimizeCarousel(content, carouselSelectorRegex, isBelowFold) {
    const match = content.match(carouselSelectorRegex);
    if (!match) return content;

    const fullBlock = match[0];
    const innerContent = match[1];

    const imgRegex = /<img[^>]+>/g;
    const imgs = innerContent.match(imgRegex);
    if (!imgs || imgs.length === 0) return content;

    let newInnerContent = innerContent;
    imgs.forEach((imgHtml, idx) => {
        const isLcp = !isBelowFold && idx === 0;
        const optimizedImg = optimizeImgTag(imgHtml, isLcp);
        newInnerContent = newInnerContent.replace(imgHtml, optimizedImg);
    });

    const newFullBlock = fullBlock.replace(innerContent, newInnerContent);
    return content.replace(fullBlock, newFullBlock);
}

// Process index.html
function optimizeIndex(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Lucide CDN Optimization
    content = optimizeLucide(content);

    // 2. Preload LCP Hero Image dynamically
    const heroCarouselMatch = content.match(/<div class="hero-carousel-slides">([\s\S]*?)<\/div>/);
    if (heroCarouselMatch) {
        const imgMatch = heroCarouselMatch[1].match(/src="([^"]+)"/);
        if (imgMatch) {
            const activeImgSrc = imgMatch[1];
            // Clean any existing hero preloads
            content = content.replace(/<link rel="preload" as="image" href="images\/hero\/hero\d\.(jpg|jpeg|webp)"[^>]*>\s*/g, '');
            const preloadTag = `<link rel="preload" as="image" href="${activeImgSrc}" fetchpriority="high">`;
            content = content.replace('</head>', `    ${preloadTag}\n</head>`);
        }
    }

    // 3. Optimize Hero Visual Carousel (Above fold, LCP first, lazy others)
    content = optimizeCarousel(content, /<div class="hero-carousel-slides">([\s\S]*?)<\/div>/, false);

    // 4. Optimize Catalog Card Carousels (Below fold, all lazy)
    content = content.replace(/<img[^>]+src="images\/(card[0-9]+|Bitacora)\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    // 5. Optimize Showcase Carousel (Below fold, all lazy)
    content = content.replace(/<img[^>]+src="images\/flyers\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    // 6. Optimize Magdalena visual & about images (Below fold, lazy)
    content = content.replace(/<img[^>]+src="images\/magdalena\.webp"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    // 7. Scripts and Fonts Optimization
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized index: ${file}`);
}

// Process product-*.html
function optimizeProduct(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Lucide CDN Optimization
    content = optimizeLucide(content);

    // 2. Optimize Product Carousel (Above fold, LCP first, lazy others)
    content = optimizeCarousel(content, /<div class="product-carousel-slides">([\s\S]*?)<\/div>/, false);

    // 3. Preload LCP Product Image
    const carouselMatch = content.match(/<div class="product-carousel-slides">([\s\S]*?)<\/div>/);
    if (carouselMatch) {
        const imgMatch = carouselMatch[1].match(/src="([^"]+)"/);
        if (imgMatch) {
            const activeImgSrc = imgMatch[1];
            // Clean any existing preloads of this image
            const cleanRegex = new RegExp(`<link rel="preload" as="image" href="${activeImgSrc.replace(/\//g, '\\/')}"[^>]*>\\s*`, 'g');
            content = content.replace(cleanRegex, '');
            // Add preload link
            const preloadTag = `<link rel="preload" as="image" href="${activeImgSrc}" fetchpriority="high">`;
            content = content.replace('</head>', `    ${preloadTag}\n</head>`);
        }
    }

    // 4. Scripts and Fonts Optimization
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized product page: ${file}`);
}

// Process historia.html
function optimizeHistoria(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Lucide CDN Optimization
    content = optimizeLucide(content);

    // 2. Optimize Story Carousel (Above fold, LCP first, lazy others)
    content = optimizeCarousel(content, /<div class="story-carousel-slides">([\s\S]*?)<\/div>/, false);

    // 3. Preload LCP Story Image
    const preloadTag = '<link rel="preload" as="image" href="images/magui/m1.webp" fetchpriority="high">';
    content = content.replace(/<link rel="preload" as="image" href="images\/magui\/m1\.(jpg|jpeg|webp)"[^>]*>\s*/g, '');
    if (!content.includes(preloadTag)) {
        content = content.replace('</head>', `    ${preloadTag}\n</head>`);
    }

    // 4. Optimize Gallery images (Below fold, lazy)
    content = content.replace(/<div class="story-gallery">([\s\S]*?)<\/div>/g, (match, inner) => {
        const imgRegex = /<img[^>]+>/g;
        const imgs = inner.match(imgRegex);
        if (!imgs) return match;
        let newInner = inner;
        imgs.forEach((imgHtml) => {
            const optimizedImg = optimizeImgTag(imgHtml, false);
            newInner = newInner.replace(imgHtml, optimizedImg);
        });
        return `<div class="story-gallery">${newInner}</div>`;
    });

    // 5. Scripts and Fonts Optimization
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized historia page: ${file}`);
}

// Process admin.html
function optimizeAdmin(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Lucide CDN Optimization
    content = optimizeLucide(content);

    // 2. Scripts and Fonts Optimization
    content = optimizeScriptsAndFonts(content, false);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized admin: ${file}`);
}

// Main execution
minifyJS();
processCSS();

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    if (file === 'index.html') {
        optimizeIndex(file);
    } else if (file === 'historia.html') {
        optimizeHistoria(file);
    } else if (file.startsWith('product-')) {
        optimizeProduct(file);
    } else if (file === 'admin.html') {
        optimizeAdmin(file);
    }
});

console.log('\nAll HTML/CSS/JS files optimized successfully!');
