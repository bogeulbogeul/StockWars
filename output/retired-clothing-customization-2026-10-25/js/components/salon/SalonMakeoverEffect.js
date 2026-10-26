import { startSalonMakeoverAudio } from './SalonMakeoverAudio.js';
import { settingsStore } from '../../engine/SettingsStore.js';

const files=['scissors-open.png','scissors-closed.png','dryer-a.png','dryer-b.png'];
// Closed poses coincide with the four snips; dryer starts with the motor at 1.1s.
const sequence=[[0,0],[150,1],[270,0],[390,1],[510,0],[630,1],[750,0],[870,1],
    [1100,2],[1240,3],[1380,2],[1520,3],[1660,2],[1800,3],[1940,2],[2080,3]];
let loading;
function loadFrames() {
    return loading ||= Promise.all(files.map(file=>{
        const image=new Image();image.src=new URL(`../../../assets/effects/salon-makeover-v1/${file}`,import.meta.url).href;
        return image.decode().then(()=>image);
    })).catch(error=>{loading=null;throw error;});
}
// Complete generated PNG poses, like the drink effect; no SVG tool animation.
// Does not charge gold, grant ownership or equip a skin.
export async function playSalonMakeoverEffect(parent,{preview=false}={}) {
    if(parent.querySelector('.salon-makeover-effect'))return false;
    const effect=document.createElement('dialog');effect.className='salon-makeover-effect';
    effect.setAttribute('aria-label',preview?'변신 연출 미리보기':'스타일 변신 연출');
    effect.innerHTML='<div class="salon-makeover-stage"><img class="salon-makeover-frame" alt="가위와 헤어드라이기 변신 연출"></div><p role="status">에셋을 불러오고 있어요.</p><button type="button">건너뛰기</button>';
    parent.append(effect);
    return new Promise(resolve=>{
        let finished=false,stopAudio=()=>{},timer,animation;
        const finish=(result=true)=>{
            if(finished)return;finished=true;clearTimeout(timer);cancelAnimationFrame(animation);
            stopAudio();effect.remove();resolve(result);
        };
        effect.querySelector('button').onclick=()=>finish();
        effect.addEventListener('cancel',event=>{event.preventDefault();finish();});
        effect.addEventListener('keydown',event=>event.stopPropagation());
        effect.showModal();
        loadFrames().then(frames=>{
            if(finished||!effect.isConnected)return;
            const reduced=settingsStore.value.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const image=effect.querySelector('img');
            effect.querySelector('p').textContent=preview?'변신 연출 미리보기':'새로운 스타일을 준비하고 있어요';
            const show=index=>{
                image.src=frames[index].src;image.dataset.frame=String(index);
                // Align the generated closed-pose pivot to the open-pose pivot.
                image.style.transform=index===1?'translate(-3.1%, -2%)':'';
                image.alt=index<2?'가위로 스타일을 다듬고 있어요':'헤어드라이기로 마무리하고 있어요';
            };
            show(reduced?2:0);stopAudio=startSalonMakeoverAudio({reduced});
            if(!reduced){
                const start=performance.now();let last=0;
                const tick=now=>{
                    if(finished)return;
                    const elapsed=now-start;
                    let entry=0;for(let i=1;i<sequence.length&&sequence[i][0]<=elapsed;i++)entry=i;
                    if(entry!==last){show(sequence[entry][1]);last=entry;}
                    animation=requestAnimationFrame(tick);
                };
                animation=requestAnimationFrame(tick);
            }
            timer=setTimeout(()=>finish(),reduced?700:2300);
        }).catch(()=>{
            if(finished)return;
            effect.querySelector('p').textContent='연출 에셋을 불러오지 못했어요.';
            timer=setTimeout(()=>finish(false),1200);
        });
    });
}
