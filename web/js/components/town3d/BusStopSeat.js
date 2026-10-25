import { gameKey } from '../../app/GameKeys.js';
import { setInteractionGuidance } from './GuidanceCard.js';
import {Box3} from '../../../vendor/three/three.module.js';
import {GROUND_PROJECTION as P} from '../../data/townModelBuildings.js';
import {PLAYER_BODY_RADIUS as R} from './CharacterBodies.js';
import {busStopPlatform,busStopSupportHeight} from './BusStopGround.js';
import {createBusStopSeatPose} from './BusStopSeatPose.js';
import {registerSeatController,seatKeyAvailable,seatUiBlocked} from './SeatControls.js';

export class BusStopSeat {
    constructor(owner,stop){
        this.owner=owner;this.stop=stop;this.c=owner.town.playerController;
        this.platform=busStopPlatform(stop);
        this.c.supportHeightAt=(x,y)=>busStopSupportHeight(this.platform,x,y);
        this.bounds=new Box3().setFromObject(stop.getObjectByName('Bench_Seat'));
        this.state='standing';this.c.activeSeat=this;
        this.button=document.createElement('button');
        this.button.className='bus-stop-seat-action seat-action';this.button.hidden=true;
        this.button.setAttribute('aria-keyshortcuts','E');
        this.button.addEventListener('click',()=>this.toggle());owner.layer.append(this.button);
        this.unregister=registerSeatController(this);
        window.addEventListener('keydown',event=>this.handleKeyDown(event),true);
    }
    handleKeyDown(event){
        if(!this.enabled()||!seatKeyAvailable(event))return false;
        if(event.code==='KeyE'&&this.near()){
            event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)this.toggle();return true;
        }
        if(this.c.busSeated&&this.c.activeSeat===this&&['w','a','s','d'].includes(gameKey(event))&&!this.stand()){
            event.preventDefault();event.stopImmediatePropagation();return true;
        }
        return false;
    }
    enabled(){
        const app=window.stockWarsExhibition;
        return document.body.classList.contains('town-model-mode')
            &&!this.owner.town.containerEl.classList.contains('hidden')&&!this.c.scriptedWalking
            &&!seatUiBlocked()
            &&(app?app.started&&(app.arrival.active||(!app.busy&&!app.scenes.tourActive))
                :!this.owner.town.callbacks?.isInputBlocked?.());
    }
    near(){
        if(this.c.busSeated)return this.c.activeSeat===this;
        const x=this.c.charPosX,z=this.c.charPosY/P,b=this.bounds;
        return Math.hypot(x-Math.max(b.min.x,Math.min(b.max.x,x)),
            z-Math.max(b.min.z,Math.min(b.max.z,z)))<=R+32;
    }
    toggle(){
        if(!this.enabled()||!this.near())return false;
        return this.c.busSeated?this.stand():this.sit();
    }
    sit(){
        if(this.c.busSeated||this.owner.player.jump.active)return false;
        const x=this.bounds.min.x+R+12;
        const exit={x,y:(this.bounds.max.z+R+8)*P};
        if(!this.c.canStand(exit.x,exit.y))return false;
        const restore=createBusStopSeatPose(this.owner.player,this.stop,x);
        if(!restore)return false;
        this.restore=restore;this.exit=exit;
        this.c.activeSeat=this;
        this.c.keysHeld.clear();
        this.c.isResting=true;this.c.busSeated=true;this.c.restingBench=null;
        this.c.charPosX=this.owner.player.root.position.x;
        this.c.charPosY=this.owner.player.root.position.z*P;
        this.c.isMoving=false;this.c.facing='down';this.state='seated';
        this.update();return true;
    }
    release(){
        this.restore?.();this.restore=null;
        this.c.busSeated=false;this.c.isResting=false;this.state='standing';
    }
    stand(){
        if(!this.c.busSeated||this.c.activeSeat!==this)return true;
        const candidates=[this.exit,...[-16,16,-32,32].map(dx=>({x:this.exit.x+dx,y:this.exit.y+12}))];
        const exit=candidates.find(p=>this.c.canStand(p.x,p.y));
        if(!exit)return false;
        this.release();this.c.charPosX=exit.x;this.c.charPosY=exit.y;
        this.c.supportHeight=busStopSupportHeight(this.platform,exit.x,exit.y);
        this.owner.player.update(0);this.update();return true;
    }
    update(){
        if(this.c.busSeated&&this.c.activeSeat===this){
            const p=this.owner.player.root.position;
            if(Math.hypot(this.c.charPosX-p.x,this.c.charPosY-p.z*P)>1)this.release();
        }
        this.c.supportHeight=busStopSupportHeight(this.platform,this.c.charPosX,this.c.charPosY);
        this.button.hidden=!this.enabled()||!this.near();
        setInteractionGuidance(this.button, 'E', this.c.busSeated ? '일어나기' : '정류장 의자에 앉기');
    }
}
