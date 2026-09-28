import { gridToScreen, polygonPoints } from './IsometricRoomGrid.js';
import { projectSprite } from './VivianSpriteGeometry.js';
import { getVivianClockHandsHtml } from './VivianClock.js';
const directory = '../../../assets/interiors/vivian-grid-v2/';
export const VIVIAN_ROOM_URL = new URL(directory+'room.png', import.meta.url).href;
// Footprint is separate from upright artwork. Full source canvases preserve edges.
export const SPRITES = {
    carpet: {crop:[0,0,255,123], size:[255,123], anchor:[.5,.5],
        transform:'matrix(0.2065359477124183 0.01134238310708899 0.044444444444444446 0.19282051282051282 -29.918300653594763 -68.51206636500754)'},
};
// Regenerated furniture uses measured PNG geometry; no silhouette cropping.
const regenerated = {"fridge":{"bounds":[362,87,895,1178],"peak":646,"slopes":[0.6,-0.6],"width":145},"counter":{"bounds":[95,171,1204,1141],"peak":353,"slopes":[0.575,-0.5],"width":230},"goods":{"bounds":[146,95,1141,1194],"peak":393,"slopes":[0.6,-0.475],"width":230},"papers":{"bounds":[131,150,1095,1141],"peak":845,"slopes":[0.625,-0.65],"width":230},"baskets":{"bounds":[267,117,988,1142],"peak":626,"slopes":[0.7,-0.525],"width":100},"wallShelf":{"bounds":[123,167,1151,1155],"peak":969,"slopes":[0.625,-0.525],"width":172,"wallAnchor":[637,760]}};
for (const [id, geometry] of Object.entries(regenerated)) {
    SPRITES[id] = {...projectSprite(geometry), directory:'../../../assets/interiors/vivian-grid-v3/'};
}
for (const id of ['fridge','goods','papers','counter','wallShelf']) {
    SPRITES[id].directory='../../../assets/interiors/vivian-grid-v4/';
}
// v8 edits the lower plinth of the original enclosed cabinet.
// Full square canvas and equal display dimensions: no shear or vertical compression.
SPRITES.goods={source:[1254,1254],crop:[0,0,1254,1254],size:[285,285],
    anchor:[635/1254,945/1254],matrix:[1,0,0,1,0,0],
    directory:'../../../assets/interiors/vivian-grid-v8/'};
// Keep the round decorations intact, including all transparent padding.
SPRITES.plant = {source:[1254,1254],crop:[0,0,1254,1254],size:[142,142],anchor:[.49,.875]};
SPRITES.clock = {source:[1254,1254],crop:[0,0,1254,1254],size:[112,112],anchor:[.51,.49],
    directory:'../../../assets/interiors/vivian-clock-animated/'};
// Carpet transform was calibrated in a normalized 1280 canvas intentionally.
SPRITES.carpet.source = [1280,1280];
export function getVivianStaffSpace(items = defaultRoomLayout()) {
    const c = items.find(item => item.id === 'counter');
    return {anchor:gridToScreen(c.u+.5,c.v+1), points:polygonPoints(c.u,c.v,1,2)};
}
export function vivianStaffRectangle(items = defaultRoomLayout()) {
    const c=items.find(item=>item.id==='counter');
    // Stand at the front of the reserved staff row, close to the worktop.
    const anchor=gridToScreen(c.u+.95,c.v+1);
    // Square source canvas, measured foot midpoint; uniform scaling only.
    const size = 200;
    return {x:anchor.x-size*.53, y:anchor.y-size*.945, width:size, height:size,
        groundY:anchor.y, zIndex:Math.round(100+anchor.y)};
}
export function getVivianStaffHtml() {
    const r=vivianStaffRectangle();
    const url=new URL('../../../assets/characters/vivian/vivian-chibi-isometric-v2.png',import.meta.url).href;
    return `<img class="vivian-room-staff" src="${url}" alt="계산대 뒤의 비비안" draggable="false"
        style="left:${r.x/1536*100}%;top:${r.y/1024*100}%;width:${r.width/1536*100}%;height:${r.height/1024*100}%;z-index:${r.zIndex}">`;
}
export function defaultRoomLayout() { return placements.map(p => ({...p})); }
export function propRectangle(item) {
    const sprite=SPRITES[item.assetId || item.id], [width,height]=sprite.size;
    let anchor=gridToScreen(item.u+item.w/2,item.v+item.h/2);
    if((item.assetId || item.id)==='counter') anchor=gridToScreen(item.u+1.5,item.v+1);
    if(item.kind==='wall') {
        anchor=item.wall==='left' ? gridToScreen(0,item.v+item.h/2) : gridToScreen(item.u+item.w/2,0);
        anchor.y-=155;
    }
    return {x:anchor.x-width*sprite.anchor[0],y:anchor.y-height*sprite.anchor[1],width,height,groundY:anchor.y};
}
export function getVivianRoomHtml() {
    // Register the generated shell to the logical floor corners. Exact runtime
    // tiles prevent generated seams/counts drifting away from collision cells.
    let tiles='';
    for(let u=0;u<8;u++) for(let v=0;v<8;v++)
        tiles+=`<polygon points="${polygonPoints(u,v)}" fill="${(u+v)%2?'#e9d8b7':'#fff3d9'}" stroke="#b6a58b" stroke-width="1.5"/>`;
    return `<svg class="vivian-interior-art" viewBox="0 0 1536 1024" role="img" aria-label="창문과 문 없는 아이소메트릭 잡화점, 8×8 타일 바닥">
        <image href="${VIVIAN_ROOM_URL}" width="1536" height="1024" transform="matrix(1.018 0 0 .994 -13.824 21.95)"/>
        ${tiles}</svg>`;
}
export function getVivianInteriorPropsHtml(items = placements) {
    return items.map(item=>{
        const assetId=item.assetId || item.id;
        const sprite=SPRITES[assetId], [sw,sh]=sprite.source || [1280,1280], r=propRectangle(item);
        const url=new URL((sprite.directory || directory)+assetId+'.png',import.meta.url).href;
        return `<svg class="vivian-room-prop" data-room-item="${item.id}" aria-hidden="true" focusable="false" viewBox="${sprite.crop.join(' ')}" preserveAspectRatio="none"
          style="left:${r.x/1536*100}%;top:${r.y/1024*100}%;width:${r.width/1536*100}%;height:${r.height/1024*100}%">
          <image href="${url}" width="${sw}" height="${sh}" ${sprite.transform ? `transform="${sprite.transform}"` : ''}/>${assetId==='clock' ? getVivianClockHandsHtml() : ''}</svg>`;
    }).join('');
}
const placements = [
    {id:'carpet', name:'출입 카펫', u:7,v:3,w:1,h:2,kind:'carpet'},
    {id:'fridge', name:'냉장고', u:2,v:0,w:1,h:1,kind:'floor'},
    {id:'goods', name:'상품 진열대', u:0,v:2,w:1,h:2,kind:'floor'},
    {id:'papers', name:'책 매대', u:6,v:1,w:2,h:1,kind:'floor'},
    {id:'counter', name:'계산대 · 뒤쪽 직원 공간 포함', u:2,v:5,w:2,h:2,kind:'floor'},
    {id:'plant', name:'화분', u:4,v:0,w:1,h:1,kind:'floor'},
    {id:'baskets', name:'장바구니', u:6,v:7,w:1,h:1,kind:'floor'},
    {id:'clock', name:'벽 시계', u:0,v:6,w:1,h:1,kind:'wall',wall:'left'},
    {id:'wallShelf', name:'벽 선반', u:6,v:0,w:2,h:1,kind:'wall',wall:'right'},
];
export function getRoomGridHtml({editable=false} = {}) {
    let cells = '';
    for (let u=0;u<8;u++) for (let v=0;v<8;v++) {
        const p=gridToScreen(u+.5,v+.5);
        cells += `<polygon points="${polygonPoints(u,v)}"/><text x="${p.x}" y="${p.y+5}">${u+1},${v+1}</text>`;
    }
    return `<svg class="vivian-placement-grid" viewBox="0 0 1536 1024" aria-hidden="true">${cells}<polygon id="vivianPlacementFootprint" class="selected-footprint" points=""/></svg>
        <div class="vivian-layout-toolbar" ${editable ? '' : 'hidden'}><button id="btnVivianArrange" type="button" aria-expanded="false">가구 정리</button>
        <div id="vivianLayoutControls" hidden>
            <label>가구 <select id="vivianLayoutItem">${placements.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label>
            <span class="vivian-grid-arrows"><button data-grid-move="-1,0" aria-label="가구 왼쪽 위로 한 칸">↖</button><button data-grid-move="0,-1" aria-label="가구 오른쪽 위로 한 칸">↗</button><button data-grid-move="0,1" aria-label="가구 왼쪽 아래로 한 칸">↙</button><button data-grid-move="1,0" aria-label="가구 오른쪽 아래로 한 칸">↘</button></span>
            <button id="btnVivianDuplicate" type="button">가구 복제</button><button id="btnVivianDeleteCopy" type="button" hidden>복제본 삭제</button>
            <button id="btnVivianLayoutReset">기본 배치</button><button id="btnVivianLayoutCancel">취소</button><button id="btnVivianLayoutSave">배치 저장</button>
            <p id="vivianLayoutStatus" role="status" aria-live="polite">가구를 드래그하거나 방향 버튼으로 옮기세요.</p>
        </div></div>`;
}



