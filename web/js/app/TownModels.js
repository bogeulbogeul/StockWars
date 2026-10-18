import { startTownPreview } from './TownPreview.js';

// Keep the legacy >500-line stage untouched; install the new renderer independently.
async function installTownModels() {
    const town = window.stockWarsApp?.townStage;
    if (!town?.viewportEl) return;
    const { TownModelScene } = await import('../components/town3d/TownModelScene.js');
    const models = new TownModelScene(town);
    window.stockWarsApp.townModelScene = models;
    startTownPreview(window.stockWarsApp);
    const draw = () => {
        models.draw();
        requestAnimationFrame(draw);
    };
    draw();
}

document.addEventListener('DOMContentLoaded', () => {
    void installTownModels().catch(error => console.error('Town renderer initialization:', error));
});
