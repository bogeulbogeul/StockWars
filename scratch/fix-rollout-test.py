from pathlib import Path
p=Path('scratch/check-shop-items-rollout.cjs');s=p.read_text();s=s.replace("const pathname=decodeURIComponent(new URL(r.request().url()).pathname);", "const u=new URL(r.request().url());if(u.hostname!=='stockwars.local')return r.fulfill({status:204,body:''});const pathname=decodeURIComponent(u.pathname);")
s=s.replace("await p.evaluate(async()=>{const a=window.stockWarsApp;await a.enterVivianModel();await a.vivianModelScene.ready;});", """console.log('game ready');
await p.evaluate(async()=>{const a=window.stockWarsApp;const {TOWN_MODEL_BUILDINGS}=await import('/js/data/townModelBuildings.js');const building=TOWN_MODEL_BUILDINGS.find(b=>b.id==='vivian_store');a.townStage.playerController.charPosX=building.x;a.townStage.playerController.charPosY=building.y+80;window.entry=a.enterVivianModel();});
await p.waitForFunction(()=>window.stockWarsApp.vivianModelScene?.active,null,{timeout:60000});console.log('entered');""")
p.write_text(s)
