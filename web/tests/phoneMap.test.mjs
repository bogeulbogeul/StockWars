import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP_PLACES,project,mapPlayerPosition,normalMapPosition,exhibitionMapPosition} from '../js/components/phone/map/MapData.js';
import {mapSVG} from '../js/components/phone/map/MapSvg.js';
import {mapPathData} from '../js/components/phone/map/MapPaths.js';
import {villagePathRoutes} from '../js/data/townLandscapeLayout.js';
import {TOWN_MODEL_PROPS} from '../js/data/townModelProps.js';

test('phone and story maps draw every current rounded path and the actual stop position',()=>{
 const svg=mapSVG(),routes=villagePathRoutes();
 assert(!svg.includes('<polyline'));
 for(const route of routes)assert(svg.includes(`d="${mapPathData(route)}"`));
 assert(svg.includes('Q'));
 const stop=TOWN_MODEL_PROPS.find(p=>p.id==='village_bus_stop'),p=project(stop.x,stop.y);
 assert(svg.includes(`translate(${p.x},${p.y})`));
 assert(svg.includes('data-player-marker'));
});

test('map uses all nine current buildings and can project the whole playable world',()=>{
 assert.equal(MAP_PLACES.length,9);assert(MAP_PLACES.every(b=>b.meta));
 for(const p of [project(0,0),project(3700,2600),project(2100,1700)]){assert(p.x>=0&&p.x<=320);assert(p.y>=0&&p.y<=332);}
});
test('outdoor coordinates stay live while indoor rooms use the correct village building',()=>{
 const controller={charPosX:2100,charPosY:1700};assert.equal(mapPlayerPosition(controller).x,2100);
 controller.charPosX=2150;assert.equal(mapPlayerPosition(controller).x,2150);
 const app={townStage:{playerController:controller},bankModelScene:{active:true}};
 const bank=MAP_PLACES.find(p=>p.id==='node_finance');assert.equal(normalMapPosition(app).x,bank.x);assert.equal(normalMapPosition(app).indoor,true);
 const scene={townStage:app.townStage,rooms:new Map([['information',{active:true}]])};assert.match(exhibitionMapPosition(scene).label,/안내소 실내/);
 assert.equal(mapPlayerPosition({charPosX:NaN,charPosY:0}),null);
});
