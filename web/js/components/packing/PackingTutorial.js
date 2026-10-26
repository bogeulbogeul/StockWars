import { createMoaWakeDialogue } from '../dialogue/MoaWakeDialogue.js';

const LINES = [
    '여기가 포장 화면이에요. 왼쪽 상자와 오른쪽 물건을 함께 봐 주세요.',
    '물건을 끌어 상자에 빈칸 없이 담아 주세요. 물건을 고른 뒤 칸을 눌러 놓을 수도 있어요.',
    '모든 물건을 담으면 포장 완료를 눌러 주세요. 주문을 모두 마치면 보수를 드릴게요.'
];
export function createPackingTutorial(game) {
    const dialogue = createMoaWakeDialogue();
    dialogue.element.classList.add('packing-tutorial-dialogue'); game.dialog.append(dialogue.element);
    const shell = game.dialog.querySelector('.packing-shell');
    let index = 0;
    const hide = () => { dialogue.hide(); shell.inert = false; };
    const next = () => {
        if (index >= LINES.length) { game.session.tutorialSeen = true; hide(); game.focusStart(); return; }
        dialogue.showLine(LINES[index++], { speaker: 'bongbong', name: '봉봉', onNext: next });
    };
    return {
        get isOpen() { return dialogue.isOpen; },
        show() {
            if (game.session.tutorialSeen || game.session.completed > 0) return;
            index = 0; shell.inert = true; next();
            dialogue.element.querySelector('button')?.focus();
        },
        next, hide
    };
}
