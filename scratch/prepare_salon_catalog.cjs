const fs=require('fs'),path=require('path');
const animals=[['red-fox','붉은여우'],['siberian-chipmunk','시베리아다람쥐'],['raccoon-dog','너구리'],['european-badger','유럽오소리'],['brown-bear','불곰'],['european-rabbit','유럽토끼']];
const catalog=animals.map(([id,label])=>{
 const source=`output/forest-friends/sprites-v1/${id}/run`,dest=`web/assets/characters/forest-friends/${id}`;
 fs.mkdirSync(dest,{recursive:true});fs.copyFileSync(`${source}/sprite-sheet-alpha.png`,`${dest}/atlas.png`);
 const m=JSON.parse(fs.readFileSync(`${source}/manifest.json`));
 return {id,label,price:5000,frames:m.frame_layout};
});
fs.writeFileSync('web/js/components/salon/SalonStyleCatalog.js',`// Existing approved animal atlases; pricing and sale schedule remain unset.\nexport const SALON_STYLES = ${JSON.stringify(catalog,null,2)};\n`);
