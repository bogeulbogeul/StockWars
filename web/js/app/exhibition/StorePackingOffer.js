import { waitForStoreTalk } from './StoreTalk.js';

export function showStorePackingOffer(app) {
    const view = app.view;
    view.line({ speaker: '봉봉', text: '일을 마치면 보수를 드릴게요. 시작해볼까요?' }, () => {});
    view.panel.querySelector('.dialogue-next-triangle').remove();
    view.choices([
        ['해볼게요', () => app.next()],
        ['나중에 할게요', () => view.line({ speaker: '봉봉', text: '네. 준비되면 다시 말해주세요.' }, async () => {
            app.busy = true; view.panel.hidden = true; app.scenes.storeAwaitingTalk = true;
            await waitForStoreTalk(app.scenes);
            app.busy = false; view.panel.hidden = false; showStorePackingOffer(app); view.sync(app.state);
        })]
    ]);
}
