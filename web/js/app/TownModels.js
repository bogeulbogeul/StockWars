import { startTownPreview } from './TownPreview.js';
import { installHomeModelEntrance } from './HomeModelEntrance.js';
import { installCipherLobbyEntrance } from './CipherLobbyEntrance.js';
import { installVivianModelEntrance } from './VivianModelEntrance.js';

// Install the 3D renderer independently of stage input and UI.
async function installTownModels() {
    const town = window.stockWarsApp?.townStage;
    if (!town?.viewportEl) return;
    const { TownModelScene } = await import('../components/town3d/TownModelScene.js');
    const models = new TownModelScene(town);
    window.stockWarsApp.townModelScene = models;
    const updateHomeEntrance = installHomeModelEntrance(window.stockWarsApp);
    startTownPreview(window.stockWarsApp);
    const updateCipherEntrance = installCipherLobbyEntrance(window.stockWarsApp);
    const updateVivianEntrance = installVivianModelEntrance(window.stockWarsApp);
    const draw = () => {
        models.draw();
        updateHomeEntrance();
        updateCipherEntrance();
        updateVivianEntrance();
        requestAnimationFrame(draw);
    };
    draw();
}

document.addEventListener('DOMContentLoaded', () => {
    void installTownModels().catch(error => console.error('Town renderer initialization:', error));
});
