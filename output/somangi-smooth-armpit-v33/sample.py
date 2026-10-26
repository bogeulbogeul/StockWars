exec(open('output/somangi-smooth-armpit-v33/inspect.py').read().split('for y,z')[0])
image=bpy.data.images['Image_0'];w,h=image.size;cache={}
for y,z in [(0,-.35),(0,-.4),(0,-.45),(-.08,-.35)]:
 hit,n,i,d=tree.ray_cast(Vector((3,y,z)),Vector((-1,0,0)));f=m.polygons[i];uv=sum((m.uv_layers.active.data[j].uv for j in f.loop_indices),Vector((0,0)))/len(f.loop_indices);x=int(uv.x*w)%w;yy=int(uv.y*h)%h;pixel=image.pixels[(yy*w+x)*4:(yy*w+x)*4+4];print('SAMPLE',y,z,'MAT',f.material_index,'UV',uv[:],'sRGB',pixel)
