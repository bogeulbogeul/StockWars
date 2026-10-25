import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeTownWav } from '../js/engine/TownMusic.js';

function wav() {
    // Odd-size metadata chunk exercises RIFF's required pad byte.
    const bytes = new ArrayBuffer(62), v = new DataView(bytes);
    const str = (at, text) => [...text].forEach((s,i) => v.setUint8(at+i,s.charCodeAt(0)));
    str(0,'RIFF');v.setUint32(4,54,true);str(8,'WAVE');str(12,'JUNK');v.setUint32(16,1,true);
    str(22,'fmt ');v.setUint32(26,16,true);v.setUint16(30,1,true);v.setUint16(32,2,true);
    v.setUint32(34,44100,true);v.setUint32(38,176400,true);v.setUint16(42,4,true);v.setUint16(44,16,true);
    str(46,'data');v.setUint32(50,8,true);
    [-32768,32767,16384,-16384].forEach((sample,i)=>v.setInt16(54+i*2,sample,true));
    return bytes;
}
const context = { createBuffer(channels,length,rate) {
    const samples=Array.from({length:channels},()=>new Float32Array(length));
    return {sampleRate:rate,length,getChannelData:i=>samples[i]};
} };
test('PCM16 preserves stereo channel order, signed peaks, frame count, and RIFF padding',()=>{
    const buffer=decodeTownWav(context,wav());
    assert.equal(buffer.length,2);assert.equal(buffer.sampleRate,44100);
    assert.deepEqual([...buffer.getChannelData(0)],[-1,.5]);
    assert.deepEqual([...buffer.getChannelData(1)],[32767/32768,-.5]);
});
test('bad/truncated headers and unsupported codecs fail before creating audio',()=>{
    assert.throws(()=>decodeTownWav(context,new ArrayBuffer(4)),/Invalid/);
    const truncated=wav().slice(0,60);assert.throws(()=>decodeTownWav(context,truncated),/Truncated/);
    const compressed=wav();new DataView(compressed).setUint16(30,3,true);
    assert.throws(()=>decodeTownWav(context,compressed),/Unsupported/);
});
test('title PCM32kHz keeps the original sample rate and duration',()=>{
    const bytes=wav();new DataView(bytes).setUint32(34,32000,true);
    const buffer=decodeTownWav(context,bytes);
    assert.equal(buffer.sampleRate,32000);assert.equal(buffer.length,2);
});
