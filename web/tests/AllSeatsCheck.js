import * as THREE from '../vendor/three/three.module.js';
import {GROUND_PROJECTION as P} from '../js/data/townModelBuildings.js';
import {auditRoom} from './CollisionAuditScenes.js';
import {createExteriorBuildingBlocker} from '../js/components/town3d/ExteriorBuildingBodies.js';

function poseCheck(owner,seat){
    const b=seat.bounds,point=new THREE.Vector3(),model=owner.player.variants.get('walk').model;
    let underside=Infinity;const vertices=[];
    owner.player.root.updateMatrixWorld(true);
    model.traverse(mesh=>{
        if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();
        for(let i=0;i<mesh.geometry.attributes.position.count;i++){
            mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
            if(point.x>=b.min.x&&point.x<=b.max.x&&point.z>=b.min.z&&point.z<=b.max.z)underside=Math.min(underside,point.y);
            if(i%7===0)vertices.push(point.clone());
        }
    });
    if(!Number.isFinite(underside)||underside<b.max.y-.01)throw Error('Seat penetration '+seat.id);
    const root=owner.room||seat.meshes[0].parent,solids=[];
    root.updateMatrixWorld(true);
    root.traverse(mesh=>{
        if(!mesh.isMesh||seat.meshes.includes(mesh)||/(floor|wall|skirting|wainscot|trim|molding)/i.test(mesh.name))return;
        for(let p=mesh;p;p=p.parent)if(/character$|somangi-player/.test(p.name))return;
        solids.push({mesh,box:new THREE.Box3().setFromObject(mesh)});
    });
    const ray=new THREE.Raycaster(),direction=new THREE.Vector3(1,.137,.231).normalize();let intersections=0;
    for(const solid of solids){
        const materials=[solid.mesh.material].flat(),sides=materials.map(m=>m.side);
        materials.forEach(m=>m.side=THREE.DoubleSide);
        for(const v of vertices){
            if(!solid.box.containsPoint(v))continue;
            ray.set(v,direction);const hits=ray.intersectObject(solid.mesh,false);
            let count=0,previous=-1;
            for(const hit of hits){if(Math.abs(hit.distance-previous)>1e-4){count++;previous=hit.distance;}}
            if(count%2===1)intersections++;
        }
        materials.forEach((m,i)=>m.side=sides[i]);
    }
    return {underside,top:b.max.y,intersections};
}

export async function checkAllSeats(app){
    await app.scenes.ready;app.arrival.stop();app.busy=false;app.view.panel.hidden=true;
    cancelAnimationFrame(app.scenes.frame);
    const town=app.scenes.townModelScene,groups=[{place:'town',owner:town}];
    for(const place of ['home','store','information','bank','stock','training','simulation']){
        const owner=await auditRoom(app,place);groups.push({place,owner});
    }
    const result=[];
    for(const {place,owner} of groups){
        if(place==='town')app.scenes.townStage.containerEl.classList.remove('hidden');else owner.show();
        const manager=owner.seatInteraction,c=manager.c;
        for(const seat of manager.seats){
            if(manager.occupied(seat)){result.push({place,id:seat.id,occupied:true});continue;}
            const exit=manager.exits(seat)[0];if(!exit){result.push({place,id:seat.id,error:'No seat exit'});continue;}
            c.charPosX=exit.x;c.charPosY=exit.y;
            owner.player.previous={x:exit.x,z:exit.y/P};owner.player.setState('idle');owner.player.update(0);
            if(!manager.sit(seat))throw Error('Cannot sit '+seat.id);
            const pose=poseCheck(owner,seat);
            if(place==='town'){
                const blocked=createExteriorBuildingBlocker(owner.collisionFootprints.filter(b=>b.collisionKind==='building'));
                pose.buildingClear=!blocked(c.charPosX,c.charPosY);
                owner.draw();
            }
            if(pose.intersections||pose.buildingClear===false)throw Error('Seated body intersects surrounding model '+seat.id);
            owner.renderer.render(owner.scene,owner.camera);
            const capture=owner.renderer.domElement.toDataURL('image/png');
            if(!manager.stand()||!c.canStand(c.charPosX,c.charPosY))throw Error('Cannot stand '+seat.id);
            result.push({place,id:seat.id,label:seat.label,pose,capture});
        }
        if(place==='town')app.scenes.townStage.containerEl.classList.add('hidden');else owner.hide();
    }
    return {seats:result};
}

export async function prepareSeatKeyboard(app,place){
    app.arrival.stop();app.busy=false;app.view.panel.hidden=true;
    let owner;
    if(place==='town'){
        for(const room of app.scenes.rooms.values())room.hide();
        owner=app.scenes.townModelScene;app.scenes.townStage.containerEl.classList.remove('hidden');
    }else{
        app.scenes.townStage.containerEl.classList.add('hidden');
        owner=await auditRoom(app,place);owner.show();
    }
    const manager=owner.seatInteraction;
    const seat=manager.seats.find(s=>!manager.occupied(s)&&manager.exits(s).length);
    const exit=manager.exits(seat)[0],c=manager.c;
    c.charPosX=exit.x;c.charPosY=exit.y;owner.player.previous={x:exit.x,z:exit.y/P};
    owner.player.update(0);manager.update(0);
    window.__seatKeyboardOwner=owner;
    if(place==='town'){
        const draw=()=>{owner.draw();window.__seatKeyboardTick=requestAnimationFrame(draw);};draw();
    }
    return {id:seat.id,enabled:manager.enabled(),nearest:manager.nearest()?.id};
}
