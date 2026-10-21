from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
r=Path('output/bank-display-mark-v3');im=Image.new('RGB',(768,768));pix=im.load()
for y in range(768):
 for x in range(768):
  t=y/768;pix[x,y]=(int(15-5*t),int(57-23*t),int(80-29*t))
d=ImageDraw.Draw(im)
def font(size):return ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',size)
d.text((52,42),'NODE BANK',fill=(225,234,230),font=font(41));d.ellipse((664,55,678,69),fill=(130,211,180));d.line((52,118,716,118),fill=(67,105,122),width=2)
d.rounded_rectangle((50,157,718,425),radius=24,fill=(25,61,79),outline=(64,106,124),width=2)
d.text((83,184),'ACCOUNT OVERVIEW',fill=(150,190,203),font=font(23));d.text((83,234),'— — —',fill=(226,235,227),font=font(67));d.text((84,350),'Welcome to Node Bank',fill=(159,196,207),font=font(24))
icon=Image.open(r/'adopted-bank-mark.png').convert('RGBA').resize((126,126),Image.Resampling.LANCZOS)
im.paste(icon,(555,217),icon)
for a,b,label in [(50,371,'SERVICES'),(397,718,'INFORMATION')]:
 d.rounded_rectangle((a,467,b,587),radius=18,fill=(36,85,106),outline=(78,131,149),width=2);w=d.textbbox((0,0),label,font=font(23))[2];d.text(((a+b-w)/2,510),label,fill=(225,237,235),font=font(23))
d.line((52,649,716,649),fill=(67,105,122),width=2);d.text((52,675),'BANKING INFORMATION',fill=(135,175,188),font=font(21))
overlay=Image.new('RGBA',(768,768));od=ImageDraw.Draw(overlay);od.polygon([(0,0),(455,0),(0,363)],fill=(190,220,235,10));im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB');im.save(r/'display-ui.png')
s=Path('output/bank-info-terminal-v1/build_terminal.py').read_text(encoding='utf-8')
s=s.replace("panel=material('Inset_Wood',(.345,.181,.067),.86)","panel=material('Inset_Wood',(.345,.181,.067),.86)\nbezel=material('Dark_Display_Bezel',(.018,.025,.031),.40)")
a=s.index("screenbox('Inset_Display_Lining'");b=s.index("ob=disk('Brass_Screen_Button'",a)
s=s[:a]+'''screenbox('Inset_Display_Lining',(.476,.012,.472),(0,-.054,.027),bezel,.015)
mesh=bpy.data.meshes.new('Display_Glass_Surface')
mesh.from_pydata([(-.219,-.061,.027-.217),(.219,-.061,.027-.217),(.219,-.061,.027+.217),(-.219,-.061,.027+.217)],[],[(0,1,2,3)])
mesh.uv_layers.new(name='Display_UV')
for loop,uv in zip(mesh.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=uv
mat=material('Illuminated_Display_Glass',(.03,.1,.16),.18)
bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Coat Weight'].default_value=.65;bs.inputs['Coat Roughness'].default_value=.12
tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'display-ui.png'));tex.image.pack()
mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.8
ob=bpy.data.objects.new('Flush_Glass_Display',mesh);bpy.context.collection.objects.link(ob);ob.parent=root;mesh.materials.append(mat)
''' +s[b:]
s=s.replace("'textures':0","'textures':1")
(r/'build_terminal.py').write_text(s,encoding='utf-8')
