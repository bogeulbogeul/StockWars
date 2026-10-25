import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { Group, Box3, Vector3 } from '../../../vendor/three/three.module.js';
import { animate, arms, reach } from './HandoffMotion.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export async function createHandoffPhone() {
    const url = new URL('../../../assets/items/3d/StorySmartphone.glb', import.meta.url);
    const { scene: model } = await new GLTFLoader().loadAsync(url.href);
    const bounds = new Box3().setFromObject(model), center = bounds.getCenter(new Vector3());
    const scale = 34 / bounds.getSize(new Vector3()).y;
    // Preserve the authored black case, inset screen, buttons and camera unchanged.
    model.scale.setScalar(scale); model.position.copy(center).multiplyScalar(-scale);
    model.traverse(mesh => { if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
    const phone = new Group(); phone.name = 'moa-phone-handoff';
    phone.userData.asset = 'story-smartphone-v2'; phone.add(model); return phone;
}
export async function receivePhone(app) {
    const room = app.scenes.rooms.get('information'), moa = room.room.userData.moa;
    room.scene.updateMatrixWorld(true);
    const phone = await createHandoffPhone(); room.scene.add(phone);
    const origin = moa.root.localToWorld(new Vector3(20, 65, 30));
    const desk = new Box3().setFromObject(room.room.getObjectByName('Rounded_Wood_Countertop'));
    const offered = new Vector3(room.player.root.position.x, desk.max.y + 24, desk.max.z + 18);
    const held = room.player.root.localToWorld(new Vector3(0, 62, 32));
    const giver = arms(moa.root), receiver = arms(room.player.variants.get('walk').model);
    const guide = createMoaMovementGuide(app.view.root, { receive: 'phone' });
    let ready = false, resolve;
    const received = new Promise(done => { resolve = done; });
    const key = event => {
        if (!['KeyF', 'Escape'].includes(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.code === 'KeyF' && ready && !event.repeat) { ready = false; guide.update({ visible: false }); resolve(); }
    };
    app.scenes.receivingItem = true; window.addEventListener('keydown', key, true);
    try {
        await animate(1.15, t => {
            phone.position.lerpVectors(origin, offered, t); phone.position.y += Math.sin(t * Math.PI) * 18;
            phone.rotation.x = -.65 * t; reach(giver, .65 * t);
        });
        ready = true; guide.update({ visible: true }); await received;
        await animate(.65, t => {
            phone.position.lerpVectors(offered, held, t); phone.rotation.x = -.65 - .35 * t;
            reach(giver, .65 * (1 - t)); reach(receiver, .75 * t);
        });
    } finally {
        guide.dispose(); reach(giver, 0); reach(receiver, 0); phone.removeFromParent();
        phone.traverse(mesh => { mesh.geometry?.dispose(); mesh.material?.dispose(); });
        window.removeEventListener('keydown', key, true); app.scenes.receivingItem = false;
    }
}
