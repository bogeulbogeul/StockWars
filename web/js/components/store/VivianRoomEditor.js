import { defaultRoomLayout, propRectangle, getVivianInteriorPropsHtml, vivianStaffRectangle } from './VivianInteriorScene.js';
import { screenToGrid, polygonPoints, validateLayout, createRoomNavigation, furnitureDepthAtPlayer } from './IsometricRoomGrid.js';

const STORAGE_KEY = 'stockwars.vivian-room-layout.v1';
const copy = items => items.map(item => ({...item}));
// Older saves keep their item identities. Repack only when enlarged footprints
// no longer fit; prefer the saved cells and retain access to the checkout.
export function reflowRoomLayout(items) {
    const ordered=[...items].sort((a,b)=>{
        const priority=i=>i.kind==='carpet'?1000:i.id==='counter'?900:i.kind==='wall'?-1:i.w*i.h;
        return priority(b)-priority(a);
    });
    let budget=20000;
    const placed=[];
    function place(index) {
        if (--budget<0) return false;
        if(index===ordered.length) return !validateLayout(placed);
        const item=ordered[index], cells=[];
        for(let u=0;u<=8-item.w;u++) for(let v=0;v<=8-item.h;v++) {
            if(item.kind==='carpet' && u+item.w!==8) continue;
            if(item.kind==='wall' && (item.wall==='left'?u!==0:v!==0)) continue;
            cells.push({u,v});
        }
        cells.sort((a,b)=>Math.abs(a.u-item.u)+Math.abs(a.v-item.v)-Math.abs(b.u-item.u)-Math.abs(b.v-item.v));
        for(const cell of cells) {
            const candidate={...item,...cell};
            if(placed.some(p=> {
                if((p.kind==='wall')!==(item.kind==='wall')) return false;
                if(item.kind==='wall'&&p.wall!==item.wall) return false;
                return candidate.u<p.u+p.w && candidate.u+candidate.w>p.u && candidate.v<p.v+p.h && candidate.v+candidate.h>p.v;
            })) continue;
            placed.push(candidate);
            if(place(index+1)) return true;
            placed.pop();
        }
        return false;
    }
    return place(0) ? items.map(i=>placed.find(p=>p.id===i.id)) : null;
}
export function restoreRoomLayout(raw) {
    const defaults = defaultRoomLayout();
    try {
        const data = JSON.parse(raw);
        if (![1,2,3].includes(data?.version) || !Array.isArray(data.items) || data.items.length < defaults.length || data.items.length > 128) return defaults;
        if (data.version===1 && data.items.length!==defaults.length) return defaults;
        if (new Set(data.items.map(i=>i?.id)).size !== data.items.length) return defaults;
        if(data.items.some(i=>![i.u,i.v].every(n=>Number.isInteger(n)&&n>=0&&n<8))) return defaults;
        const result = defaults.map(item => {
            const saved = data.items.find(i=>i?.id === item.id);
            if (!saved) throw new Error('Missing item');
            return {...item,u:saved.u,v:saved.v};
        });
        for (const saved of data.items.filter(i=>!defaults.some(base=>base.id===i.id))) {
            const base=defaults.find(i=>i.id===saved.assetId);
            if (!base || base.kind==='carpet' || typeof saved.id!=='string' || !new RegExp(`^${base.id}-copy-[1-9][0-9]{0,5}$`).test(saved.id)) return defaults;
            result.push({...base,id:saved.id,assetId:base.id,name:`${base.name} (복제 ${saved.id.split('-').at(-1)})`,u:saved.u,v:saved.v});
        }
        if (!validateLayout(result)) return result;
        return data.version<3 ? reflowRoomLayout(result) || defaults : defaults;
    } catch { return defaults; }
}

export function duplicateRoomItem(items, id) {
    const source=items.find(i=>i.id===id);
    if (!source || source.kind==='carpet') return {error:'출입 카펫은 하나만 사용할 수 있습니다.'};
    if (items.length>=128) return {error:'더 이상 가구를 추가할 수 없습니다.'};
    const assetId=source.assetId || source.id, base=defaultRoomLayout().find(i=>i.id===assetId);
    let number=1;
    while(items.some(i=>i.id===`${assetId}-copy-${number}`)) number++;
    const duplicate={...base,assetId,id:`${assetId}-copy-${number}`,name:`${base.name} (복제 ${number})`};
    const cells=[];
    for(let u=0;u<8;u++) for(let v=0;v<8;v++) cells.push({u,v});
    cells.sort((a,b)=>(Math.abs(a.u-source.u)+Math.abs(a.v-source.v))-(Math.abs(b.u-source.u)+Math.abs(b.v-source.v)));
    for(const cell of cells) {
        const item={...duplicate,...cell};
        if (!validateLayout([...items,item])) return {item};
    }
    return {error:'복제할 빈 공간이 없습니다. 가구나 통로를 정리해 주세요.'};
}

export function initialRoomLayout(raw, editingEnabled=false) {
    return editingEnabled ? restoreRoomLayout(raw) : defaultRoomLayout();
}

export class VivianRoomEditor {
    constructor(room, onApply, onEditing, {enabled=true} = {}) {
        this.enabled=enabled;
        this.room = room; this.onApply = onApply; this.onEditing = onEditing;
        this.active = false; this.selected = 'carpet';
        this.gridVisible = false;
        this.gridToggle = room.querySelector('#btnVivianGrid');
        this.gridToggle.addEventListener('click', () => this.setGridVisible(!this.gridVisible));
        this.status = room.querySelector('#vivianLayoutStatus');
        this.select = room.querySelector('#vivianLayoutItem');
        this.toggle = room.querySelector('#btnVivianArrange');
        this.controls = room.querySelector('#vivianLayoutControls');
        this.footprint = room.querySelector('#vivianPlacementFootprint');
        this.duplicateButton = room.querySelector('#btnVivianDuplicate');
        this.deleteButton = room.querySelector('#btnVivianDeleteCopy');
        let raw = null;
        // Local drafts belong to the authoring preview, not the released room.
        try { if(enabled) raw = localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
        this.committed = initialRoomLayout(raw, enabled); this.items = copy(this.committed);
        this.toggle.addEventListener('click', () => this.active ? this.cancel() : this.begin());
        this.select.addEventListener('change', () => this.selectItem(this.select.value));
        this.duplicateButton.addEventListener('click', () => this.duplicate());
        this.deleteButton.addEventListener('click', () => {
            const item=this.current();
            if (!item.assetId) return;
            this.items=this.items.filter(i=>i.id!==item.id); this.selected=item.assetId;
            this.paint(); this.describe('복제본을 삭제했습니다. 배치 저장을 누르면 적용됩니다.');
        });
        room.querySelector('#btnVivianLayoutSave').addEventListener('click', () => this.save());
        room.querySelector('#btnVivianLayoutCancel').addEventListener('click', () => this.cancel());
        room.querySelector('#btnVivianLayoutReset').addEventListener('click', () => {
            this.items = defaultRoomLayout(); this.footprint.classList.remove('is-invalid'); this.paint(); this.describe('기본 배치입니다. 저장하면 적용됩니다.');
        });
        room.querySelectorAll('[data-grid-move]').forEach(button => button.addEventListener('click', () => {
            const [du,dv] = button.dataset.gridMove.split(',').map(Number), item = this.current();
            this.move(item.u+du,item.v+dv);
        }));
        room.addEventListener('pointerdown', e => this.pointerDown(e));
        room.addEventListener('pointermove', e => this.pointerMove(e));
        room.addEventListener('pointerup', e => this.pointerEnd(e));
        room.addEventListener('pointercancel', () => this.abortDrag());
        room.addEventListener('lostpointercapture', () => this.abortDrag());
        this.paint(); this.apply();
        if (!enabled) {
            this.room.querySelector('.vivian-layout-toolbar').remove();
            this.footprint.parentElement.remove();
        }
    }
    current() { return this.items.find(i=>i.id === this.selected); }
    setGridVisible(visible) {
        if (!this.enabled) return;
        this.gridVisible = Boolean(visible);
        this.room.classList.toggle('is-grid-visible', this.gridVisible);
        this.gridToggle.setAttribute('aria-pressed', String(this.gridVisible));
        this.gridToggle.textContent = this.gridVisible ? '그리드 숨기기' : '그리드 보기';
    }
    describe(message) {
        const i=this.current();
        this.status.textContent = message || `${i.name} · ${i.w}×${i.h}칸 · (${i.u+1}, ${i.v+1})${i.id==='counter' ? ' · 뒤쪽 한 줄은 비비안 자리' : ''}`;
    }
    selectItem(id) {
        this.selected = id; this.select.value = id; this.footprint.classList.remove('is-invalid'); this.paint(); this.describe();
    }
    begin() {
        if (!this.enabled) return;
        this.items = copy(this.committed); this.active = true;
        this.room.classList.add('is-arranging'); this.controls.hidden = false;
        this.gridToggle.disabled = true;
        this.toggle.setAttribute('aria-expanded','true'); this.toggle.textContent = '편집 취소';
        this.onEditing(true); this.paint(); this.describe(); this.select.focus();
    }
    finish() {
        this.abortDrag(); this.active = false; this.room.classList.remove('is-arranging');
        this.controls.hidden = true; this.toggle.setAttribute('aria-expanded','false');
        this.gridToggle.disabled = false;
        this.toggle.textContent = '가구 편집'; this.onEditing(false); this.paint(); this.toggle.focus();
    }
    cancel() { if (!this.active) return; this.abortDrag(); this.items = copy(this.committed); this.finish(); }
    duplicate() {
        if (!this.active) return;
        this.abortDrag();
        const result=duplicateRoomItem(this.items,this.selected);
        if(result.error) { this.describe(result.error); return; }
        this.items.push(result.item); this.selected=result.item.id;
        this.paint(); this.describe('가까운 빈 칸에 복제했습니다. 위치를 조정한 뒤 배치 저장을 누르세요.');
    }
    save() {
        if (this.drag) this.abortDrag();
        const error = validateLayout(this.items);
        if (error) { this.describe(error); return; }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({version:3,items:this.items.map(({id,assetId,u,v})=>({id,assetId,u,v}))}));
        } catch { this.describe('브라우저에 저장할 수 없습니다. 저장 공간 설정을 확인하거나 취소하세요.'); return; }
        this.committed = copy(this.items); this.apply(); this.finish();
    }
    apply() { this.onApply(createRoomNavigation(this.items)); }
    updatePlayerDepth(x,y) {
        if(this.active) return;
        for(const item of this.items) {
            if(item.kind!=='floor') continue;
            const element=this.room.querySelector(`[data-room-item="${item.id}"]`);
            if(element) element.style.zIndex=Math.round(furnitureDepthAtPlayer(item,x,y));
        }
    }
    paint() {
        if (!this.current()) this.selected='carpet';
        const ids=new Set(this.items.map(i=>i.id));
        this.room.querySelectorAll('[data-room-item]').forEach(svg=>{
            if(!ids.has(svg.dataset.roomItem)) svg.remove();
        });
        for(const item of this.items) {
            if(!this.room.querySelector(`[data-room-item="${item.id}"]`))
                this.footprint.parentElement.insertAdjacentHTML('beforebegin',getVivianInteriorPropsHtml([item]));
        }
        if([...this.select.options].map(o=>o.value).join('|')!==this.items.map(i=>i.id).join('|')) {
            this.select.replaceChildren(...this.items.map(item=>{
                const option=this.room.ownerDocument.createElement('option');
                option.value=item.id; option.textContent=item.name; return option;
            }));
        }
        this.select.value=this.selected;
        this.duplicateButton.disabled=this.current().kind==='carpet';
        this.duplicateButton.title=this.duplicateButton.disabled ? '출입 카펫은 하나만 사용할 수 있습니다.' : '선택한 가구를 가까운 빈 칸에 복제';
        this.deleteButton.hidden=!this.current().assetId;
        for (const item of this.items) {
            const svg = this.room.querySelector(`[data-room-item="${item.id}"]`), rect = propRectangle(item);
            svg.style.left = `${rect.x/1536*100}%`; svg.style.top = `${rect.y/1024*100}%`;
            svg.style.width = `${rect.width/1536*100}%`; svg.style.height = `${rect.height/1024*100}%`;
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.style.zIndex = item.kind==='carpet' ? 0 : item.kind==='wall' ? 1 : Math.round(100+rect.groundY);
            svg.classList.toggle('is-selected',this.active && this.selected===item.id);
            const hotspot = item.id==='carpet' ? this.room.querySelector('#btnVivianDoor') : item.id==='counter' ? this.room.querySelector('.vivian-counter-hotspot') : null;
            if (hotspot) {
                for (const key of ['left','top','width','height']) hotspot.style[key]=svg.style[key];
            }
        }
        const i=this.current(); this.footprint.setAttribute('points',polygonPoints(i.u,i.v,i.w,i.h));
        const staff=this.room.querySelector('.vivian-room-staff');
        if (staff) {
            const r=vivianStaffRectangle(this.items);
            staff.style.left=`${r.x/1536*100}%`;
            staff.style.top=`${r.y/1024*100}%`;
            staff.style.zIndex=r.zIndex;
        }
    }
    move(u,v) {
        const item = this.current();
        if (item.kind==='wall') { if(item.wall==='left') u=0; else v=0; }
        const candidate = this.items.map(i=>i.id===item.id ? {...i,u,v} : i);
        const error=validateLayout(candidate);
        this.footprint.classList.toggle('is-invalid',Boolean(error));
        if (error) { this.describe(error); return; }
        this.items=candidate; this.paint(); this.describe();
    }
    pointerPoint(e) {
        const rect=this.room.getBoundingClientRect();
        return screenToGrid((e.clientX-rect.left)/rect.width*1536,(e.clientY-rect.top)/rect.height*1024);
    }
    pointerDown(e) {
        if (!this.active || e.button!==0 || this.drag) return;
        const svg=e.target.closest('[data-room-item]'); if(!svg) return;
        e.preventDefault(); this.selectItem(svg.dataset.roomItem);
        this.drag={id:e.pointerId,start:this.pointerPoint(e),original:{...this.current()},snapshot:copy(this.items)};
        this.room.setPointerCapture(e.pointerId);
    }
    pointerMove(e) {
        if (!this.drag || this.drag.id!==e.pointerId) return;
        const at=this.pointerPoint(e), d=this.drag;
        this.move(d.original.u+Math.round(at.u-d.start.u),d.original.v+Math.round(at.v-d.start.v));
    }
    pointerEnd(e) {
        if (!this.drag || this.drag.id!==e.pointerId) return;
        this.drag=null;
        if(this.room.hasPointerCapture(e.pointerId)) this.room.releasePointerCapture(e.pointerId);
    }
    abortDrag() {
        if(!this.drag) return;
        const id=this.drag.id; this.items=this.drag.snapshot; this.drag=null;
        if(this.room.hasPointerCapture(id)) this.room.releasePointerCapture(id);
        this.paint();
    }
}

