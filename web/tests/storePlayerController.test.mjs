import test from 'node:test';
import assert from 'node:assert/strict';
import { StorePlayerController, isOnStoreFloor, STORE_PLACES } from '../js/components/store/StorePlayerController.js';
const advance = (p,n=200) => { for(let i=0;i<n;i++) p.update(.05); };
test('four-direction movement and normalized diagonals', () => {
    const p = new StorePlayerController(); p.x=768;p.y=650;
    p.keys.add('d');p.keys.add('w');p.update(.05);
    assert(Math.abs(Math.hypot(p.x-768,p.y-650)-14)<.001);
    assert(p.x>768 && p.y<650);
    p.keys.add('shift');const before={x:p.x,y:p.y};p.update(.05);
    assert(Math.abs(Math.hypot(p.x-before.x,p.y-before.y)-25.2)<.001);
});
test('all directions stay inside the floor and away from wall furniture', () => {
    for(const keys of [['a'],['d'],['w'],['s'],['w','d'],['s','d'],['w','a'],['s','a']]) {
        const p=new StorePlayerController(); keys.forEach(k=>p.keys.add(k));advance(p);
        assert(isOnStoreFloor(p.x,p.y));
    }
});
test('click navigation reaches the counter and door; outside clicks clamp', () => {
    const p=new StorePlayerController();
    for(const place of [...STORE_PLACES].reverse()) {
        p.moveTo(place.x,place.y);advance(p);
        assert(Math.hypot(p.x-place.x,p.y-place.y)<.01);
        assert.equal(p.nearby().action,place.action);
        assert.equal(p.target,null);
    }
    p.moveTo(-500,-500);advance(p);assert(isOnStoreFloor(p.x,p.y));
});
test('shop proximity includes depth, not just horizontal position', () => {
    const p=new StorePlayerController();
    p.x=1150;p.y=675;assert.equal(p.nearby().action,'shop');
    p.y=850;assert.equal(p.nearby(),null);
    p.x=700;p.y=600;assert.equal(p.nearby(),null);
});
test('keyboard overrides click and pause clears all movement', () => {
    const p=new StorePlayerController();p.moveTo(1150,675);p.keys.add('d');p.update(.05);
    assert.equal(p.target,null);p.stop();const before={x:p.x,y:p.y};advance(p);
    assert.equal(p.x,before.x);assert.equal(p.y,before.y);
    p.reset();assert.equal(p.nearby().action,'exit');
});
