import { createMoaWakeDialogue } from '../../components/dialogue/MoaWakeDialogue.js';
import { updateFollowDistance } from '../../data/tourFollowReminder.js';

export function createTourFollowReminder() {
    const dialogue = createMoaWakeDialogue(), state = {};
    return {
        get isOpen() { return dialogue.isOpen; },
        update(distance, dt) {
            const event = updateFollowDistance(state, distance, dt);
            if (event === 'near') dialogue.hide();
            if (event === 'call') dialogue.showLine('이쪽이에요! 너무 멀어지지 말고 저를 따라와 주세요.',
                { speaker: 'moa', name: '모아' });
        },
        dispose() { dialogue.dispose(); }
    };
}
