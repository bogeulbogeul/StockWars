import { animationDialogue } from './AnimationDialogue.js';
import { Box3, Group, Vector3 } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { animate, arms, reach } from './HandoffMotion.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export const MOA_GIFT_ASSETS = Object.freeze({
    grant: new URL('../../../assets/items/3d/RewardPouch.glb', import.meta.url).href,
    diary: new URL('../../../assets/items/3d/StoryDiary-closed.glb', import.meta.url).href
});
export async function receiveMoaGift(app, id) {
    const room = app.scenes.townModelScene, giver = room.sleepingAnna.root;
    const { scene: model } = await new GLTFLoader().loadAsync(MOA_GIFT_ASSETS[id]);
    const box = new Box3().setFromObject(model), scale = 38 / Math.max(...box.getSize(new Vector3()).toArray());
    model.scale.setScalar(scale); model.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale);
    const item = new Group(); item.name = `moa-${id}-handoff`; item.add(model); room.scene.add(item);
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
    
    const advance = animationDialogue(app, { speaker: '모아', text: id === 'grant' ? '정착 지원금 2,000잎이에요. 갚지 않아도 되는 돈이에요.' : '앞으로의 하루를 담을 다이어리예요. 받아주세요.' });
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
        
    }
}

