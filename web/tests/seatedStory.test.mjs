import test from 'node:test';
import assert from 'node:assert/strict';
import {SomangiPlayer} from '../js/components/town3d/SomangiPlayer.js';

test('dialogue facing cannot rotate a seated character into the backrest',()=>{
    const player={town:{playerController:{busSeated:true}},update(){throw Error('Seated pose must remain fixed');}};
    SomangiPlayer.prototype.faceTarget.call(player,{});
});
test('a story eating action safely stands first, while a seated jump stays blocked',()=>{
    const c={busSeated:true,activeSeat:{stand(){c.busSeated=false;return true;}}};
    const player={town:{playerController:c},state:'idle',variants:new Map([['eat',{}]]),jump:{active:false},
        food:{start(){assert.equal(c.busSeated,false);}},setExpression(){},setState(state){this.state=state;}};
    assert.equal(SomangiPlayer.prototype.play.call(player,'jump',{scripted:true}),false);
    assert.equal(c.busSeated,true);
    assert.equal(SomangiPlayer.prototype.play.call(player,'eat',{scripted:true}),true);
    assert.equal(c.busSeated,false);assert.equal(player.state,'eat');
});
