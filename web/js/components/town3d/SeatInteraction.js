import {GROUND_PROJECTION as P} from '../../data/townModelBuildings.js';
import {PLAYER_BODY_RADIUS as R,charactersCanStand} from './CharacterBodies.js';
import {SOMANGI_MOVEMENT} from '../../data/somangiMovement.js';
import {moveTownBody} from './TownBodyMovement.js';
import {applySeatPose} from './SeatPose.js';
import {SeatControls,seatKeyAvailable,seatUiBlocked} from './SeatControls.js';
export {routeSeatKey} from './SeatControls.js';

export class SeatInteraction{
    constructor(owner,seats){
        this.owner=owner;this.seats=seats;this.c=owner.controller||owner.town.playerController;
        this.controls=new SeatControls(this,owner);this.button=this.controls.button;
    }
    handleKeyDown(e){
        if(!this.seats.length||!this.enabled()||!seatKeyAvailable(e))return false;
        if(e.code==='KeyE'&&this.nearest()){
            e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.toggle();return true;
        }
        if(/^Key[WASD]$/.test(e.code)){
            if(this.selected&&!this.stand()){e.preventDefault();e.stopImmediatePropagation();return true;}
            if(window.stockWarsExhibition){
                this.c.keysHeld.add(e.code.slice(3).toLowerCase());e.preventDefault();e.stopImmediatePropagation();return true;
            }
        }
        return false;
    }
    visible(){return this.owner.town?!this.owner.town.containerEl.classList.contains('hidden'):this.owner.active;}
    enabled(){
        const app=window.stockWarsExhibition;
        const informationEntry = app?.scenes?.informationAwaitingTalk && this.owner === app.scenes.rooms.get('information');
        return this.visible()&&!this.c.scriptedWalking&&(!app?.busy || informationEntry)
            &&(app?app.started:!this.owner.town?.callbacks?.isInputBlocked?.())
            &&!seatUiBlocked()
            &&(!this.owner.blocked||!this.owner.blocked())
            &&!(this.owner.town&&app?.arrival.active);
    }
    occupied(seat){
        const f=seat.forward,x=seat.center.x+f.x*seat.forwardOffset,z=seat.center.z+f.z*seat.forwardOffset;
        return !charactersCanStand(this.owner.characterBodies||[],x,z);
    }
    exits(seat){
        const f=seat.forward,b=seat.bounds;
        const depth=Math.abs(f.x)*(b.max.x-b.min.x)+Math.abs(f.z)*(b.max.z-b.min.z);
        const width=Math.abs(f.z)*(b.max.x-b.min.x)+Math.abs(f.x)*(b.max.z-b.min.z);
        const candidates=[];
        const point=(front,side)=>({x:seat.center.x+f.x*front+f.z*side,y:(seat.center.z+f.z*front-f.x*side)*P});
        for(const side of [0,-16,16,-32,32])candidates.push(point(depth/2+R+10,side));
        for(const extra of [0,12,24])for(const sign of [-1,1])candidates.push(point(0,sign*(width/2+R+10+extra)));
        candidates.push(point(-depth/2-R-10,0));
        for(const side of [-48,48,-64,64,-80,80,-96,96,-128,128,-160,160])for(const extra of [12,24,48,72]){
            const d=depth/2+R+10+extra;
            candidates.push(point(d,side));
        }
        const result=[];for(const p of candidates){if(this.c.canStand(p.x,p.y))result.push(p);if(result.length===6)break;}
        return result;
    }
    nearest(){
        if(this.selected)return this.selected;
        if(this.c.busSeated)return null;
        if(this.owner.town&&this.owner.busSeat?.enabled()&&this.owner.busSeat.near())return null;
        const range=this.owner.town?245:145;
        return this.seats.filter(s=>Math.hypot(this.c.charPosX-s.center.x,this.c.charPosY/P-s.center.z)<=range
            &&!this.occupied(s)&&this.exits(s).length)
            .sort((a,b)=>Math.hypot(this.c.charPosX-a.center.x,this.c.charPosY/P-a.center.z)
                -Math.hypot(this.c.charPosX-b.center.x,this.c.charPosY/P-b.center.z))[0];
    }
    toggle(){if(!this.enabled())return false;return this.selected?this.stand():this.sit(this.nearest());}
    sit(seat){
        if(!seat||this.c.busSeated||this.owner.player.jump.active||this.occupied(seat))return false;
        const exit=this.exits(seat)[0];if(!exit)return false;
        const restore=applySeatPose(this.owner.player,seat);if(!restore)return false;
        this.restore=restore;this.selected=seat;this.exit=exit;this.c.activeSeat=this;
        this.c.busSeated=true;this.c.isResting=true;this.c.restingBench=null;this.c.keysHeld.clear();
        this.c.isMoving=false;
        this.c.charPosX=this.owner.player.root.position.x;this.c.charPosY=this.owner.player.root.position.z*P;
        this.update();return true;
    }
    release(){this.restore?.();this.restore=null;this.selected=null;this.c.busSeated=false;this.c.isResting=false;}
    stand(){
        if(!this.selected)return true;
        const exit=[this.exit,...this.exits(this.selected)].find(p=>this.c.canStand(p.x,p.y));if(!exit)return false;
        this.release();this.c.charPosX=exit.x;this.c.charPosY=exit.y;this.c.keysHeld.clear();
        this.owner.player.update(0);this.update();return true;
    }
    reset(){if(this.selected)this.release();this.controls.hide();}
    update(dt=0){
        if(!this.visible()){this.reset();return false;}
        if(this.selected){
            const p=this.owner.player.root.position;
            if(Math.hypot(this.c.charPosX-p.x,this.c.charPosY-p.z*P)>1)this.release();
        }
        if(this.enabled()&&this.owner.town&&window.stockWarsExhibition&&!this.selected){
            const dx=Number(this.c.keysHeld.has('d'))-Number(this.c.keysHeld.has('a'));
            const dy=Number(this.c.keysHeld.has('s'))-Number(this.c.keysHeld.has('w'));
            if(dx||dy){
                const step=SOMANGI_MOVEMENT.townWalk*Math.min(dt,.05)/Math.hypot(dx,dy);
                moveTownBody(this.c,dx*step,dy*step);
                this.c.facing=dy<0?'up':dy>0?'down':dx<0?'left':'right';
            }
        }
        this.controls.show(this.enabled(),this.nearest(),this.selected);
        return !!this.selected;
    }
}
