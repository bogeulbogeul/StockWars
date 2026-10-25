import { Box3, Group, Matrix4, Quaternion, Vector3, MathUtils } from '../../../vendor/three/three.module.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

function animate(seconds, update) {
    return new Promise(resolve => {
        let previous, elapsed = 0;
        const tick = now => {
            const dt = previous === undefined || document.hidden ? 0 : Math.min((now - previous) / 1000, .05);
            previous = now; elapsed += dt;
            const t = Math.min(elapsed / seconds, 1); update(t * t * (3 - 2 * t));
            if (t === 1) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}
function arms(root) {
    return ['ArmL', 'ArmR'].map(name => root.getObjectByName(name) || root.getObjectByName(name.replace('L', '.L').replace('R', '.R')))
        .filter(Boolean).map(bone => ({ bone, rest: bone.quaternion.clone() }));
}
const axis = new Vector3(1, 0, 0), turn = new Quaternion();
function reach(bones, amount) {
    for (const { bone, rest } of bones) bone.quaternion.copy(rest).multiply(turn.setFromAxisAngle(axis, -amount));
}

export async function receiveResidencePaper(app) {
    const room = app.scenes.rooms.get('information'), moa = room.room.userData.moa;
    const source = room.room.getObjectByName('Application_Paper');
    if (!source) throw new Error('안내소 신청서 에셋을 찾지 못했어요.');
    room.scene.updateMatrixWorld(true);
    const origin = new Box3().setFromObject(source).getCenter(new Vector3());
    const paper = new Group(); paper.name = 'residence-application-handoff'; paper.position.copy(origin); room.scene.add(paper);
    paper.updateMatrixWorld(true);
    const originals = [];
    room.room.traverse(mesh => {
        if (!mesh.isMesh || !(mesh === source || /^(Paper_Header_Seal|Printed_Form_Line)(\.?\d+)?$/.test(mesh.name))) return;
        const clone = mesh.clone(false);
        new Matrix4().copy(paper.matrixWorld).invert().multiply(mesh.matrixWorld).decompose(clone.position, clone.quaternion, clone.scale);
        paper.add(clone); originals.push({ mesh, visible: mesh.visible }); mesh.visible = false;
    });
    // Keep the authored paper shape/print and bring it over the desk to the visitor.
    const desk = room.room.getObjectByName('Rounded_Wood_Countertop');
    const deskBox = new Box3().setFromObject(desk);
    const offered = new Vector3(room.player.root.position.x, Math.max(origin.y, deskBox.max.y) + 15, deskBox.max.z + 18);
    const held = room.player.root.localToWorld(new Vector3(0, 62, 32));
    const moaArms = arms(moa.root), playerArms = arms(room.player.variants.get('walk').model);
    const guide = createMoaMovementGuide(app.view.root, { receive: true });
    let ready = false, finishReceive;
    const received = new Promise(resolve => { finishReceive = resolve; });
    const onKey = event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (!['KeyF', 'Escape'].includes(event.code)) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.code === 'KeyF' && ready && !event.repeat) {
            ready = false; guide.update({ visible: false }); finishReceive();
        }
    };
    app.scenes.receivingApplication = true;
    window.addEventListener('keydown', onKey, true);
    let receivedSuccessfully = false;
    const restorePaper = () => { for (const { mesh, visible } of originals) mesh.visible = visible; };
    try {
        await animate(1.15, t => {
            paper.position.lerpVectors(origin, offered, t); paper.position.y += Math.sin(t * Math.PI) * 18;
            paper.rotation.x = -.12 * t; reach(moaArms, .65 * Math.sin(t * Math.PI / 2));
        });
        ready = true; guide.update({ visible: true });
        await received;
        await animate(.65, t => {
            paper.position.lerpVectors(offered, held, t); paper.position.y += Math.sin(t * Math.PI) * 10;
            paper.rotation.x = MathUtils.lerp(-.12, -.55, t);
            reach(playerArms, .75 * Math.sin(t * Math.PI / 2)); reach(moaArms, .65 * (1 - t));
        });
        receivedSuccessfully = true;
        return { returnToDesk: restorePaper };
    } finally {
        guide.dispose(); paper.removeFromParent();
        reach(moaArms, 0); reach(playerArms, 0);
        window.removeEventListener('keydown', onKey, true);
        app.scenes.receivingApplication = false;
        if (!receivedSuccessfully) restorePaper();
    }
}
