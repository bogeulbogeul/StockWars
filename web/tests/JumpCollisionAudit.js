import {TOWN_MODEL_BUILDINGS,GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';
import {TOWN_MODEL_PROPS as PROPS} from '../js/data/townModelProps.js';
import {createJumpBodies} from '../js/components/town3d/JumpCollision.js';
import {PLAYER_BODY_RADIUS as R} from '../js/components/town3d/CharacterBodies.js';
import {auditRoom} from './CollisionAuditScenes.js';
import {moveTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {busStopPlatform} from '../js/components/town3d/BusStopGround.js';

function exerciseJump(c,player,bodies,owner) {
    for(const b of bodies){
        const minZ=b.minY/P,maxZ=b.maxY/P,cx=(b.minX+b.maxX)/2,cz=(minZ+maxZ)/2;
        for(const [x,z,nx,nz] of [[b.minX-R-5,cz,1,0],[b.maxX+R+5,cz,-1,0],
            [cx,minZ-R-5,0,1],[cx,maxZ+R+5,0,-1]]){
            if(!c.canJumpAt(x,z*P))continue;
            c.charPosX=x;c.charPosY=z*P;player.setState('idle');player.update(0);
            if(!player.play('jump',{scripted:true}))throw Error('Clear-space jump did not start');
            let peak=0,frames=0,capture;
            for(let i=0;i<40;i++){
                moveTownBody(c,nx*6,nz*6*P);player.update(1/60);frames++;
                peak=Math.max(peak,player.root.position.y-(c.supportHeight||0));
                if(i===16&&owner){
                    owner.renderer.render(owner.scene,owner.camera);
                    capture=owner.renderer.domElement.toDataURL('image/png');
                }
                if(!c.canStand(c.charPosX,c.charPosY))throw Error('Airborne movement entered an obstacle');
            }
            if(peak<19||player.jump.active||c.jumpActive||Math.abs(player.root.position.y-(c.supportHeight||0))>.001)throw Error('Jump landing/height');
            return {frames,peak,landed:true,legal:true,capture};
        }
    }
    throw Error('No valid jump contact test');
}

export async function auditJumpCollisions(app) {
    app.arrival.stop();cancelAnimationFrame(app.scenes.frame);
    const town=app.scenes.townModelScene;
    const definitions=[...TOWN_MODEL_BUILDINGS,...PROPS];
    const sources=definitions.map(d=>({model:town.scene.getObjectByName(d.id),id:d.id}));
    const groups=[{place:'town',c:town.town.playerController,player:town.player,bodies:town.collisionFootprints,sources}];
    for(const place of ['home','store','information','bank','stock','training','simulation']){
        const room=await auditRoom(app,place);
        groups.push({place,c:room.controller,player:room.player,owner:room,bodies:[...room.furnitureBodies,...room.wallBodies],sources:[{model:room.room,id:place}]});
    }
    const result=[];
    for(const group of groups){
        const {c}=group;let samples=0,unsafe=0,blockedStarts=0,airborneChecks=0;
        const affected=new Set(),examples=[];
        for(const source of group.sources){
            for(const b of createJumpBodies(source.model,source.id,{supportHeight:source.id==='village_bus_stop'?busStopPlatform(source.model)?.max.y||0:0})){
                const cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
                const d=(R-1)*Math.SQRT1_2;
                for(const [x,z] of [[b.minX-R+1,cz],[b.maxX+R-1,cz],[cx,b.minZ-R+1],[cx,b.maxZ+R-1],
                    [b.minX-d,b.minZ-d],[b.maxX+d,b.minZ-d],[b.minX-d,b.maxZ+d],[b.maxX+d,b.maxZ+d]]){
                    samples++;
                    if(!c.canStand(x,z*P))continue;
                    if(!c.canJumpAt||c.canJumpAt(x,z*P)){
                        unsafe++;affected.add(source.id);
                        if(examples.length<5)examples.push({id:source.id,mesh:b.mesh,x,z});
                    } else {
                        c.jumpActive=true;
                        if(c.canStand(x,z*P))throw Error('Airborne entry into overhead solid');
                        c.jumpActive=false;airborneChecks++;
                        if(blockedStarts<5){
                            c.charPosX=x;c.charPosY=z*P;group.player.setState('idle');
                            if(group.player.play('jump',{scripted:true}))throw Error('Jump started into overhead solid');
                            blockedStarts++;
                        }
                    }
                }
            }
        }
        const motion=c.canJumpAt?exerciseJump(c,group.player,group.bodies,group.owner):null;
        result.push({place:group.place,samples,unsafe,blockedStarts,airborneChecks,motion,affected:[...affected],examples});
    }
    return {groups:result,unsafe:result.reduce((n,g)=>n+g.unsafe,0)};
}
