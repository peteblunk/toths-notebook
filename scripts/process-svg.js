
const fs = require('fs');
const path = require('path');

const svgFilePath = path.join(__dirname, '..', 'public', 'assets', 'cyrpto-obelisk-of-istanbul-inkscape-file-text.txt');
const componentPath = path.join(__dirname, '..', 'src', 'components', 'IstanbulProtocol', 'ObeliskGuardian.tsx');

const svgContent = fs.readFileSync(svgFilePath, 'utf-8');
const componentContent = fs.readFileSync(componentPath, 'utf-8');

const heroGlyphsRegex = /<g\s+id="g7"\s+inkscape:label="hero-glyphs-for-keypad">([\s\S]*?)<\/g>/;
const heroGlyphsMatch = svgContent.match(heroGlyphsRegex);

if (!heroGlyphsMatch) {
  console.error('Could not find hero-glyphs-for-keypad group');
  process.exit(1);
}

const heroGlyphsContent = heroGlyphsMatch[1];
const glyphRegex = /<g\s+id="[^"]*"\s+inkscape:label="([^"]*)">([\s\S]*?)<\/g>/g;
let glyphMatch;
const glyphs = {};

while ((glyphMatch = glyphRegex.exec(heroGlyphsContent)) !== null) {
  const id = glyphMatch[1];
  let content = glyphMatch[2];

  content = content.replace(/inkscape:label="[^"]*"/g, '');
  content = content.replace(/sodipodi:nodetypes="[^"]*"/g, '');
  content = content.replace(/style="([^"]*)"/g, (match, styleString) => {
    const styleProperties = styleString.split(';').filter(prop => prop.trim());
    const styleObject = styleProperties.reduce((acc, prop) => {
      const [key, value] = prop.split(':');
      if (key && value) {
        const camelCaseKey = key.trim().replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
        acc[camelCaseKey] = value.trim();
      }
      return acc;
    }, {});
    return `style={${JSON.stringify(styleObject)}}`;
  });
  // remove the outer g tag
    content = content.replace(/<g[^>]*>/g, '').replace(/<\/g>/g, '');


  glyphs[id] = content;
}


let newComponentContent = componentContent;

for (const id in glyphs) {
    const placeholderRegex = new RegExp(`(<g id="${id}"[^>]*>)[^<]*(<\/g>)`);
    newComponentContent = newComponentContent.replace(placeholderRegex, `$1${glyphs[id]}$2`);
}

fs.writeFileSync(componentPath, newComponentContent);

console.log('ObeliskGuardian.tsx has been updated with the cleaned hero glyphs.');
