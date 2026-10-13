const fs=require('fs'),path=require('path');
const root=__dirname,run=path.join(root,'run');
let html=fs.readFileSync(path.join(root,'preview-template.html'),'utf8').replace('__SCALE__',fs.readFileSync(path.join(root,'scale.json'),'utf8'));
html=html.replace('__MANIFEST__',fs.readFileSync(path.join(run,'manifest.json'),'utf8')).replace('__ATLAS__','data:image/png;base64,'+fs.readFileSync(path.join(run,'sprite-sheet-alpha.png')).toString('base64')).replace('__PARCEL__','data:image/png;base64,'+fs.readFileSync(path.resolve(root,'../../../web/assets/minigames/logistics/parcel.png')).toString('base64'));
fs.writeFileSync(path.join(root,'preview.html'),html);
