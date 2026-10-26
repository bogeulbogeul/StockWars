import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { resolveTourStop } from './TourRoute.js';
import { faceConversation } from '../../components/town3d/ConversationFacing.js';
import { quickFade } from '../QuickTravel.js';
export async function walkVillageTour(scenes, destination) {
    await scenes.ready;
    const town = scenes.townModelScene, moa = town.sleepingAnna, c = scenes.townStage.playerController;
    await moa.standReady;
    scenes.tourActive = true;
    try { await quickFade(async () => {
        await moa.setAwake(true, { immediate: true }); await moa.setMood('calm', 'smile');
        const goal = resolveTourStop({ x: destination[0], y: destination[1] }, c.sceneryCanStand);
        const playerGoal = resolveTourStop({ x: goal.x + 95, y: goal.y + 20 }, c.sceneryCanStand);
        c.keysHeld.clear(); c.charPosX = playerGoal.x; c.charPosY = playerGoal.y; c.isMoving = false;
        moa.root.position.set(goal.x, c.supportHeightAt?.(goal.x, goal.y) || 0, goal.y / P);
        moa.root.visible = true; moa.root.userData.tourWalking = false;
        town.player.storyYaw = town.player.storyTarget = town.player.storyCamera = null;
        town.player.update(0); town.player.setState('idle'); faceConversation(town.player, moa);
        town.conversationCamera?.reset(town.camera); town.draw();
    }); } finally { scenes.tourActive = false; }
}
