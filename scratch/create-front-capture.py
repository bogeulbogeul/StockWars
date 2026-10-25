from pathlib import Path
s=Path('scratch/inspect-shop-items.cjs').read_text();s=s[:s.index('fs.writeFileSync(')]+'''
for(const [name,fixture,pattern,side] of [['cabinet-front','shelf','^Shelf_',1],['fridge-front','fridge','^Fridge_',-1]]) {
await p.evaluate(({fixture,pattern,side})=>{
 s.hide();s.layer.classList.remove('hidden');
 s.scene.background=new THREE.Color('#f4f0e7');
 s.scene.traverse(o=>{if(o.isMesh){let isProduct=false;for(let node=o;node;node=node.parent){if(node.userData.fixture){isProduct=node.userData.fixture===fixture;break;}}o.visible=isProduct||new RegExp(pattern).test(o.name);}});
 s.scene.updateMatrixWorld(true);
 const box=new THREE.Box3();s.scene.traverse(o=>{if(o.isMesh&&o.visible)box.union(new THREE.Box3().setFromObject(o));});
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const aspect=1440/1000,half=Math.max(size.y/2,size.z/(2*aspect))*1.15;
 const camera=new THREE.OrthographicCamera(-half*aspect,half*aspect,half,-half,.1,3000);
 camera.position.set(center.x+side*600,center.y,center.z);camera.lookAt(center);camera.updateProjectionMatrix();
 s.renderer.render(s.scene,camera);
}, {fixture,pattern,side});
await p.screenshot({path:`output/shop-items-game-v1/${name}.png`});
}
await b.close()})();
''';Path('scratch/capture-shop-fixtures-front.cjs').write_text(s)
