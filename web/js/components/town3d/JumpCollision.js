import { createTownPropBodies } from './TownPropBodies.js';
import { createExteriorBuildingBlocker } from './ExteriorBuildingBodies.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_HEIGHT } from './CharacterBodies.js';
import { SOMANGI_JUMP } from './SomangiJump.js';

export function createJumpBodies(model, id, {supportHeight=0}={}) {
    const groundMetadata=model.userData.rigidBody;
    const pieces=createTownPropBodies(model,id,{
        minHeight:PLAYER_BODY_HEIGHT, maxHeight:PLAYER_BODY_HEIGHT+SOMANGI_JUMP.height+supportHeight,
        splitTriangles:mesh=>/(^|_)(wall|wainscot|skirting)(_|\.|$)/i.test(mesh.name),
        includeMesh:mesh=>{
            if(mesh.name==='Wall_Front')return false; // retained cutaway doorway
            for(let node=mesh;node;node=node.parent){
                if(/character$|somangi-player/.test(node.name))return false;
            }
            return true;
        }
    });
    if(groundMetadata)model.userData.rigidBody=groundMetadata;
    const unique=new Map(pieces.map(b=>[
        [b.minX,b.maxX,b.minY,b.maxY].map(n=>n.toFixed(3)).join(','),
        {...b,minZ:b.minY/P,maxZ:b.maxY/P}
    ]));
    model.userData.jumpColliderCount=unique.size;
    return [...unique.values()];
}

export function installJumpCollision(controller, groundCanStand, bodies) {
    const overheadBlocked=createExteriorBuildingBlocker(bodies);
    controller.canJumpAt=(x,y)=>groundCanStand(x,y)&&!overheadBlocked(x,y);
    controller.canStand=(x,y)=>groundCanStand(x,y)
        && (!controller.jumpActive||!overheadBlocked(x,y));
    return controller.canStand;
}
