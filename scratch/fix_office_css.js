import fs from 'fs';

const filePath = 'web/css/modules/office-stage.css';
let content = fs.readFileSync(filePath, 'utf8');

// Replace .iso-office-stage padding
content = content.replace(
    /padding-top:\s*50px;\s*padding-bottom:\s*75px;/g,
    'padding: 0;'
);

// Replace .iso-stage-wrapper and .iso-svg
const targetWrapper = /\.iso-stage-wrapper\s*\{[^}]*\}/s;
const newWrapper = `.iso-stage-wrapper {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
}`;

const targetSvg = /\.iso-svg\s*\{[^}]*\}/s;
const newSvg = `.iso-svg {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 960px;
    max-height: 100vh;
    overflow: visible;
    filter: drop-shadow(0 20px 50px rgba(0, 0, 0, 0.65));
}`;

content = content.replace(targetWrapper, newWrapper);
content = content.replace(targetSvg, newSvg);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated office-stage.css!');
