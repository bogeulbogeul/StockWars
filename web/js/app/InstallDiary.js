import { DiaryBook } from '../components/DiaryBook.js';
import { DiaryModal } from '../components/DiaryModal.js';
import { gameKey } from './GameKeys.js';
export function installDiary(app, exhibition = false) {
    const stage = exhibition ? app.scenes.townStage : app.townStage;
    if (stage?.callbacks) {
        const blocked = stage.callbacks.isInputBlocked;
        stage.callbacks.isInputBlocked = () => !!document.querySelector('.diary-book[open]') || blocked?.();
    }
    const owned = () => exhibition ? app.state.flags.diary : app.userProfile?.diaryReceived;
    app.openDiary = () => {
        if (!owned()) return;
        if (exhibition) {
            if (app.plan[app.state.cursor]?.id === 'diaryWritten') { app.writeFirstDiary?.(); return; }
            app.diaryBook ||= new DiaryBook(); app.diaryBook.open({ written: !!app.state.flags.diaryWritten, canWrite: false });
        } else { app.diaryModal ||= new DiaryModal(app); app.diaryModal.open(); }
    };
    window.addEventListener('keydown', e => {
        const activeBook = document.querySelector('.diary-book[open]');
        if (activeBook && gameKey(e) !== 'j' && !['Tab', 'Enter', ' ', 'Escape'].includes(e.key)) {
            e.preventDefault(); e.stopImmediatePropagation(); return;
        }
        if (e.defaultPrevented || e.repeat || gameKey(e) !== 'j' || e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
        const book = document.querySelector('.diary-book[open]');
        if (book) { e.preventDefault(); e.stopImmediatePropagation(); book.close(); return; }
        if (document.querySelector('dialog[open]') || document.body.classList.contains('title-screen-active') || !owned() || app.demoEnded) return;
        if (exhibition && (!app.started || app.busy || app.arrival?.active || app.state.flags.asleep || app.scenes.tourActive || app.scenes.receivingItem || app.scenes.receivingApplication || app.view.panel.querySelector('.dialogue-next-triangle') || app.activities.game?.isOpen)) return;
        if (!exhibition && (app.openingSequenceActive || app.isTutorialNavigationBlocked?.())) return;
        e.preventDefault(); e.stopImmediatePropagation();
        const scenes = exhibition ? app.scenes : app;
        scenes.townStage?.playerController?.keysHeld.clear(); scenes.officeStage?.keysHeld.clear(); app.openDiary();
    }, true);
}
