// Geometry references for image_gen, not runtime replacements for PNG furniture.
const fs=require('node:fs');
const sharp=require('C:/Users/bogeu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='scratch/furniture-projection-guides';fs.mkdirSync(out,{recursive:true});
const sx=170, sy=sx*19.1/33.75, sz=sx/33.75;
const palette={wood:['#DDB888','#C69A68','#A5784D'],cream:['#F2E6CF','#F2E6CF','#D2C5AF'],teal:['#63999C','#477E82','#315C62']};
const specs={
 bed:[[0,0,0,3.5,1.8,18,'wood'],[0,0,18,3.5,1.8,8,'cream'],[1,0,26,2.5,1.8,3,'teal'],[0,0,0,.12,1.8,55,'wood'],[.2,.15,26,.65,1.5,5,'cream']],
 wardrobe:[[0,0,0,1.8,.85,110,'wood'],[.08,.86,6,.80,.025,98,'cream'],[.92,.86,6,.80,.025,98,'cream'],[.80,.9,48,.035,.06,11,'teal'],[.97,.9,48,.035,.06,11,'teal']],
 desk:[[0,0,0,.14,.14,41,'wood'],[2.65,0,0,.14,.14,41,'wood'],[0,1.35,0,.14,.14,41,'wood'],[2.65,1.35,0,.14,.14,41,'wood'],[1.9,.1,6,.8,1.25,35,'cream'],[0,0,41,2.8,1.5,4,'wood']],
 chair:[[0,0,0,.12,.12,27,'wood'],[.78,0,0,.12,.12,27,'wood'],[0,.78,0,.12,.12,27,'wood'],[.78,.78,0,.12,.12,27,'wood'],[0,0,27,.9,.9,4,'teal'],[0,0,31,.12,.9,24,'wood']]
};
(async()=>{for(const [name,boxes] of Object.entries(specs)){
 let shapes=[], all=[];
 const p=(u,v,z)=>[(u-v)*sx,(u+v)*sy-z*sz];
 const face=(points,color)=>{all.push(...points);shapes.push({points,color});};
 for(const [u,v,z,du,dv,dz,mat] of boxes){const q=(a,b,c)=>p(u+a*du,v+b*dv,z+c*dz),c=palette[mat];
 face([q(0,1,0),q(1,1,0),q(1,1,1),q(0,1,1)],c[1]);
 face([q(1,0,0),q(1,1,0),q(1,1,1),q(1,0,1)],c[2]);
 face([q(0,0,1),q(1,0,1),q(1,1,1),q(0,1,1)],c[0]);}
 const minX=Math.min(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1]));
 const width=Math.ceil(Math.max(...all.map(p=>p[0]))-minX+80),height=Math.ceil(Math.max(...all.map(p=>p[1]))-minY+80);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes.map(s=>`<polygon points="${s.points.map(([x,y])=>`${x-minX+40},${y-minY+40}`).join(' ')}" fill="${s.color}" stroke="#203D42" stroke-width="3" stroke-linejoin="round"/>`).join('')}</svg>`;
 fs.writeFileSync(`${out}/${name}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${out}/${name}.png`);
 console.log(name,width,height);
}})();
