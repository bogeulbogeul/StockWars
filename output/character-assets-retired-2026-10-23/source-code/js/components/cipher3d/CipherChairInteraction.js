import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

const movement = keys => ['w','a','s','d'].some(key=>keys.has(key));
const smooth = t => t*t*(3-2*t);

export class CipherChairInteraction {
    constructor(scene) {
        this.scene=scene;
        this.phase='idle';
        this.canEnter=true;
        this.visual=new THREE.Group();
        this.visual.name='somangi-office-seated';
        this.visual.visible=false;
        scene.scene.add(this.visual);
    }

    async load() {
        const base='../../../assets/characters/3d/somangi/';
        const [gltf,metadata]=await Promise.all([
            new GLTFLoader().loadAsync(new URL(base+'office-sit.glb',import.meta.url).href),
            fetch(new URL(base+'office-sit.json',import.meta.url)).then(response=>{
                if(!response.ok)throw new Error('Missing office seating metadata');
                return response.json();
            })
        ]);
        this.metadata=metadata;
        gltf.scene.scale.setScalar(metadata.scale);
        gltf.scene.traverse(object=>{
            if(object.isMesh){object.castShadow=true;object.frustumCulled=false;}
        });
        this.visual.add(gltf.scene);
        this.mixer=new THREE.AnimationMixer(gltf.scene);
        const clip=gltf.animations.find(clip=>clip.name===metadata.clip);
        if(!clip)throw new Error('Missing office sit clip');
        this.duration=clip.duration;
        this.action=this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopOnce,1);this.action.clampWhenFinished=true;this.action.play();
        return this;
    }

    frontSeat(x,z) {
        return (this.scene.room.userData.facilitySeats || this.scene.room.userData.trainingSeats)?.find(seat=>{
            const p=seat.model.position;
            return Math.abs(x-p.x)<29 && z>=p.z-105 && z<=p.z-60;
        });
    }

    onKeyRelease() {
        if(!movement(this.scene.controller.keysHeld)) {
            this.armed=true;
            if(this.phase==='idle')this.canEnter=true;
        }
    }

    tryEnter(dx,dz,x,z) {
        if(!this.canEnter || dz<.7 || this.scene.player.state!=='idle' && this.scene.player.state!=='walk')return false;
        const seat=this.frontSeat(x,z);
        if(!seat)return false;
        this.seat=seat;
        this.start=new THREE.Vector3(x,0,z);
        const contact=seat.contact.getWorldPosition(new THREE.Vector3());
        const offset=new THREE.Vector3(...this.metadata.contact).multiplyScalar(this.metadata.scale);
        offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
        this.target=contact.sub(offset);this.target.y+=.1;
        this.visual.position.copy(this.start);this.visual.rotation.y=Math.PI;
        this.visual.visible=true;this.scene.player.root.visible=false;
        this.scene.player.setState('idle');
        this.scene.controller.isMoving=false;this.scene.controller.isResting=true;
        this.phase='sitting';this.progress=0;this.armed=false;this.canEnter=false;
        return true;
    }

    update(dt) {
        const scene=this.scene,c=scene.controller;
        if(this.phase==='idle') {
            if(!movement(c.keysHeld))this.canEnter=true;
            const seat=this.frontSeat(c.charPosX,c.charPosY/GROUND_PROJECTION);
            this.idleHint=seat?'의자 쪽으로 이동 · 앉기':null;
            return false;
        }
        c.isMoving=false;
        if(this.phase==='seated') {
            if(!movement(c.keysHeld))this.armed=true;
            if(this.armed && movement(c.keysHeld)) {
                const p=this.seat.model.position;
                const exits=[{x:p.x,z:p.z-85},{x:p.x-85,z:p.z},{x:p.x+85,z:p.z}];
                const destination=exits.find(p=>scene.canStand(p.x,p.z));
                if(destination){this.start=new THREE.Vector3(destination.x,0,destination.z);this.phase='standing';}
            }
        } else {
            this.progress=THREE.MathUtils.clamp(this.progress+dt/(.6)*(this.phase==='sitting'?1:-1),0,1);
        }
        const blend=smooth(this.progress);
        this.visual.position.lerpVectors(this.start,this.target,blend);
        // Lift over the cushion's front edge before settling, and reverse on exit.
        this.visual.position.y+=Math.sin(Math.PI*this.progress)*25;
        this.action.paused=false;this.action.enabled=true;
        this.mixer.setTime(this.progress*this.duration);
        c.charPosX=this.visual.position.x;c.charPosY=this.visual.position.z*GROUND_PROJECTION;
        c.facing='up';
        scene.player.hint.textContent=this.phase==='seated'?'이동키 · 일어나기 · Esc 로비'
            :this.phase==='standing'?'일어나는 중…':'의자에 앉는 중…';
        if(this.phase==='sitting' && this.progress===1)this.phase='seated';
        if(this.phase==='standing' && this.progress===0)this.reset();
        return true;
    }

    reset() {
        this.phase='idle';this.visual.visible=false;this.canEnter=false;
        this.scene.controller.isResting=false;this.scene.controller.isMoving=false;
        this.scene.player.root.visible=true;this.scene.player.setState('idle');
        this.scene.player.update(0);
    }
}

export async function createCipherChairInteraction(scene) {
    return new CipherChairInteraction(scene).load();
}
