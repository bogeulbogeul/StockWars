// All ground-plane geometry shares this projection, including debug lines.
export const CIPHER_GRID = { size: 16, x: 783, y: 284, dx: 44, dy: 22 };
const p = (u,v,z=0) => `${783+44*(u-v)},${284+22*(u+v)-z}`;
const poly = (points,fill,stroke='#163453') => `<polygon points="${points.map(a=>p(...a)).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
const plane = (u,v,w,h,z,fill) => poly([[u,v,z],[u+w,v,z],[u+w,v+h,z],[u,v+h,z]],fill);
function wallPanel(axis,start,end,low,high,fill) {
    const a = axis==='u' ? [start,0] : [0,start];
    const b = axis==='u' ? [end,0] : [0,end];
    return poly([[...a,low],[...b,low],[...b,high],[...a,high]],fill);
}
function box(u,v,w,h,height) {
    return poly([[u,v],[u+w,v],[u+w,v,height],[u,v,height]],'#123763')
        +poly([[u,v],[u,v+h],[u,v+h,height],[u,v,height]],'#194c88')
        +plane(u,v,w,h,height,'#2c63aa');
}
export function cipherRoomArtwork() {
    let art = `<defs>
        <linearGradient id="cipher-stone" x2="0" y2="1"><stop stop-color="#fff4df"/><stop offset="1" stop-color="#ecd6ae"/></linearGradient>
        <linearGradient id="cipher-navy"><stop stop-color="#103359"/><stop offset="1" stop-color="#255a97"/></linearGradient>
        <linearGradient id="cipher-glass" x2=".8" y2="1"><stop stop-color="#a0e6fb"/><stop offset=".5" stop-color="#4faeda"/><stop offset="1" stop-color="#83d4f0"/></linearGradient>
    </defs>`;
    for(let u=0;u<16;u++) for(let v=0;v<16;v++) {
        art += poly([[u,v],[u+1,v],[u+1,v+1],[u,v+1]],(u+v)%2 ? '#eadbc0':'#fff0d6','#d5c5aa');
    }
    for(const axis of ['u','v']) {
        art += wallPanel(axis,0,16,0,238,'url(#cipher-stone)');
        for(let z=40;z<238;z+=40) {
            const a=axis==='u'?[0,0,z]:[0,0,z], b=axis==='u'?[16,0,z]:[0,16,z];
            art += `<path d="M${p(...a)} L${p(...b)}" stroke="#d9c7a9" stroke-width="1"/>`;
        }
        art += wallPanel(axis,0,16,0,12,'#153d71');
        art += wallPanel(axis,0,16,225,238,'#24589b');
        for(const at of [0,4,8,12,15.35]) {
            art += axis==='u' ? box(at,-.45,.65,.45,238) : box(-.45,at,.45,.65,238);
            art += wallPanel(axis,at+.09,at+.56,23,214,'#efcb73');
            art += wallPanel(axis,at+.14,at+.51,28,209,'url(#cipher-navy)');
        }
        art += wallPanel(axis,12.5,14.5,0,164,'#dbbd82');
        art += wallPanel(axis,12.65,14.35,0,151,'url(#cipher-navy)');
        art += wallPanel(axis,13.95,14.02,48,77,'#f6ce71');
    }
    for(const at of [5,9]) {
        art += wallPanel('v',at,at+1.35,12,200,'#143858');
        art += wallPanel('v',at+.1,at+1.25,22,190,'url(#cipher-glass)');
        art += poly([[0,at+.15,35],[0,at+.5,43],[0,at+1.2,173],[0,at+.9,165]],'#ade7f7','#ade7f7');
        for(const z of [75,130]) art += wallPanel('v',at+.1,at+1.25,z,z+2,'#245482');
    }
    // A straight flight occupies whole grid cells. Each step rises 11 px.
    for(let step=0;step<20;step++) {
        const v=6-step*.3, z=(step+1)*11;
        art += poly([[10,v,z-11],[13,v,z-11],[13,v,z],[10,v,z]],'#103257');
        art += plane(10,v-.3,3,.3,z,'#235791');
    }
    // Stone stairwell hides the upper room, as in the approved illustration.
    art += poly([[13,0],[13,6],[13,6,20],[13,0,240]],'url(#cipher-stone)');
    art += poly([[10,0,220],[13,0,220],[13,0,260],[10,0,260]],'#10263e');
    art += poly([[13,0],[13,.4],[13,.4,260],[13,0,260]],'url(#cipher-stone)');
    art += poly([[10,0,260],[13,0,260],[13,-.4,260],[10,-.4,260]],'#fff4df');
    for(const u of [10,13]) {
        art += `<polyline points="${p(u,6,3)} ${p(u,6,42)} ${p(u,.1,235)}" fill="none" stroke="#173b60" stroke-width="8" stroke-linejoin="round"/>`;
        art += `<polyline points="${p(u,6,3)} ${p(u,6,42)} ${p(u,.1,235)}" fill="none" stroke="#f5cc70" stroke-width="4" stroke-linejoin="round"/>`;
    }
    // Front entrance on the same straight boundary as the floor.
    art += poly([[16,5],[16,8],[16,8,125],[16,5,125]],'#153b67');
    art += poly([[16,5.15,8],[16,7.85,8],[16,7.85,113],[16,5.15,113]],'url(#cipher-glass)');
    for(const v of [6.35,6.65]) art += `<path d="M${p(16,v,43)} L${p(16,v,68)}" stroke="#f7cc70" stroke-width="5" stroke-linecap="round"/>`;
    art += `<path d="M${p(16,6.5,8)} L${p(16,6.5,113)}" stroke="#234875" stroke-width="3"/>`;
    return art;
}
