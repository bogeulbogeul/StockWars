import { animationDialogue } from './AnimationDialogue.js';
import { Box3, Group, Vector3 } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { animate, arms, reach } from './HandoffMotion.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export const STORE_REWARD_ASSETS = Object.freeze({
    wage: new URL('../../../assets/items/3d/RewardPouch.glb', import.meta.url).href,
    envelope: new URL('../../../assets/items/3d/refined-v2/item_premium_rumor.glb', import.meta.url).href
});
export async function receiveStoreReward(app, id) {
    const room = app.scenes.rooms.get('store'), giver = room.shopkeeper;
    const { scene: model } = await new GLTFLoader().loadAsync(STORE_REWARD_ASSETS[id]);
    const box = new Box3().setFromObject(model), scale = 38 / Math.max(...box.getSize(new Vector3()).toArray());
    model.scale.setScalar(scale); model.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
    const item = new Group(); item.name = `store-${id}-handoff`; item.add(model); room.scene.add(item);
    room.scene.updateMatrixWorld(true);
    const start = giver.getWorldPosition(new Vector3()).add(new Vector3(0, 62, 0));
    item.position.copy(start);
    const held = room.player.root.localToWorld(new Vector3(0, 62, 27));
    const offered = start.clone().lerp(held, .55); offered.y = Math.max(start.y, held.y) + 8;
    const giving = arms(giver), receiving = arms(room.player.variants.get('walk').model);
    const guide = createMoaMovementGuide(app.view.root, { receive: id });
    let ready = false, accept;
    const received = new Promise(resolve => { accept = resolve; });
    const key = event => {
        if (event.ctrlKey || event.metaKey || event.altKey || !['KeyF', 'Escape'].includes(event.code)) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (ready && event.code === 'KeyF' && !event.repeat) { ready = false; guide.update({ visible: false }); advance.next(); }
    };
    app.scenes.receivingItem = true; window.addEventListener('keydown', key, true);
    room.rewardHandoffActive = id;
    const advance = animationDialogue(app, { speaker: '봉봉', text: id === 'wage' ? '수고했어요! 약속한 300잎이에요.' : '이 소식봉투도 가져가세요. 손님이 맡기고 갔어요.' });
    advance.onAdvance(accept);
    try {
        await animate(.85, t => {
            item.position.lerpVectors(start, offered, t); item.position.y += Math.sin(Math.PI * t) * 10;
            item.rotation.y = Math.atan2(room.camera.position.x - item.position.x, room.camera.position.z - item.position.z);
            reach(giving, .65 * t);
        }, advance.signal);
        ready = true; guide.update({ visible: true }); await received;
        await animate(.65, t => {
            item.position.lerpVectors(offered, held, t); reach(giving, .65 * (1 - t)); reach(receiving, .7 * t);
        }, advance.signal);
        await advance.wait();
    } finally {
        advance.dispose();
        guide.dispose(); reach(giving, 0); reach(receiving, 0); item.removeFromParent();
        model.traverse(mesh => { mesh.geometry?.dispose(); for (const m of [mesh.material].flat()) m?.dispose(); });
        window.removeEventListener('keydown', key, true); app.scenes.receivingItem = false;
        room.rewardHandoffActive = null;
    }
}
