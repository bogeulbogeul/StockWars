import * as THREE from '../../../vendor/three/three.module.js';
import { addCipherIndexBoardFrame } from './CipherIndexBoardFrame.js';
import { SIMULATION_ROOM } from '../../data/cipherSimulationRoom.js';

// Display supplied season records only; do not substitute general/individual-match rankings.
export class CipherSeasonRankingBoard {
    constructor(room){
        room.userData.boardFrameReady=addCipherIndexBoardFrame(room);
        this.canvas=document.createElement('canvas');this.canvas.width=1760;this.canvas.height=640;
        this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(440,160),
            new THREE.MeshBasicMaterial({map:this.texture,toneMapped:false}));
        mesh.name='season-ranking-screen';mesh.position.set(0,190,-SIMULATION_ROOM.depth/2+21);
        room.add(mesh);
        this.setData(null);
    }

    setData(snapshot){
        this.snapshot=snapshot;
        this.entries=(Array.isArray(snapshot?.entries)?snapshot.entries:[])
            .filter(row=>Number.isInteger(row.rank)&&row.rank>0&&typeof row.nickname==='string'
                && Number.isFinite(row.cumulativeReturnPct))
            .slice().sort((a,b)=>a.rank-b.rank).slice(0,5);
        this.draw();
    }

    draw(){
        const ctx=this.canvas.getContext('2d');
        ctx.fillStyle='#122d3f';ctx.fillRect(0,0,1760,640);
        ctx.textBaseline='middle';ctx.textAlign='left';
        ctx.font='bold 54px sans-serif';ctx.fillStyle='#f3ead9';ctx.fillText('시즌 랭킹',54,66);
        ctx.font='25px sans-serif';ctx.fillStyle='#87c5d0';ctx.textAlign='right';
        ctx.fillText(String(this.snapshot?.seasonName || '모의투자').slice(0,32),1705,66);
        ctx.fillStyle='#213f52';ctx.fillRect(46,116,1668,62);
        ctx.font='bold 27px sans-serif';ctx.fillStyle='#b9ced9';ctx.textAlign='left';
        ctx.fillText('순위',80,148);ctx.fillText('참가자',300,148);
        ctx.textAlign='right';ctx.fillText('시즌 누적 수익률',1660,148);
        if(!this.entries.length){
            ctx.textAlign='center';ctx.font='bold 37px sans-serif';ctx.fillStyle='#d6e3e9';
            ctx.fillText('집계된 시즌 기록이 없습니다',880,345);
            ctx.font='27px sans-serif';ctx.fillStyle='#8ba8b9';
            ctx.fillText('시즌 누적 수익률 집계 준비 중',880,404);
        }else{
            for(const [i,row] of this.entries.entries()){
                const y=218+i*65;
                ctx.fillStyle=i%2?'#153246':'#19384c';ctx.fillRect(46,y-29,1668,59);
                ctx.textAlign='left';ctx.font='bold 33px sans-serif';ctx.fillStyle=['#e4c783','#c1d6e0','#ce9e7d'][i]||'#d9e5ec';
                ctx.fillText(String(row.rank),92,y);
                ctx.fillStyle='#e5edf0';ctx.font='31px sans-serif';ctx.fillText(row.nickname.slice(0,18),300,y);
                ctx.textAlign='right';ctx.fillStyle=row.cumulativeReturnPct>=0?'#ef9189':'#91bde6';
                ctx.fillText(`${row.cumulativeReturnPct>0?'+':''}${row.cumulativeReturnPct.toFixed(2)}%`,1660,y);
            }
        }
        ctx.textAlign='center';ctx.font='22px sans-serif';ctx.fillStyle='#88a4b5';
        ctx.fillText(this.entries.length?'모의투자 시즌 기록':'온라인 시즌 랭킹',880,601);
        this.texture.needsUpdate=true;
    }
}
