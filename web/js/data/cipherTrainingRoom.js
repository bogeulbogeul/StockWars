import { LOBBY } from './cipherLobbyRoom.js';

// Reuse lobby shell dimensions; seating and terminal interaction will follow.
export const TRAINING_ROOM = {
    width: LOBBY.width, depth: LOBBY.depth, wallHeight: LOBBY.wallHeight, radius: LOBBY.radius,
    spawn: { x:390, z:-100, facing:'left' },
    returnDoor: { id:'lobby', label:'로비', z:-100, hint:'F · 로비로 돌아가기' },
    // Front-facing interior view: lower angle, gentle perspective, tighter framing.
    camera: { pitch: 30, fieldOfView: 24, targetY: 105, targetZ: -30,
        fitHeight: 540, framingMargin: 1.12 },
    cabinet: { x:-315, z:-235, width:148, depth:78 },
    desks: [{ id:'center', x:0, z:-70, width:260, depth:110, chairZ:100, chairRadius:44 }]
};

export function nearbyTrainingReturnDoor(x,z) {
    return x>=TRAINING_ROOM.width/2-100 && Math.abs(z-TRAINING_ROOM.returnDoor.z)<=70
        ? TRAINING_ROOM.returnDoor : null;
}

export function trainingCanStand(x, z) {
    const { width, depth, radius } = TRAINING_ROOM;
    if(Math.abs(x)>width/2-radius || Math.abs(z)>depth/2-radius)return false;
    const cabinet=TRAINING_ROOM.cabinet;
    if(Math.abs(x-cabinet.x)<cabinet.width/2+radius && Math.abs(z-cabinet.z)<cabinet.depth/2+radius)return false;
    return TRAINING_ROOM.desks.every(desk=>(Math.abs(x-desk.x)>=desk.width/2+radius
        || Math.abs(z-desk.z)>=desk.depth/2+radius)
        && Math.hypot(x-desk.x,z-desk.chairZ)>=desk.chairRadius+radius);
}
