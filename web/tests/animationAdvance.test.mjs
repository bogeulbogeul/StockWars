import test from 'node:test';
import assert from 'node:assert/strict';
import { animate } from '../js/app/exhibition/HandoffMotion.js';

function clock(t) {
    const prior = { requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame, document: globalThis.document };
    const frames = new Map(); let id = 0;
    globalThis.document = { hidden: false };
    globalThis.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
    globalThis.cancelAnimationFrame = key => frames.delete(key);
    t.after(() => { for (const [key,value] of Object.entries(prior)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
    return frames;
}
test('animation advance reaches its endpoint once and cancels the pending frame', async t => {
    const frames=clock(t), controller=new AbortController(), values=[];
    const promise=animate(10,value=>values.push(value),controller.signal);
    const stale=[...frames.values()][0];controller.abort();controller.abort();await promise;stale(100);
    assert.deepEqual(values,[1]);assert.equal(frames.size,0);
});
test('subsequent phases finish immediately after the same scene advance', async t => {
    const frames=clock(t), controller=new AbortController();controller.abort();let final=0;
    await animate(10,value=>final=value,controller.signal);assert.equal(final,1);assert.equal(frames.size,0);
});
test('normal animation keeps its clock and update errors reject with cleanup', async t => {
    const frames=clock(t);let final=0;const promise=animate(.1,value=>final=value);
    for(const time of [0,50,100]){const [key,tick]=[...frames.entries()][0];frames.delete(key);tick(time);}await promise;
    assert.equal(final,1);assert.equal(frames.size,0);
    const failure=animate(1,()=>{throw Error('bad pose');});const [key,tick]=[...frames.entries()][0];frames.delete(key);tick(0);
    await assert.rejects(failure,/bad pose/);assert.equal(frames.size,0);
});
