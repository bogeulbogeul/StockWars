import {TOWN_MODEL_BUILDINGS,GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';
import {TOWN_ARRIVAL} from '../js/data/townLandscapeLayout.js';
import {moveTownBody,recoverTownBody} from '../js/components/town3d/TownBodyMovement.js';
import {PLAYER_BODY_RADIUS as R} from '../js/components/town3d/CharacterBodies.js';

export async function checkExteriorBuildings(app) {
    app.arrival.stop();
    const scene=app.scenes.townModelScene,c=scene.town.playerController;
    const step=12,key=(x,y)=>`${x},${y}`;
    const queue=[[Math.round(TOWN_ARRIVAL.x/step),Math.round(TOWN_ARRIVAL.y/step)]];
    const visited=new Set([key(...queue[0])]);
    for(let i=0;i<queue.length;i++){
        const [x,y]=queue[i];
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const nx=x+dx,ny=y+dy,k=key(nx,ny);
            if(nx<45||nx>249||ny<60||ny>208||visited.has(k)||!c.canStand(nx*step,ny*step))continue;
            visited.add(k);queue.push([nx,ny]);
        }
    }
    const result=[];
    for(const definition of TOWN_MODEL_BUILDINGS){
        const bodies=scene.collisionFootprints.filter(b=>b.id===definition.id&&b.collisionKind==='building');
        if(!bodies.length)throw Error('Missing exterior bodies '+definition.id);
        for(const b of bodies){
            if(c.canStand((b.minX+b.maxX)/2,(b.minY+b.maxY)/2))throw Error('Exterior not solid '+definition.id);
        }
        const entryX=definition.x+(definition.entranceOffsetX||0);
        const approach=queue.find(([x,y])=>Math.abs(x*step-entryX)<30
            && y*step>=definition.y+30 && y*step<definition.y+115);
        if(!approach)throw Error('Entrance unreachable '+definition.id);
        let contact;
        for(const b of bodies){
            const cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
            const candidates=[[b.minX-R-4,cz],[b.maxX+R+4,cz],[cx,b.minZ-R-4],[cx,b.maxZ+R+4]];
            const start=candidates.find(([x,z])=>c.canStand(x,z*P));
            if(!start)continue;
            c.charPosX=start[0];c.charPosY=start[1]*P;
            moveTownBody(c,(cx-start[0])*2,(cz-start[1])*2*P);
            if(!c.canStand(c.charPosX,c.charPosY))throw Error('Exterior approach penetrated '+definition.id);
            const nx=Math.max(b.minX,Math.min(b.maxX,c.charPosX));
            const nz=Math.max(b.minZ,Math.min(b.maxZ,c.charPosY/P));
            const clearance=Math.hypot(c.charPosX-nx,c.charPosY/P-nz);
            if(clearance<R-.01)throw Error('Body clearance '+definition.id);
            contact={x:c.charPosX,y:c.charPosY,clearance};break;
        }
        if(!contact)throw Error('No accessible exterior contact '+definition.id);
        const body=bodies[0];c.charPosX=(body.minX+body.maxX)/2;c.charPosY=(body.minY+body.maxY)/2;
        const recovered=recoverTownBody(c);
        if(!recovered||!c.canStand(c.charPosX,c.charPosY))throw Error('Exterior overlap recovery '+definition.id);
        result.push({id:definition.id,bodies:bodies.length,entrance:{x:approach[0]*step,y:approach[1]*step},contact,recovered});
    }
    // Front approach keeps the player visible rather than behind a roof.
    const home=TOWN_MODEL_BUILDINGS.find(b=>b.id==='home_office_tower');
    c.charPosX=home.x+(home.entranceOffsetX||0);c.charPosY=home.y+100;c.facing='up';
    if(!c.canStand(c.charPosX,c.charPosY))throw Error('Home front camera approach');
    moveTownBody(c,0,-200*P);
    if(!c.canStand(c.charPosX,c.charPosY))throw Error('Home front movement penetrated');
    app.view.panel.hidden=true;
    app.scenes.townStage.containerEl.classList.remove('hidden');scene.draw();
    return {buildings:result,reachableCells:visited.size,frontContact:{x:c.charPosX,y:c.charPosY}};
}
