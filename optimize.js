const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // 1. Defer Lucide
    content = content.replace(/<script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>/g, '<script defer src="https://unpkg.com/lucide@latest"></script>');
    
    // 2. Add lazy loading to images (excluding hero slider if possible)
    // We add lazy loading to any <img src="images/card... 
    content = content.replace(/<img\s+src="images\/(card[0-9]+|Bitacora)\/([^"]+)"/g, '<img loading="lazy" decoding="async" src="images/$1/$2"');
    
    // Also target other specific images like hero but exclude the main active one?
    // Actually, it's safer to just lazy load the product images which are the bulk of the page weight.
    content = content.replace(/<img\s+src="images\/estudio\/([^"]+)"/g, '<img loading="lazy" decoding="async" src="images/estudio/$1"');
    
    // Let's also ensure images inside the product-14 style product-carousel-slides get lazy loaded
    // In product-*.html, the images are <img src="images/cardX/Y.jpg" ... > which is covered by the first replace.
    
    // Write back
    fs.writeFileSync(path.join(dir, file), content);
    console.log(`Optimized ${file}`);
});
console.log('Done optimizing HTML files');
