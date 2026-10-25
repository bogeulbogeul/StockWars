import { applyDialogueTheme } from '../../components/dialogue/dialogueTheme.js';
import { EXHIBITION } from './State.js';

export function activitySpeech(view, speaker, text) {
    view.clear(null, speaker === '소망이' ? view.state?.nickname || '???' : speaker);
    applyDialogueTheme(view.panel, speaker);
    view.panel.querySelector('.exhibition-speaker')?.classList.add('vn-nameplate');
    view.text(text);
}

// Rewards still go through next/complete exactly once, after the spoken line.
export function passiveActivity(app, id) {
    if (id === 'walk') { app.next('walk'); return true; }
    const lines = {
        phone: ['소망이', '고마워. 잘 쓸게.'],
        wage: ['봉봉', `수고했어요! 오늘 일한 보수 ${EXHIBITION.wage.toLocaleString()}잎이에요. 받아주세요.`],
        envelope: ['봉봉', '아, 이것도 받아주세요. 손님이 맡기고 간 봉투예요.'],
        sunset: ['모아', '벌써 노을이 지네요. 오늘 하루도 많이 걸었죠?'],
        cookie: ['소망이', '꿀 쿠키…… 달콤하다. 잠깐 쉬어 가도 좋겠어.'],
        grant: ['모아', '이건 마을에서 드리는 정착 지원금 2,000잎이에요. 빌린 돈과 달리 돌려주지 않아도 돼요.'],
        diary: ['모아', '이 다이어리도 받아주세요. 앞으로의 하루를 하나씩 담아보세요.'],
        tradeHistory: ['소망이', `내가 처음 산 주식이네.\n${app.state.trades.map(t => `${t.name} · ${t.quantity}주 · ${t.price.toLocaleString()}잎`).join('\n')}`]
    };
    const line = lines[id];
    if (!line) return false;
    app.view.line({ speaker: line[0], text: line[1] }, () => app.next(id));
    return true;
}
