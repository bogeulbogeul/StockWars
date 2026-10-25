import test from 'node:test';
import assert from 'node:assert/strict';
import { BusStopSeat } from '../js/components/town3d/BusStopSeat.js';
import { registerSeatController, routeSeatKey } from '../js/components/town3d/SeatControls.js';

function environment(run) {
    const oldWindow=globalThis.window,oldDocument=globalThis.document;
    const app={started:true,busy:false,arrival:{active:false},scenes:{tourActive:false}};
    const flags={modal:false,phone:false,hidden:false};
    globalThis.window={stockWarsExhibition:app};
    globalThis.document={body:{classList:{contains:name=>name==='town-model-mode'||(name==='phone-view-active'&&flags.phone)}},querySelector:()=>flags.modal?{}:null};
    const seat={c:{scriptedWalking:false},owner:{town:{containerEl:{classList:{contains:()=>flags.hidden}}}}};
    try { run({app,flags,seat}); } finally { globalThis.window=oldWindow;globalThis.document=oldDocument; }
}
test('bus seating remains enabled after the arrival encounter ends',()=>environment(({app,seat})=>{
    assert.equal(BusStopSeat.prototype.enabled.call(seat),true);
    app.arrival.active=true;assert.equal(BusStopSeat.prototype.enabled.call(seat),true);
}));
test('busy, tour, scripted movement, hidden scenes and UI still block bus seating',()=>environment(({app,flags,seat})=>{
    app.busy=true;assert.equal(BusStopSeat.prototype.enabled.call(seat),false);app.busy=false;
    app.scenes.tourActive=true;assert.equal(BusStopSeat.prototype.enabled.call(seat),false);app.scenes.tourActive=false;
    seat.c.scriptedWalking=true;assert.equal(BusStopSeat.prototype.enabled.call(seat),false);seat.c.scriptedWalking=false;
    for(const key of ['modal','phone','hidden']){flags[key]=true;assert.equal(BusStopSeat.prototype.enabled.call(seat),false,key);flags[key]=false;}
}));
test('the common capture router forwards bus E once and ignores held-key toggles',()=>{
    let toggles=0;
    const seat={c:{busSeated:false},enabled:()=>true,near:()=>true,toggle:()=>toggles++};
    seat.handleKeyDown=event=>BusStopSeat.prototype.handleKeyDown.call(seat,event);
    const unregister=registerSeatController(seat);
    const event={code:'KeyE',repeat:false,preventDefault(){},stopImmediatePropagation(){}};
    try { assert.equal(routeSeatKey(event),true);assert.equal(toggles,1);event.repeat=true;routeSeatKey(event);assert.equal(toggles,1); }
    finally { unregister(); }
});
