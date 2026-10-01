import fs from 'fs';

const filePath = 'web/css/modules/office-stage.css';
let css = fs.readFileSync(filePath, 'utf8');

const brokenTarget = `.iso-anna-prompt:hover rect:first-child {
    fill: rgba(15, 23, 42, 0.98) !important;
    stroke: #818cf8 !important;
    filter: drop-shadow(0 0 16px rgba(129, 140, 248, 0.75)) !important;
}
}`;

const fixedReplacement = `.iso-anna-prompt:hover rect:first-child {
    fill: rgba(15, 23, 42, 0.98) !important;
    stroke: #818cf8 !important;
    filter: drop-shadow(0 0 16px rgba(129, 140, 248, 0.75)) !important;
}`;

css = css.replace(brokenTarget.replace(/\r\n/g, '\n'), fixedReplacement);
css = css.replace(brokenTarget.replace(/\n/g, '\r\n'), fixedReplacement);

// Check matching open and close braces in CSS
const openBraces = (css.match(/\{/g) || []).length;
const closeBraces = (css.match(/\}/g) || []).length;

console.log(`Braces count: open={${openBraces}}, close={${closeBraces}}`);

fs.writeFileSync(filePath, css, 'utf8');
console.log('Fixed office-stage.css extra brace!');
