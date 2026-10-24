import { settingsStore } from '../../engine/SettingsStore.js';

// Synthesized tool sounds: no downloads, shared timers or persistent audio loop.
export function startSalonMakeoverAudio({ reduced = false } = {}) {
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext||settingsStore.value.effectsVolume===0)return ()=>{};
    let context;
    try {context=new AudioContext();}catch {return ()=>{};}
    const master=context.createGain();master.gain.value=settingsStore.value.effectsVolume/100*.45;
    master.connect(context.destination);
    const syncVolume=()=>master.gain.setTargetAtTime(settingsStore.value.effectsVolume/100*.45,context.currentTime,.015);
    window.addEventListener('stockwars-settings-changed',syncVolume);
    const sources=[];
    const noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
    const samples=noise.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    const start=context.currentTime+.025;
    const envelope=(at,duration,volume)=>{
        const gain=context.createGain();gain.connect(master);
        gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.015);
        gain.gain.setValueAtTime(volume,at+duration*.65);gain.gain.linearRampToValueAtTime(0,at+duration);
        return gain;
    };
    const hiss=(at,duration,frequency,type,volume)=>{
        const source=context.createBufferSource();source.buffer=noise;
        const filter=context.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;
        source.connect(filter);filter.connect(envelope(at,duration,volume));
        source.start(at);source.stop(at+duration);sources.push(source);
    };
    const tone=(at,duration,frequency,volume)=>{
        const oscillator=context.createOscillator();oscillator.type='sine';oscillator.frequency.value=frequency;
        oscillator.connect(envelope(at,duration,volume));oscillator.start(at);oscillator.stop(at+duration);sources.push(oscillator);
    };
    const snip=(at,variation)=>{
        // A continuous blade shear that closes into a tiny contact click.
        // Avoid the loud, flat high-pass burst that sounded like shaken beads.
        const source=context.createBufferSource();source.buffer=noise;
        const band=context.createBiquadFilter();band.type='bandpass';band.Q.value=.85;
        band.frequency.setValueAtTime(1800+variation*90,at);
        band.frequency.exponentialRampToValueAtTime(3600+variation*100,at+.052);
        const low=context.createBiquadFilter();low.type='lowpass';low.frequency.value=5200;
        const gain=context.createGain();
        gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.20,at+.009);
        gain.gain.linearRampToValueAtTime(.34,at+.035);
        gain.gain.exponentialRampToValueAtTime(.001,at+.068);
        source.connect(band);band.connect(low);low.connect(gain);gain.connect(master);
        source.start(at,.12+variation*.09);source.stop(at+.075);sources.push(source);
        const click=context.createOscillator();click.type='sine';
        click.frequency.setValueAtTime(3400+variation*70,at+.038);
        click.frequency.exponentialRampToValueAtTime(1500,at+.048);
        const contact=context.createGain();contact.connect(master);click.connect(contact);
        contact.gain.setValueAtTime(0,at+.038);
        contact.gain.linearRampToValueAtTime(.15,at+.039);
        contact.gain.exponentialRampToValueAtTime(.001,at+.052);
        click.start(at+.038);click.stop(at+.055);sources.push(click);
    };
    if(reduced) {
        tone(start,.25,660,.22);tone(start+.1,.3,880,.16);
    } else {
        [.15,.39,.63,.87].forEach((offset,i)=>snip(start+offset,i%3));
        hiss(start+1.1,.95,1800,'lowpass',.45);
        tone(start+1.1,.95,125,.12);
        tone(start+1.9,.23,880,.2);tone(start+2.02,.23,1174.66,.15);
    }
    context.resume().catch(()=>{});
    let stopped=false;
    return ()=>{
        if(stopped)return;stopped=true;
        window.removeEventListener('stockwars-settings-changed',syncVolume);
        for(const source of sources){try {source.stop();}catch { /* Already ended. */ }}
        master.disconnect();context.close().catch(()=>{});
    };
}
