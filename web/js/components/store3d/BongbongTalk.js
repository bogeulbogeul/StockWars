import { gameKey } from '../../app/GameKeys.js';
import { Vector3 } from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { BONGBONG_GREETING_LINES } from '../../data/bongbongTalk.js';
import { createMoaWakeDialogue } from '../dialogue/MoaWakeDialogue.js';
import { createMoaMovementGuide } from '../town3d/MoaMovementGuide.js';
import { waitForPackingWorkstation } from './PackingWorkstation.js';

const position = new Vector3();
export function nearBongbong(scene) {
    scene.shopkeeper.getWorldPosition(position);
    return Math.hypot(scene.controller.charPosX - position.x, scene.controller.charPosY / P - position.z) <= 145;
}
export function installBongbongTalk(scene, onWork) {
    const dialogue = createMoaWakeDialogue();
    const guide = createMoaMovementGuide(scene.layer, { storeTalk: true });
    let index = 0;
    const choices = () => dialogue.element.querySelector('.exhibition-choices')?.remove();
    const hide = () => { choices(); dialogue.hide(); };
    const show = (text, next) => {
        choices();
        dialogue.element.querySelector('.dialogue-next-triangle').hidden = false;
        dialogue.showLine(text, { speaker: 'bongbong', name: '봉봉', onNext: next });
    };
    const offer = () => {
        show('포장 알바를 해보실래요?', hide);
        dialogue.element.querySelector('.dialogue-next-triangle').hidden = true;
        const row = document.createElement('div'); row.className = 'exhibition-choices';
        for (const [text, action] of [['해볼게요', async () => {
            hide(); if (await waitForPackingWorkstation(scene)) onWork?.();
        }],
            ['나중에 할게요', () => show('네. 준비되면 다시 말해주세요.', hide)]]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
            button.onclick = action; row.append(button);
        }
        dialogue.element.querySelector('.vn-dialogue-box').append(row);
    };
    const line = () => show(BONGBONG_GREETING_LINES[index], () => {
        index++; if (index < BONGBONG_GREETING_LINES.length) line(); else offer();
    });
    window.addEventListener('keydown', event => {
        if (!scene.active || window.stockWarsExhibition?.started || scene.greetingActive || scene.awaitingPackingWorktop
            || event.repeat || event.ctrlKey || event.altKey || event.metaKey || document.querySelector('dialog[open]')
            || event.target.closest?.('input,textarea,select')) return;
        if (dialogue.isOpen) {
            if (event.code === 'Escape') hide();
            else if (event.code === 'KeyF') {
                const next = dialogue.element.querySelector('.dialogue-next-triangle'); if (!next.hidden) next.click();
            }
            else if (!['w', 'a', 's', 'd'].includes(gameKey(event))) return;
            event.preventDefault(); event.stopImmediatePropagation(); return;
        }
        if (event.code !== 'KeyF' || !nearBongbong(scene)) return;
        event.preventDefault(); event.stopImmediatePropagation();
        scene.controller.keysHeld.clear(); scene.player.faceTarget(scene.shopkeeper);
        guide.update({ visible: false }); index = 0; line();
    }, true);
    return {
        ready() { if (!window.stockWarsExhibition?.started) guide.update({ visible: true }); },
        hide() { hide(); guide.update({ visible: false }); }
    };
}
