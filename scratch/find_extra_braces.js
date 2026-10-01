import fs from 'fs';

const css = fs.readFileSync('web/css/modules/office-stage.css', 'utf8');
const lines = css.split(/\r?\n/);
let stack = [];

lines.forEach((line, idx) => {
    for (let char of line) {
        if (char === '{') {
            stack.push(idx + 1);
        } else if (char === '}') {
            if (stack.length === 0) {
                console.log(`UNMATCHED EXTRA CLOSING BRACE '}' on line ${idx + 1}: ${line}`);
            } else {
                stack.pop();
            }
        }
    }
});

if (stack.length > 0) {
    console.log(`UNCLOSED OPEN BRACES '{' on lines:`, stack);
}
