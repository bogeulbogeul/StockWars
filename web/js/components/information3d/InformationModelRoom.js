import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { INFORMATION_MODEL_URL } from '../../data/informationModelRoom.js';
import { MoaCharacter } from '../town3d/MoaCharacter.js';
import { MOA_INFORMATION_POSITION } from '../../data/moaModels.js';
import { seatMoaOnBench } from '../town3d/MoaBenchPose.js';
import { InformationGuidebook } from './InformationGuidebook.js';
import { addInformationWaitingCorner } from './InformationWaitingCorner.js';

export function buildInformationModelRoom(scene) {
    const room = new THREE.Group();
    room.name = 'settlement-information-interior';
    scene.add(room);
    const moa = new MoaCharacter(room, MOA_INFORMATION_POSITION);
    room.userData.moa = moa;
    room.userData.createInteraction = owner => new InformationGuidebook(owner);
    room.userData.moaReady = moa.ready;
    room.userData.furnitureReady = addInformationWaitingCorner(room);
    room.userData.update = dt => moa.update(dt);
    room.userData.shellReady = new GLTFLoader().loadAsync(INFORMATION_MODEL_URL).then(gltf => {
        const model = gltf.scene;
        model.name = 'information-furnished-room';
        model.scale.setScalar(100);
        model.position.y = -2.2;
        model.traverse(object => {
            if (object.userData.interiorFrontCutaway) object.visible = false;
            if (!object.isMesh) return;
            object.castShadow = object.receiveShadow = true;
        });
        room.add(model);
        return model;
    });
    room.userData.seatMoa = async () => {
        await Promise.all([moa.ready, room.userData.shellReady]);
        if (moa.root.userData.seated) return;
        const seat = room.getObjectByName('Seat_Sage_Cushion');
        if (!seat) throw new Error('안내소 의자 좌판을 찾지 못했어요.');
        const center = new THREE.Box3().setFromObject(seat).getCenter(new THREE.Vector3());
        const legs = ['LegL', 'LegR'].map(name => moa.root.getObjectByName(name)
            || moa.root.getObjectByName(name.replace('L', '.L').replace('R', '.R')));
        const rest = legs.map(bone => ({ bone, position: bone.position.clone(), quaternion: bone.quaternion.clone() }));
        room.userData.moaSeatRest = rest;
        moa.root.position.set(center.x, 0, center.z); moa.root.rotation.y = 0;
        seatMoaOnBench(moa, room, { seat, forwardOffset: 3 });
        await moa.setMood('calm', 'smile');
    };
    return room;
}
