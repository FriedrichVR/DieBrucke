const fs = require('fs');
const path = require('path');

const dir = __dirname;

// Helper to optimize Lucide script
function optimizeLucide(content) {
    // Matches any unpkg.com/lucide@... script tag, with or without defer/async
    const lucideRegex = /<script\s+(?:defer\s+)?src="https:\/\/unpkg\.com\/lucide@?[^"]*"><\/script>/g;
    const optimizedTag = '<script defer src="https://cdn.jsdelivr.net/npm/lucide@0.468.0/dist/umd/lucide.min.js"></script>';
    return content.replace(lucideRegex, optimizedTag);
}

// Helper to optimize image tags
function optimizeImgTag(imgHtml, isLcp) {
    // Remove existing loading="lazy", fetchpriority, decoding attributes to start clean
    let clean = imgHtml
        .replace(/\s+loading="[^"]*"/g, '')
        .replace(/\s+fetchpriority="[^"]*"/g, '')
        .replace(/\s+decoding="[^"]*"/g, '')
        // Clean up double spaces that might occur
        .replace(/\s+/g, ' ');

    // Reconstruct with optimal attributes
    if (isLcp) {
        // LCP images load eagerly, with high priority and async decoding
        clean = clean.replace('<img', '<img fetchpriority="high" decoding="async"');
    } else {
        // Non-LCP images load lazily and async
        clean = clean.replace('<img', '<img loading="lazy" decoding="async"');
    }
    
    // Ensure formatting is clean
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
        // If the entire carousel is below the fold, then even the first image is lazy
        // Otherwise, the first image (idx === 0) is LCP (eager), others are lazy
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

    // 2. Preload LCP Hero Image
    const heroPreload = '<link rel="preload" as="image" href="images/hero/hero1.jpg" fetchpriority="high">';
    // Clean old preloads for hero1.jpg
    content = content.replace(/<link rel="preload" as="image" href="images\/hero\/hero1\.jpg"[^>]*>\s*/g, '');
    if (!content.includes(heroPreload)) {
        content = content.replace('</head>', `    ${heroPreload}\n</head>`);
    }

    // 3. Optimize Hero Visual Carousel (Above fold, LCP first, lazy others)
    content = optimizeCarousel(content, /<div class="hero-carousel-slides">([\s\S]*?)<\/div>/, false);

    // 4. Optimize Catalog Card Carousels (Below fold, all lazy)
    // Directly target catalog card images using global regex to avoid nested div parsing issues
    content = content.replace(/<img[^>]+src="images\/(card[0-9]+|Bitacora)\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false); // catalog card images are below the fold
    });

    // 5. Optimize Showcase Carousel (Below fold, all lazy)
    content = content.replace(/<img[^>]+src="images\/flyers\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    // 6. Optimize Magdalena visual & about images (Below fold, lazy)
    content = content.replace(/<img[^>]+src="images\/magdalena\.jpg"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

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
    const preloadTag = '<link rel="preload" as="image" href="images/magui/m1.jpg" fetchpriority="high">';
    content = content.replace(/<link rel="preload" as="image" href="images\/magui\/m1\.jpg"[^>]*>\s*/g, '');
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

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized historia page: ${file}`);
}

// Main execution
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    if (file === 'index.html') {
        optimizeIndex(file);
    } else if (file === 'historia.html') {
        optimizeHistoria(file);
    } else if (file.startsWith('product-')) {
        optimizeProduct(file);
    }
});

console.log('\nAll HTML files optimized successfully!');
