import { gameKey } from '../../app/GameKeys.js';
import { setInteractionGuidance } from './GuidanceCard.js';
const controllers=new Set();
export function registerSeatController(controller){
    controllers.add(controller);
    return ()=>controllers.delete(controller);
}
export function routeSeatKey(event){
    for(const controller of controllers)if(controller.handleKeyDown(event))return true;
    return false;
}
export function seatKeyAvailable(event){
    return !event.ctrlKey&&!event.altKey&&!event.metaKey
        &&!event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
}
export function seatUiBlocked(){
    return document.body.classList.contains('phone-view-active')
        ||!!document.querySelector('dialog[open],.modal-overlay:not(.hidden)');
}
export class SeatControls{
    constructor(interaction,owner){
        this.unregister=registerSeatController(interaction);
        this.button=document.createElement('button');this.button.hidden=true;
        this.button.className='bus-stop-seat-action seat-action';this.button.setAttribute('aria-keyshortcuts','E');
        (window.stockWarsExhibition?.view?.root||owner.layer).append(this.button);
        this.button.addEventListener('click',()=>interaction.toggle());
        window.addEventListener('keydown',e=>interaction.handleKeyDown(e),true);
        window.addEventListener('keyup',e=>{if(['w','a','s','d'].includes(gameKey(e)))interaction.c.keysHeld.delete(gameKey(e));},true);
        window.addEventListener('blur',()=>interaction.c.keysHeld.clear());
        window.addEventListener('stockwars-settings-changed',()=>interaction.c.keysHeld.clear());
    }
    show(enabled,seat,selected){
        this.button.hidden=!enabled||!seat;
        setInteractionGuidance(this.button, 'E', selected ? '일어나기' : `${seat?.label||'의자'}에 앉기`);
    }
    hide(){this.button.hidden=true;}
}
