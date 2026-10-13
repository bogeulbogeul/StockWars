/* Experimental single-view rig. Coordinates are asset-local, not game world units. */
(function(scope){
const parts={
 head:{rect:[0,0,350,375],pivot:[185,345]},torso:{rect:[410,125,210,250],pivot:[105,42]},pelvis:{rect:[680,180,230,180],pivot:[110,50]},
 upper_R:{rect:[65,420,145,215],pivot:[100,45],end:[55,185]},lower_R:{rect:[395,460,140,200],pivot:[90,40],end:[65,155]},
 upper_L:{rect:[725,420,140,215],pivot:[50,45],end:[95,185]},lower_L:{rect:[1045,465,135,195],pivot:[55,40],end:[80,155]},
 thigh_R:{rect:[80,700,170,220],pivot:[100,45],end:[65,180]},calf_R:{rect:[405,710,150,215],pivot:[70,45],end:[80,180]},foot_R:{rect:[700,760,230,160],pivot:[80,55]},
 thigh_L:{rect:[80,975,170,225],pivot:[75,45],end:[100,185]},calf_L:{rect:[405,985,150,220],pivot:[70,40],end:[70,180]},foot_L:{rect:[710,1030,220,180],pivot:[70,55]}
};
const period=.95,stance=.60,stride=82,ground=355;
function ik(a,b,l1,l2){let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);d=Math.max(.001,Math.min(l1+l2-.001,d));const ux=dx/Math.hypot(dx,dy),uy=dy/Math.hypot(dx,dy),along=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-along*along));return {x:a.x+ux*along-uy*h,y:a.y+uy*along+ux*h};}
function sample(t,walking=true){const phase=((t/period)%1+1)%1,bob=walking?4*Math.cos(phase*Math.PI*4):0,root={x:0,y:bob};const neck={x:0,y:-180+bob};const pose={root,neck,legs:{},arms:{},phase};
 for(const [side,offset,hx] of [['R',0,-40],['L',.5,40]]){const u=(phase+offset)%1;let x=0,lift=0;if(walking){if(u<stance)x=stride/2-stride*u/stance;else{const q=(u-stance)/(1-stance);x=-stride/2+stride*(q*q*(3-2*q));lift=28*Math.sin(Math.PI*q);}}
 const hip={x:hx,y:50+bob},ankle={x:hx+x,y:ground-75-lift},knee=ik(hip,ankle,125,125);pose.legs[side]={hip,knee,ankle,contact:!walking||u<stance,u};
 const shoulder={x:side==='R'?-66:58,y:-153+bob},swing=walking?-x*.9:0,elbow={x:shoulder.x+swing*.55,y:shoulder.y+140},hand={x:shoulder.x+swing,y:shoulder.y+250-7*Math.abs(swing)/40};pose.arms[side]={shoulder,elbow,hand};}
 return pose;}
function svg(t,atlas,options={}){const p=sample(t,options.walking!==false),mirror=options.left?-1:1,debug=options.debug;const defs=Object.entries(parts).map(([id,a])=>{const hideCut=/^(lower|calf|thigh)_/.test(id);return `<clipPath id="c_${id}"><rect x="${-a.pivot[0]}" y="${hideCut?2:-a.pivot[1]}" width="${a.rect[2]}" height="${hideCut?a.rect[3]-a.pivot[1]-2:a.rect[3]}"/></clipPath>`;}).join('');
 const layers=[];function draw(id,j,end){const a=parts[id];let angle=0;if(end){const bind=Math.atan2(a.end[1]-a.pivot[1],a.end[0]-a.pivot[0]);angle=(Math.atan2(end.y-j.y,end.x-j.x)-bind)*180/Math.PI;}layers.push(`<g transform="translate(${j.x} ${j.y}) rotate(${angle})" clip-path="url(#c_${id})"><use href="#atlas" x="${-a.rect[0]-a.pivot[0]}" y="${-a.rect[1]-a.pivot[1]}"/></g>`);}
 function cap(j,r){layers.push(`<circle cx="${j.x}" cy="${j.y}" r="${r}" fill="#f6b593"/>`);}
 function leg(s){const l=p.legs[s];cap(l.hip,32);draw('thigh_'+s,l.hip,l.knee);cap(l.knee,30);draw('calf_'+s,l.knee,l.ankle);draw('foot_'+s,l.ankle);}
 function arm(s){const a=p.arms[s];draw('upper_'+s,a.shoulder,a.elbow);cap(a.elbow,26);draw('lower_'+s,a.elbow,a.hand);}
 arm('L');leg('L');leg('R');draw('pelvis',p.root);draw('torso',p.neck);arm('R');draw('head',p.neck);
 if(debug){for(const s of ['R','L']){const l=p.legs[s],a=p.arms[s];for(const chain of [[l.hip,l.knee,l.ankle],[a.shoulder,a.elbow,a.hand]]){layers.push(`<polyline points="${chain.map(v=>v.x+','+v.y).join(' ')}" fill="none" stroke="#00b4d8" stroke-width="3"/>`);for(const j of chain)layers.push(`<circle cx="${j.x}" cy="${j.y}" r="5" fill="#ffba08"/>`);}layers.push(`<circle cx="${l.ankle.x}" cy="${ground}" r="7" fill="${l.contact?'#247547':'#c26637'}"/>`);}}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="600" viewBox="-260 -550 520 960"><defs><image id="atlas" href="${atlas}" width="1280" height="1280"/>${defs}</defs><line x1="-250" y1="${ground}" x2="250" y2="${ground}" stroke="#bdc8bb" stroke-width="2"/><g transform="scale(${mirror} 1)">${layers.join('')}</g></svg>`;}
scope.StockWarsBoneTest={sample,svg,parts,period,stance,stride,ground};
})(typeof module==='object'?module.exports:globalThis);
