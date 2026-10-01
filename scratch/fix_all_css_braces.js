import fs from 'fs';

const filePath = 'web/css/modules/office-stage.css';
let css = fs.readFileSync(filePath, 'utf8');

const targetHop = `    70% {
        transform: translateY(-3px) scale(1.08, 0.94);
    }

.iso-char-hopping {`;

const fixedHop = `    70% {
        transform: translateY(-3px) scale(1.08, 0.94);
    }
}

.iso-char-hopping {`;

css = css.replace(targetHop.replace(/\r\n/g, '\n'), fixedHop);
css = css.replace(targetHop.replace(/\n/g, '\r\n'), fixedHop);

fs.writeFileSync(filePath, css, 'utf8');
console.log('Fixed isoCharHop keyframe in office-stage.css!');
