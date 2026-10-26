import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, PerspectiveCamera, Group } from '../vendor/three/three.module.js';
import { FrameBudget, renderRatio } from '../js/components/town3d/FrameBudget.js';
import { OcclusionReuse } from '../js/components/town3d/OcclusionReuse.js';

test('render budget bounds high-DPI buffers while preserving game viewport coordinates', () => {
    for (const [w,h,dpr] of [[1280,800,1],[1920,1080,2],[3840,2160,2],[7680,4320,2]]) {
        const ratio = renderRatio(w,h,dpr);
        assert(w*h*ratio*ratio <= 1152001);
        assert(ratio <= dpr);
        assert(renderRatio(w,h,dpr,.5) <= ratio);
    }
});
test('sustained slow frames lower only render resolution, stable frames recover gradually', () => {
    let ratio=1;const renderer={getPixelRatio:()=>ratio,setPixelRatio:value=>ratio=value};
    const budget=new FrameBudget(renderer,new Scene());budget.resize(1280,800);let now=0;
    for(let i=0;i<180;i++)budget.tick(now+=33.333);
    assert(ratio<1);const low=ratio;
    for(let i=0;i<500;i++)budget.tick(now+=1000/60);
    assert(ratio>low);assert(ratio<1);
    budget.reset();const before=ratio;budget.tick(now+=10000);assert.equal(ratio,before);
});
test('stationary occlusion reuses bounded work; camera, actor and blockers invalidate immediately', () => {
    const cache=new OcclusionReuse(),camera=new PerspectiveCamera(),actor=new Group(),wall=new Group();
    const scene=new Scene();scene.add(actor,wall,camera);camera.position.z=200;
    assert.equal(cache.shouldUpdate(camera,[actor],[wall],100),true);
    assert.equal(cache.shouldUpdate(camera,[actor],[wall],116),false);
    actor.position.x=1;assert.equal(cache.shouldUpdate(camera,[actor],[wall],120),true);
    camera.position.x=1;assert.equal(cache.shouldUpdate(camera,[actor],[wall],130),true);
    wall.visible=false;assert.equal(cache.shouldUpdate(camera,[actor],[wall],140),true);
    assert.equal(cache.shouldUpdate(camera,[actor],[wall],221),true);
    cache.invalidate();assert.equal(cache.shouldUpdate(camera,[actor],[wall],222),true);
});
