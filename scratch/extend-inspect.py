from pathlib import Path
p=Path('scratch/inspect-shop-items.cjs')
s=p.read_text();s=s.replace("await p.screenshot({path:'output/shop-items-game-v1/before.png'});", """await p.screenshot({path:'output/shop-items-game-v1/room.png'});
console.log(await p.evaluate(()=>{s.room.updateMatrixWorld(true);return s.productDisplay.children.filter(o=>o.userData.fixture==='fridge').slice(0,3).map(o=>{const b=new THREE.Box3().setFromObject(o);return [o.name,b.min.toArray(),b.max.toArray()]})}));
for(const [name,x,z] of [['cabinet',-3.5,.3],['fridge',3.5,.6]]){await p.evaluate(({x,z})=>{s.hide();s.layer.classList.remove('hidden');s.camera.position.set(x*75+(x>0?-230:230),170,z*75+170);s.camera.lookAt(x*75,80,z*75);s.renderer.render(s.scene,s.camera)}, {x,z});await p.screenshot({path:`output/shop-items-game-v1/${name}.png`});}
""");p.write_text(s)
