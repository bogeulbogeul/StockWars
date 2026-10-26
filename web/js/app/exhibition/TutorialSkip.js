import { skipStageRange, applyTutorialSkip } from './TutorialSkipState.js';
import { prepareMoaAfterSkip } from './TutorialSkipMoa.js';

export function installTutorialSkip(app) {
    const button = document.createElement('button'); button.type = 'button';
    button.className = 'tutorial-stage-skip';
    button.setAttribute('aria-label', '현재 튜토리얼 단계 건너뛰기');
    app.view.root.append(button);
    let skipping = false;
    const available = () => app.started && ((!app.busy && !app.scenes.tourActive) || !!app.scenes.cancelReviewTravel)
        && !app.scenes.receivingItem && !app.scenes.receivingApplication
        && (!document.querySelector('dialog[open]') || app.activities.game?.isOpen) && !app.state.flags.asleep;
    const update = () => {
        const host = app.activities.game?.isOpen ? app.activities.game.dialog : app.view.root;
        if (button.parentElement !== host) host.append(button);
        const stage = skipStageRange(app.plan, app.state.cursor);
        const hidden = !app.started || !stage || !!app.state.flags.asleep;
        const disabled = skipping || !available();
        if (button.hidden !== hidden) button.hidden = hidden;
        if (button.disabled !== disabled) button.disabled = disabled;
        const text = stage ? `${stage.label} 건너뛰기` : '단계 건너뛰기';
        if (button.textContent !== text) button.textContent = text;
        const title = disabled ? '연출·수령·열린 화면을 마친 뒤 이 단계를 건너뛸 수 있어요.'
            : '현재 단계의 대사와 활동을 건너뛰고 다음 단계로 진행합니다.';
        if (button.title !== title) button.title = title;
    };
    button.onclick = async () => {
        if (skipping || !available()) return;
        const range = skipStageRange(app.plan, app.state.cursor);
        if (!range) return;
        skipping = true; app.busy = true; update();
        const previous = structuredClone(app.state);
        try {
            if (app.scenes.cancelReviewTravel) {
                const pending = app.renderTask;
                app.scenes.cancelReviewTravel();
                await pending;
            }
            app.inventory.cancelRumorRead?.();
            app.cancelFinaleWait?.();
            applyTutorialSkip(app.state, app.plan, range);
            if (!app.save()) { app.state = previous; app.busy = false; return; }
            const game = app.activities.game;
            if (game?.isOpen) {
                const onClose = game.onClose; game.onClose = () => {};
                game.dialog.addEventListener('close', () => { game.onClose = onClose; }, { once: true });
                game.close(); app.view.root.append(button);
            }
            app.arrival.stop(); app.noticeControls?.dispose(); app.noticeControls = null;
            app.storeDestinationGuard?.dispose(); app.storeDestinationGuard = null;
            await prepareMoaAfterSkip(app, range);
            app.inventory.sync(); app.view.sync(app.state);
            app.busy = false;
            if (range.end === app.plan.length) await app.sleep();
            else void app.render();
        } catch (error) {
            app.state = previous; app.busy = false; app.view.sync(app.state);
            app.view.error('단계를 건너뛰지 못했어요. 다시 시도해 주세요.'); console.error(error);
        } finally { skipping = false; update(); }
    };
    const timer = setInterval(update, 150); update();
    return { update, dispose() { clearInterval(timer); button.remove(); } };
}
