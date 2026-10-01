import fs from 'fs';

const filePath = 'web/css/modules/office-stage.css';
let css = fs.readFileSync(filePath, 'utf8');

// Remove leftover keyframe line
css = css.replace(/100%\s*\{\s*transform:\s*translate\(315\.5px,\s*210px\);\s*\}\s*\}/g, '');
css = css.replace(/\s*100%\s*\{\s*transform:[^}]*\}\s*\}/g, '');

const openBraces = (css.match(/\{/g) || []).length;
const closeBraces = (css.match(/\}/g) || []).length;

console.log(`Braces check: open={${openBraces}}, close={${closeBraces}}`);

fs.writeFileSync(filePath, css, 'utf8');
console.log('Successfully cleaned office-stage.css!');
