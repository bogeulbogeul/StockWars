import { EDIBLE_MODEL_IDS, loadEatingFood } from '../components/town3d/SomangiFoodAssets.js';

export function isModelFood(id) { return EDIBLE_MODEL_IDS.includes(id); }
export async function playConsumedFood(app, id) {
    if (!isModelFood(id)) return false;
    const rooms = [app.homeModelScene, app.vivianModelScene, app.informationModelScene, app.bankModelScene,
        app.cipherLobbyScene?.trainingRoomScene, app.cipherLobbyScene?.simulationRoomScene, app.cipherLobbyScene];
    const room = rooms.find(scene => scene?.active);
    const player = room?.player || (!app.townStage?.containerEl.classList.contains('hidden') ? app.townModelScene?.player : null);
    if (!player || player.state === 'eat') return false;
    try {
        const item = await loadEatingFood(id);
        player.town.playerController.keysHeld.clear(); player.town.playerController.isMoving = false;
        player.setState('idle');
        return player.play('eat', { scripted: true, foodId: id, foodObject: item });
    } catch (error) { console.error('Consumed food motion:', error); return false; }
}
