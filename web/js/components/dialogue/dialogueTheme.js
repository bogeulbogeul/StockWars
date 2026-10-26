import { DIALOGUE_THEMES, resolveDialogueTheme } from '../../data/dialogueThemes.js';

const assetRoot = new URL('../../../assets/ui/dialogue-v1/', import.meta.url);

function themeProperties(speaker) {
    const id = resolveDialogueTheme(speaker);
    const image = file => `url("${new URL(`${id}/${file}.png`, assetRoot).href}")`;
    return {
        '--dialogue-accent': DIALOGUE_THEMES[id].accent,
        '--dialogue-panel': image('dialogue-panel'),
        '--dialogue-nameplate': image('nameplate'),
        '--dialogue-choice': image('choice-selected'),
        '--dialogue-arrow': image('next-arrow'),
        '--dialogue-idle': `url("${new URL('common/choice-idle.png', assetRoot).href}")`
    };
}

export function dialogueThemeStyle(speaker) {
    return Object.entries(themeProperties(speaker)).map(([name, value]) => `${name}:${value}`).join(';');
}

export function applyDialogueTheme(element, speaker) {
    if (!element) return;
    element.classList.add('crayon-dialogue');
    element.dataset.dialogueTheme = resolveDialogueTheme(speaker);
    // Only update owned custom properties; preserve positioning and existing handlers.
    for (const [name, value] of Object.entries(themeProperties(speaker))) element.style.setProperty(name, value);
}

export function clearDialogueTheme(element) {
    element.classList.remove('crayon-dialogue');
    delete element.dataset.dialogueTheme;
}
