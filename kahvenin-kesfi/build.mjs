// Tek dosyalık sürüm: index.html + dist/app.js → kahvenin-kesfi.html
import { readFileSync, writeFileSync } from 'fs';
const html = readFileSync('index.html', 'utf8');
const js = readFileSync('dist/app.js', 'utf8');
writeFileSync('kahvenin-kesfi.html', html.replace('<script src="dist/app.js"></script>', () => `<script>\n${js}\n</script>`));
console.log('kahvenin-kesfi.html yazıldı');
