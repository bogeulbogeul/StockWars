const fs = require('node:fs');
const sharp = require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1152"><path d="M300 480 L1100 27 L1100 627 L300 1080 Z" fill="#81b6be" stroke="#c4ad8a" stroke-width="30"/><path d="M300 780 L1100 327 M700 253.5 L700 853.5" stroke="#c4ad8a" stroke-width="25"/></svg>`;
sharp(Buffer.from(svg)).png().toFile('scratch/window-grid-guide.png');
