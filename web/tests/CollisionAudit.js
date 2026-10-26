import * as THREE from '../vendor/three/three.module.js';
import {GROUND_PROJECTION as P,TOWN_MODEL_BUILDINGS} from '../js/data/townModelBuildings.js';
import {TOWN_MODEL_PROPS} from '../js/data/townModelProps.js';
import {PLAYER_BODY_RADIUS as R} from '../js/components/town3d/CharacterBodies.js';
import {moveTownBody,recoverTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {auditRoom} from './CollisionAuditScenes.js';
import {insideTownBoundary} from '../js/data/townBoundary.js';

function probeBodies(bodies, canStand, controller, recoveryAllowed=()=>true) {
    const original={x:controller.charPosX,y:controller.charPosY};
    let samples=0,approaches=0,recoveries=0;
    const recoverySkippedOutsideBoundary=[];
    const issues=[], affected=new Set(), clearances=[0,16,28,R-1];
    for (const b of bodies) {
        const minZ=b.minY/P,maxZ=b.maxY/P,cx=(b.minX+b.maxX)/2,cz=(minZ+maxZ)/2;
        const diagonal=Math.SQRT1_2;
        const faces=[[b.minX,cz,-1,0],[b.maxX,cz,1,0],[cx,minZ,0,-1],[cx,maxZ,0,1],
            [b.minX,minZ,-diagonal,-diagonal],[b.maxX,minZ,diagonal,-diagonal],
            [b.minX,maxZ,-diagonal,diagonal],[b.maxX,maxZ,diagonal,diagonal]];
        for(const [x,z,nx,nz] of faces) {
            for(const distance of clearances) {
                samples++;
                const px=x+nx*distance,pz=z+nz*distance;
                if(canStand(px,pz)) {
                    affected.add(b.id||b.mesh);
                    if(issues.length<60)issues.push({id:b.id,mesh:b.mesh,x:px,z:pz,distance});
                }
            }
            const sx=x+nx*(R+4),sz=z+nz*(R+4);
            if(!canStand(sx,sz))continue;
            approaches++;
            controller.charPosX=sx;controller.charPosY=sz*P;
            moveTownBody(controller,-nx*(R+20),-nz*(R+20)*P);
            if(!controller.canStand(controller.charPosX,controller.charPosY))throw Error('Movement ended in a solid '+b.mesh);
        }
    }
    // Representative embedded state per object, not every triangle of a wall.
    const seen=new Set();
    for(const b of bodies){
        const id=b.id||b.mesh;if(seen.has(id))continue;seen.add(id);
        controller.charPosX=(b.minX+b.maxX)/2;controller.charPosY=(b.minY+b.maxY)/2;
        if(!recoveryAllowed(controller.charPosX,controller.charPosY)){
            recoverySkippedOutsideBoundary.push(id);continue;
        }
        if(controller.canStand(controller.charPosX,controller.charPosY))continue;
        if(recoverTownBody(controller))recoveries++;
        else { affected.add(id);if(issues.length<60)issues.push({id,mesh:b.mesh,error:'No overlap recovery'}); }
    }
    controller.charPosX=original.x;controller.charPosY=original.y;
    return {bodies:bodies.length,samples,approaches,recoveries,recoverySkippedOutsideBoundary,affected:[...affected],issues};
}

function auditCharacters(root, canStand) {
    root.updateMatrixWorld(true);
    const result=[];
    root.traverse(npc=>{
        if(!npc.name.endsWith('-character'))return;
        const box=new THREE.Box3().setFromObject(npc),center=box.getCenter(new THREE.Vector3());
        const size=box.getSize(new THREE.Vector3()),boxRadius=Math.max(30,size.x/2,size.z/2);
        const rootPosition=npc.getWorldPosition(new THREE.Vector3());
        let vertexRadius=0,rootRadius=0;
        npc.traverse(mesh=>{
            if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
            const point=new THREE.Vector3();
            for(let i=0;i<mesh.geometry.attributes.position.count;i++){
                mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
                vertexRadius=Math.max(vertexRadius,Math.hypot(point.x-center.x,point.z-center.z));
                rootRadius=Math.max(rootRadius,Math.hypot(point.x-rootPosition.x,point.z-rootPosition.z));
            }
        });
        const radius=Math.max(30,rootRadius);
        const leaks=[];
        for(let i=0;i<16;i++){
            const angle=i*Math.PI/8,distance=R+radius-1;
            const x=rootPosition.x+Math.cos(angle)*distance,z=rootPosition.z+Math.sin(angle)*distance;
            if(canStand(x,z))leaks.push({x,z});
        }
        result.push({name:npc.name,registered:!!npc.userData.rigidBody,radius,boxRadius,vertexRadius,rootRadius,leaks});
    });
    return result;
}

function animationEnvelope(player) {
    const result=[];
    for(const [name,variant] of player.variants){
        variant.action.reset().play();
        let radius=0,minHeight=Infinity,maxHeight=-Infinity;
        const duration=variant.action.getClip().duration;
        for(let frame=0;frame<17;frame++){
            variant.mixer.setTime(duration*frame/17);
            player.root.updateMatrixWorld(true);
            variant.model.traverse(mesh=>{
                if(!mesh.isMesh||!mesh.geometry.attributes.position)return;
                const point=new THREE.Vector3(),center=player.root.getWorldPosition(new THREE.Vector3());
                for(let i=0;i<mesh.geometry.attributes.position.count;i++){
                    mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld).sub(center);
                    minHeight=Math.min(minHeight,point.y);maxHeight=Math.max(maxHeight,point.y);
                    if(point.y>=6)radius=Math.max(radius,Math.hypot(point.x,point.z));
                }
            });
        }
        variant.action.stop();result.push({name,radius,minHeight,maxHeight});
    }
    player.setState('idle');return result;
}

export async function auditCollisions(app) {
    await app.scenes.ready;app.arrival.stop();cancelAnimationFrame(app.scenes.frame);
    const town=app.scenes.townModelScene,c=town.town.playerController;
    const townResult=probeBodies(town.collisionFootprints,(x,z)=>c.canStand(x,z*P),c,insideTownBoundary);
    townResult.expectedObjects=TOWN_MODEL_BUILDINGS.length+TOWN_MODEL_PROPS.length;
    townResult.registeredObjects=new Set(town.collisionFootprints.map(b=>b.id)).size;
    townResult.missingObjects=[...TOWN_MODEL_BUILDINGS,...TOWN_MODEL_PROPS]
        .filter(d=>!town.collisionFootprints.some(b=>b.id===d.id)).map(d=>d.id);
    townResult.characters=auditCharacters(town.scene,(x,z)=>c.canStand(x,z*P));
    await town.sleepingAnna.setAwake(true,{immediate:true});
    townResult.standingCharacters=auditCharacters(town.scene,(x,z)=>c.canStand(x,z*P));
    await town.sleepingAnna.setAwake(false);
    await town.sleepingAnna.setAwake(true);
    townResult.motionCharacters=[];
    for(let i=0;i<26;i++){
        town.sleepingAnna.update(.05);
        townResult.motionCharacters.push(...auditCharacters(town.scene,(x,z)=>c.canStand(x,z*P)));
    }
    const animation=animationEnvelope(town.player);
    const rooms=[];
    for(const place of ['home','store','information','bank','stock','training','simulation']){
        const room=await auditRoom(app,place);
        const initialPositionLegal=room.controller.canStand(room.controller.charPosX,room.controller.charPosY);
        const bodies=[...room.furnitureBodies.map(b=>({...b,id:b.mesh})),...room.wallBodies.map(b=>({...b,id:b.mesh}))];
        const result=probeBodies(bodies,(x,z)=>room.canStand(x,z),room.controller);
        rooms.push({place,initialPositionLegal,...result,characters:auditCharacters(room.room,(x,z)=>room.canStand(x,z))});
    }
    const npcIssues=[...townResult.characters,...townResult.standingCharacters,...townResult.motionCharacters,...rooms.flatMap(r=>r.characters)]
        .filter(npc=>!npc.registered||npc.leaks.length);
    return {radius:R,animation,town:townResult,rooms,npcIssues,
        issueGroups:townResult.affected.length+rooms.reduce((n,r)=>n+r.affected.length+Number(!r.initialPositionLegal),0)+npcIssues.length+townResult.missingObjects.length};
}
