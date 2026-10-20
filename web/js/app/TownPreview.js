import { TOWN_ARRIVAL } from '../data/townLandscapeLayout.js';

// A reversible art-review state: no new game, registration, or save reset.
export function startTownPreview(app) {
    app.officeStage.hide();
    app.townStage.show({ name: '그래픽 확인', ping: null });
    // Arrive in the open lane between the foreground stop and information office.
    // This art-preview position does not write to the player's save.
    app.townStage.playerController.charPosX = TOWN_ARRIVAL.x;
    app.townStage.playerController.charPosY = TOWN_ARRIVAL.y;
    app.townStage.playerController.updateCamera(app.townStage.viewportEl.clientWidth,
        app.townStage.viewportEl.clientHeight, 0, true);
    document.body.classList.add('town-mode-active');
    document.activeElement?.blur();

}
