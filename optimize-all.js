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

// Helper for SEO injection (Canonical, Robots, Open Graph, Schema.org)
function optimizeSEOAndHead(file, content) {
    const domain = 'https://diebrucke.studio';
    let canonicalUrl = domain;
    if (file === 'index.html') {
        canonicalUrl = `${domain}/`;
    } else if (file === 'historia.html') {
        canonicalUrl = `${domain}/historia`;
    } else if (file.startsWith('product-')) {
        const slug = file.replace('.html', '');
        canonicalUrl = `${domain}/${slug}`;
    }

    // Robots Meta Tag
    const robotsTag = file === 'admin.html' 
        ? '<meta name="robots" content="noindex, nofollow">'
        : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">';

    // Clean existing canonical & robots tags to prevent duplication
    content = content.replace(/<link rel="canonical"[^>]*>\s*/g, '');
    content = content.replace(/<meta name="robots"[^>]*>\s*/g, '');

    let headInsertions = `    <link rel="canonical" href="${canonicalUrl}">\n    ${robotsTag}\n`;

    if (file !== 'admin.html') {
        if (!content.includes('property="og:site_name"')) {
            headInsertions += '    <meta property="og:site_name" content="Die Brücke Atelier">\n';
        }
        if (!content.includes('property="og:locale"')) {
            headInsertions += '    <meta property="og:locale" content="es_AR">\n';
        }
    }

    if (file.startsWith('product-')) {
        const slug = file.replace('.html', '');
        const productUrl = `${domain}/${slug}`;
        content = content.replace(/meta property="og:url" content="[^"]*"/g, `meta property="og:url" content="${productUrl}"`);
        content = content.replace(/meta property="twitter:url" content="[^"]*"/g, `meta property="twitter:url" content="${productUrl}"`);
        
        // Clean URL in Product schema offer
        content = content.replace(/"url":\s*"https:\/\/diebrucke\.studio\/product-\d+(\.html)?"/g, `"url": "${productUrl}"`);

        // Extract title for BreadcrumbList
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        const productName = titleMatch ? titleMatch[1].replace(' - Recurso Digital | Die Brücke', '').trim() : slug;

        if (!content.includes('BreadcrumbList')) {
            const breadcrumbSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "${domain}/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Catálogo",
          "item": "${domain}/#catalogo"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${productName}",
          "item": "${productUrl}"
        }
      ]
    }
    </script>`;
            headInsertions += breadcrumbSchema + '\n';
        }
    } else if (file === 'historia.html') {
        if (!content.includes('og:type')) {
            headInsertions += `
    <meta property="og:type" content="article">
    <meta property="og:url" content="${domain}/historia">
    <meta property="og:title" content="Historia de Magdalena | Die Brücke Atelier">
    <meta property="og:description" content="Conocé la historia de Magdalena, creadora de Die Brücke: su camino, procesos y filosofía de diseño.">
    <meta property="og:image" content="${domain}/images/magdalena.webp">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:title" content="Historia de Magdalena | Die Brücke Atelier">
    <meta property="twitter:description" content="Conocé la historia de Magdalena, creadora de Die Brücke: su camino, procesos y filosofía de diseño.">
    <meta property="twitter:image" content="${domain}/images/magdalena.webp">\n`;
        }

        if (!content.includes('application/ld+json')) {
            headInsertions += `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "Historia de Magdalena | Die Brücke Atelier",
      "url": "${domain}/historia",
      "description": "Conocé la historia de Magdalena, creadora de Die Brücke: su camino, procesos y filosofía de diseño.",
      "mainEntity": {
        "@type": "Person",
        "name": "Magdalena",
        "jobTitle": "Creadora & Diseñadora",
        "worksFor": {
          "@type": "Organization",
          "name": "Die Brücke Atelier"
        }
      }
    }
    </script>\n`;
        }
    } else if (file === 'index.html') {
        if (!content.includes('SearchAction')) {
            const webSiteSchema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Die Brücke Atelier",
      "url": "${domain}/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "${domain}/#catalogo?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>\n`;
            headInsertions += webSiteSchema + '\n';
        }
    }

    content = content.replace('</head>', `${headInsertions}</head>`);
    return content;
}

// Helper to optimize image tags and insert dimensions
function optimizeImgTag(imgHtml, isLcp) {
    let clean = imgHtml
        .replace(/\s+loading="[^"]*"/g, '')
        .replace(/\s+fetchpriority="[^"]*"/g, '')
        .replace(/\s+decoding="[^"]*"/g, '')
        .replace(/\s+width="[^"]*"/g, '')
        .replace(/\s+height="[^"]*"/g, '')
        .replace(/\s+/g, ' ');

    const srcMatch = clean.match(/src="([^"]+)"/);
    let dims = null;
    if (srcMatch) {
        dims = getWebpDimensions(srcMatch[1]);
    }

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

    content = optimizeLucide(content);

    const heroCarouselMatch = content.match(/<div class="hero-carousel-slides">([\s\S]*?)<\/div>/);
    if (heroCarouselMatch) {
        const imgMatch = heroCarouselMatch[1].match(/src="([^"]+)"/);
        if (imgMatch) {
            const activeImgSrc = imgMatch[1];
            content = content.replace(/<link rel="preload" as="image" href="images\/hero\/hero\d\.(jpg|jpeg|webp)"[^>]*>\s*/g, '');
            const preloadTag = `<link rel="preload" as="image" href="${activeImgSrc}" fetchpriority="high">`;
            content = content.replace('</head>', `    ${preloadTag}\n</head>`);
        }
    }

    content = optimizeCarousel(content, /<div class="hero-carousel-slides">([\s\S]*?)<\/div>/, false);

    content = content.replace(/<img[^>]+src="images\/(card[0-9]+|Bitacora)\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    content = content.replace(/<img[^>]+src="images\/flyers\/[^"]+"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    content = content.replace(/<img[^>]+src="images\/magdalena\.webp"[^>]*>/g, (imgHtml) => {
        return optimizeImgTag(imgHtml, false);
    });

    content = optimizeSEOAndHead(file, content);
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized index: ${file}`);
}

// Process product-*.html
function optimizeProduct(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = optimizeLucide(content);

    content = optimizeCarousel(content, /<div class="product-carousel-slides">([\s\S]*?)<\/div>/, false);

    const carouselMatch = content.match(/<div class="product-carousel-slides">([\s\S]*?)<\/div>/);
    if (carouselMatch) {
        const imgMatch = carouselMatch[1].match(/src="([^"]+)"/);
        if (imgMatch) {
            const activeImgSrc = imgMatch[1];
            const cleanRegex = new RegExp(`<link rel="preload" as="image" href="${activeImgSrc.replace(/\//g, '\\/')}"[^>]*>\\s*`, 'g');
            content = content.replace(cleanRegex, '');
            const preloadTag = `<link rel="preload" as="image" href="${activeImgSrc}" fetchpriority="high">`;
            content = content.replace('</head>', `    ${preloadTag}\n</head>`);
        }
    }

    content = optimizeSEOAndHead(file, content);
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized product page: ${file}`);
}

// Process historia.html
function optimizeHistoria(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = optimizeLucide(content);

    content = optimizeCarousel(content, /<div class="story-carousel-slides">([\s\S]*?)<\/div>/, false);

    const preloadTag = '<link rel="preload" as="image" href="images/magui/m1.webp" fetchpriority="high">';
    content = content.replace(/<link rel="preload" as="image" href="images\/magui\/m1\.(jpg|jpeg|webp)"[^>]*>\s*/g, '');
    if (!content.includes(preloadTag)) {
        content = content.replace('</head>', `    ${preloadTag}\n</head>`);
    }

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

    content = optimizeSEOAndHead(file, content);
    content = optimizeScriptsAndFonts(content, true);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized historia page: ${file}`);
}

// Process admin.html
function optimizeAdmin(file) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = optimizeLucide(content);
    content = optimizeSEOAndHead(file, content);
    content = optimizeScriptsAndFonts(content, false);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Optimized admin: ${file}`);
}

// Helper to generate sitemap.xml dynamically
function generateSitemap() {
    console.log('Generating updated sitemap.xml...');
    const domain = 'https://diebrucke.studio';
    const currentDate = new Date().toISOString().split('T')[0];

    const entries = [
        { url: `${domain}/`, priority: '1.0', changefreq: 'daily' },
        { url: `${domain}/historia`, priority: '0.9', changefreq: 'weekly' }
    ];

    const productFiles = fs.readdirSync(dir)
        .filter(f => f.startsWith('product-') && f.endsWith('.html'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('product-', '').replace('.html', ''), 10);
            const numB = parseInt(b.replace('product-', '').replace('.html', ''), 10);
            return numA - numB;
        });

    productFiles.forEach(file => {
        const slug = file.replace('.html', '');
        entries.push({
            url: `${domain}/${slug}`,
            priority: '0.8',
            changefreq: 'weekly'
        });
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    entries.forEach(e => {
        xml += `    <url>\n        <loc>${e.url}</loc>\n        <lastmod>${currentDate}</lastmod>\n        <changefreq>${e.changefreq}</changefreq>\n        <priority>${e.priority}</priority>\n    </url>\n`;
    });
    xml += `</urlset>\n`;

    fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml, 'utf8');
    console.log(`sitemap.xml generated with ${entries.length} URLs successfully!\n`);
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

generateSitemap();

console.log('\nAll HTML/CSS/JS files and SEO assets optimized successfully!');
