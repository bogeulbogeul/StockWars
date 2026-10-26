import { DiaryBook } from '../../components/DiaryBook.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { playSeedPlanting } from './SeedPlantingAnimation.js';

export async function waitForSeedPot(app) {
    app.view.panel.hidden = true;
    const guide = createMoaMovementGuide(app.view.root, { finalePot: true }); guide.update({ visible: true });
    app.inventory.sync();
    app.cancelFinaleWait = () => { app.inventory.cancelPotUse(); guide.dispose(); };
    let use;
    try { use = await app.inventory.waitForPotUse(); }
    finally { guide.dispose(); app.cancelFinaleWait = null; }
    if (!use) return;
    app.busy = true;
    try { await playSeedPlanting(); app.busy = false; app.next('planted'); }
    catch (error) {
        app.busy = false; app.view.panel.hidden = false;
        app.view.line({ speaker: '소망이', text: '화분을 다시 준비해 볼까?' }, () => waitForSeedPot(app));
        console.error('Seed planting:', error);
    }
}
export function waitForFirstDiary(app) {
    app.view.panel.hidden = true;
    app.diaryBook ||= new DiaryBook();
    const guide = createMoaMovementGuide(app.view.root, { firstDiary: true }); guide.update({ visible: true });
    const clear = () => { guide.dispose(); app.writeFirstDiary = null; app.cancelFinaleWait = null; };
    app.cancelFinaleWait = clear;
    app.writeFirstDiary = () => {
        guide.update({ visible: false });
        app.diaryBook.open({ written: !!app.state.flags.diaryWritten,
            onClose: finished => {
                if (app.plan[app.state.cursor]?.id !== 'diaryWritten') return;
                if (finished) { clear(); app.next('diaryWritten'); }
                else guide.update({ visible: true });
            }
        });
    };
}
