import { setGuidanceContent } from './GuidanceCard.js';
import { movementGuideContent } from './MoaMovementGuideData.js';

export function createMoaMovementGuide(host, options = {}) {
    const element = document.createElement('section');
    element.className = 'moa-movement-guide';
    let content = movementGuideContent(options);
    const refresh = () => { const title = content.title; content = movementGuideContent(options); content.title = title; setGuidanceContent(element, content); };
    window.addEventListener('stockwars-settings-changed', refresh);
    element.setAttribute('aria-label', content.label);
    setGuidanceContent(element, content);
    element.hidden = true; host.append(element);
    return {
        element,
        update({ visible = true, text } = {}) {
            if (text && content.title !== text) { content.title = text; setGuidanceContent(element, content); }
            element.hidden = !visible;
        },
        dispose() { window.removeEventListener('stockwars-settings-changed', refresh); element.remove(); }
    };
}
