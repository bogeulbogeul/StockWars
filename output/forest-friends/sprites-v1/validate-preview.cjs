// Smoke-test the self-contained preview's render path without a browser.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'preview.html'), 'utf8');
const source = html.match(/<script>([\s\S]*)<\/script>/)[1];
new Function(source);
let draws = 0;
const ctx = new Proxy({}, {get: (_, key) => key === 'drawImage' ? (...args) => {
  if (args.slice(1).some(n => !Number.isFinite(n))) throw new Error('Invalid atlas rectangle');
  draws++;
} : () => {}, set: () => true});
const controls = new Map();
function element(key) {
  if (!controls.has(key)) controls.set(key, {value: key === '#bg' ? '#e8e3d7' : '', checked: false, add() {}, append() {}, querySelector(s) {return s === 'canvas' ? {getContext: () => ctx} : {textContent: ''};}});
  return controls.get(key);
}
let render;
const context = {document: {querySelector: element, createElement: () => ({innerHTML: '',querySelector(s) {return s === 'canvas' ? {getContext: () => ctx} : {textContent: ''};}})}, Option: function(){}, Image: function(){this.complete=true;this.naturalWidth=1280;}, requestAnimationFrame: cb => {render=cb;}, console};
vm.runInNewContext(source, context);
for (const state of ['down_idle','down_walk','right_idle','right_walk','up_idle','up_walk','right_carry','down_sit','right_sit','face_portrait']) {
  element('#state').value = state;
  element('#state').onchange();
  for (let t=160;t<=800;t+=160) render(t);
  element('#mirror').checked = true;
  element('#small').checked = true;
  render(960);
  element('#mirror').checked = false;
  element('#small').checked = false;
}
element('#play').onclick();
element('#step').onclick();
element('#frame').value = 0;
element('#frame').oninput();
render(1120);
const result={ok:true,renderedFrames:draws,states:10,characters:6,method:'DOM/canvas render-path smoke test; not browser visual QA'};
fs.writeFileSync(path.join(__dirname,'preview-verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(result);
