import fs from 'fs';

// 1. Update office-stage.css
const cssPath = 'web/css/modules/office-stage.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Remove #isoDoorPrompt animation & keyframes
css = css.replace(/#isoDoorPrompt\s*\{[^}]*\}/g, '');
css = css.replace(/@keyframes doorPromptFloat\s*\{[^}]*\}/g, '');

// Update .iso-office-stage, .iso-stage-wrapper, .iso-svg
const stageWrapperPattern = /\.iso-stage-wrapper\s*\{[^}]*\}/s;
const newStageWrapper = `.iso-stage-wrapper {
    position: relative;
    z-index: 2;
    width: 100%;
    height: calc(100vh - 48px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: visible;
}`;

const svgPattern = /\.iso-svg\s*\{[^}]*\}/s;
const newSvg = `.iso-svg {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 960px;
    max-height: 100%;
    overflow: visible;
    filter: drop-shadow(0 20px 50px rgba(0, 0, 0, 0.65));
}`;

const officeStagePattern = /\.iso-office-stage\s*\{[^}]*\}/s;
const newOfficeStage = `.iso-office-stage {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1;
    overflow: hidden;
    background: radial-gradient(circle at 50% 35%, #182844 0%, #0d1524 60%, #060910 100%);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    box-sizing: border-box;
    padding-top: 48px;
    padding-bottom: 0;
    transition: opacity 0.4s ease, filter 0.4s ease;
}`;

css = css.replace(officeStagePattern, newOfficeStage);
css = css.replace(stageWrapperPattern, newStageWrapper);
css = css.replace(svgPattern, newSvg);

fs.writeFileSync(cssPath, css, 'utf8');
console.log('Updated office-stage.css!');

// 2. Update OfficeSvgTemplate.js preserveAspectRatio
const tplPath = 'web/js/components/office/OfficeSvgTemplate.js';
let tpl = fs.readFileSync(tplPath, 'utf8');
tpl = tpl.replace('preserveAspectRatio="xMidYMid meet"', 'preserveAspectRatio="xMidYMin meet"');
fs.writeFileSync(tplPath, tpl, 'utf8');
console.log('Updated OfficeSvgTemplate.js!');

// 3. Update OfficeStage.js to animate doorPrompt in JS
const stagePath = 'web/js/components/OfficeStage.js';
let stage = fs.readFileSync(stagePath, 'utf8');

const targetCheckDoor = `        if (near !== this.isNearDoor) {
            this.isNearDoor = near;
            if (this.doorPrompt) {
                if (near) {
                    this.doorPrompt.classList.remove('hidden');
                } else {
                    this.doorPrompt.classList.add('hidden');
                }
            }
            if (this.doorFloatingBtn) {
                if (near) {
                    this.doorFloatingBtn.classList.remove('hidden');
                } else {
                    this.doorFloatingBtn.classList.add('hidden');
                }
            }
        }`;

const replacementCheckDoor = `        if (near !== this.isNearDoor) {
            this.isNearDoor = near;
            if (this.doorPrompt) {
                if (near) {
                    this.doorPrompt.classList.remove('hidden');
                } else {
                    this.doorPrompt.classList.add('hidden');
                }
            }
            if (this.doorFloatingBtn) {
                if (near) {
                    this.doorFloatingBtn.classList.remove('hidden');
                } else {
                    this.doorFloatingBtn.classList.add('hidden');
                }
            }
        }

        if (this.isNearDoor && this.doorPrompt) {
            const floatBob = Math.sin(now / 250) * 3;
            this.doorPrompt.setAttribute('transform', \`translate(315.5, \${(218 + floatBob).toFixed(2)})\`);
        }`;

if (!stage.includes('this.isNearDoor && this.doorPrompt')) {
    stage = stage.replace(targetCheckDoor, replacementCheckDoor);
    fs.writeFileSync(stagePath, stage, 'utf8');
    console.log('Updated OfficeStage.js!');
} else {
    console.log('OfficeStage.js already updated!');
}
