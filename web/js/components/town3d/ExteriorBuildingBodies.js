import { createTownPropBodies } from './TownPropBodies.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { PLAYER_BODY_RADIUS } from './CharacterBodies.js';

export function createExteriorBuildingBodies(model, id) {
    // Roof/eaves above the player's head must not inflate the ground footprint.
    return createTownPropBodies(model, id, {minHeight:6}).map(body => ({
        ...body, collisionKind:'building', minZ:body.minY/GROUND_PROJECTION,
        maxZ:body.maxY/GROUND_PROJECTION
    }));
}

export function createExteriorBuildingBlocker(bodies) {
    const cells=new Map(), size=128, radius=PLAYER_BODY_RADIUS;
    for(const body of bodies){
        for(let x=Math.floor((body.minX-radius)/size);x<=Math.floor((body.maxX+radius)/size);x++){
            for(let z=Math.floor((body.minZ-radius)/size);z<=Math.floor((body.maxZ+radius)/size);z++){
                const key=`${x},${z}`;
                if(!cells.has(key))cells.set(key,[]);
                cells.get(key).push(body);
            }
        }
    }
    return (x,y) => {
        const z=y/GROUND_PROJECTION;
        return (cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)||[]).some(body=>{
            const nx=Math.max(body.minX,Math.min(body.maxX,x));
            const nz=Math.max(body.minZ,Math.min(body.maxZ,z));
            return Math.hypot(x-nx,z-nz)<radius;
        });
    };
}
