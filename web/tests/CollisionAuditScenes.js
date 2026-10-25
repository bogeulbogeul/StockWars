import {CipherLobbyScene} from '../js/components/cipher3d/CipherLobbyScene.js';

export async function auditRoom(app, place) {
    if (!['training','simulation'].includes(place)) {
        await app.scenes.show(place);
        const room=app.scenes.rooms.get(place);await room.ready;room.hide();return room;
    }
    const training=place==='training';
    const data=await import(training?'../js/data/cipherTrainingRoom.js':'../js/data/cipherSimulationRoom.js');
    const build=await import(training?'../js/components/cipher3d/CipherTrainingShell.js':'../js/components/cipher3d/CipherSimulationShell.js');
    const room=new CipherLobbyScene(app.scenes.container,()=>{}, {
        layout:training?data.TRAINING_ROOM:data.SIMULATION_ROOM,
        canStand:training?data.trainingCanStand:data.simulationCanStand,
        buildRoom:training?build.buildCipherTrainingShell:build.buildCipherSimulationShell,
        nearbyDoor:training?data.nearbyTrainingReturnDoor:data.nearbySimulationReturnDoor,
        automaticExit:false
    });
    await room.ready;return room;
}
