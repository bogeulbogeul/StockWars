import { retireLegacyWorldViews } from './CurrentWorldViews.js';
import { startTownPreview } from './TownPreview.js';
import { installHomeModelEntrance } from './HomeModelEntrance.js';
import { installCipherLobbyEntrance } from './CipherLobbyEntrance.js';
import { installPackingEntrance } from './PackingEntrance.js';
import { installVivianModelEntrance } from './VivianModelEntrance.js';
import { installBankModelEntrance } from './BankModelEntrance.js';
import { installInformationModelEntrance } from './InformationModelEntrance.js';
e4467a027e8cbbb4b3332b7d0218b1384450c9cd

// Install the 3D renderer independently of stage input and UI.
async function installTownModels() {
    const town = window.stockWarsApp?.townStage;
    if (!town?.viewportEl) return;
    const { TownModelScene } = await import('../components/town3d/TownModelScene.js');
    retireLegacyWorldViews(window.stockWarsApp);
    const models = new TownModelScene(town);
    window.stockWarsApp.townModelScene = models;
    const updateHomeEntrance = installHomeModelEntrance(window.stockWarsApp);
    startTownPreview(window.stockWarsApp);
    const updateCipherEntrance = installCipherLobbyEntrance(window.stockWarsApp);
    const updatePackingEntrance = installPackingEntrance(window.stockWarsApp);
    const updateVivianEntrance = installVivianModelEntrance(window.stockWarsApp);
    const updateBankEntrance = installBankModelEntrance(window.stockWarsApp);
    const updateInformationEntrance = installInformationModelEntrance(window.stockWarsApp);
e4467a027e8cbbb4b3332b7d0218b1384450c9cd
    const draw = () => {
        models.draw();
        updateHomeEntrance();
        updateCipherEntrance();
        updatePackingEntrance();
        updateVivianEntrance();
        updateBankEntrance();
        updateInformationEntrance();
e4467a027e8cbbb4b3332b7d0218b1384450c9cd
        requestAnimationFrame(draw);
    };
    draw();
}

document.addEventListener('DOMContentLoaded', () => {
    void installTownModels().catch(error => console.error('Town renderer initialization:', error));
});
