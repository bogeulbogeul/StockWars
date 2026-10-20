import { LOBBY } from './cipherLobbyRoom.js';
import { TRAINING_ROOM } from './cipherTrainingRoom.js';

export const SIMULATION_ROOM={
    width:LOBBY.width,depth:LOBBY.depth,wallHeight:LOBBY.wallHeight,radius:LOBBY.radius,
    spawn:{x:-390,z:-100,facing:'right'},camera:{...LOBBY.camera},
    returnDoor:{id:'lobby',label:'로비',z:-100,hint:'F · 로비로 돌아가기'},
    desks:TRAINING_ROOM.desks.map(desk=>({...desk})),
    cabinet:{x:300,z:-235,width:148,depth:78},
    plants:[{x:-340,z:-235,radius:38},{x:365,z:235,radius:38}]
};
export function simulationCanStand(x,z){
    const {width,depth,radius}=SIMULATION_ROOM;
    if(Math.abs(x)>width/2-radius || Math.abs(z)>depth/2-radius)return false;
    for(const item of [SIMULATION_ROOM.cabinet]){
        if(Math.abs(x-item.x)<item.width/2+radius && Math.abs(z-item.z)<item.depth/2+radius)return false;
    }
    if(SIMULATION_ROOM.plants.some(plant=>Math.hypot(x-plant.x,z-plant.z)<plant.radius+radius))return false;
    return SIMULATION_ROOM.desks.every(desk=>(Math.abs(x-desk.x)>=desk.width/2+radius
        || Math.abs(z-desk.z)>=desk.depth/2+radius)
        && Math.hypot(x-desk.x,z-desk.chairZ)>=desk.chairRadius+radius);
}
export function nearbySimulationReturnDoor(x,z){
    return x<=-SIMULATION_ROOM.width/2+100 && Math.abs(z-SIMULATION_ROOM.returnDoor.z)<=70
        ? SIMULATION_ROOM.returnDoor:null;
}
