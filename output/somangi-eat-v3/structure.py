import bpy,math
from mathutils import Vector

def rebuild(mesh,rig):
    src=mesh.data;uv=src.uv_layers.active
    # Sample a clean original belly texel so the rebuilt white surfaces match.
    material=src.materials[0];node=material.node_tree.nodes.get('Principled BSDF')
    texture=next((n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'base' in n.image.name.lower()),None)
    if texture is None:texture=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
    poly=min(src.polygons,key=lambda p:abs(p.center.x)+abs(p.center.z+.4)+abs(p.center.y+.35))
    tex=sum((uv.data[i].uv for i in poly.loop_indices),Vector((0,0)))/len(poly.loop_indices)
    w,h=texture.size;idx=4*(int(tex.y*(h-1))*w+int(tex.x*(w-1)));color=list(texture.pixels[idx:idx+4])
    mat=bpy.data.materials.new('Matched original white');mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color
    bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
    # Retain the textured original head and the original legs/feet.
    polys=[p for p in src.polygons if p.center.z>.005 or p.center.z<-.64]
    ids=sorted({i for p in polys for i in p.vertices});mapping={old:new for new,old in enumerate(ids)}
    data=bpy.data.meshes.new('Original head and feet');data.from_pydata([src.vertices[i].co for i in ids],[],[[mapping[i] for i in p.vertices] for p in polys])
    for m in src.materials:data.materials.append(m)
    layer=data.uv_layers.new(name='UVMap')
    for p,old in zip(data.polygons,polys):
        p.use_smooth=True;p.material_index=old.material_index
        for a,b in zip(p.loop_indices,old.loop_indices):layer.data[a].uv=uv.data[b].uv
    weights={i:[(mesh.vertex_groups[g.group].name,g.weight) for g in src.vertices[i].groups] for i in ids}
    mesh.data=data;mesh.vertex_groups.clear()
    groups={name:mesh.vertex_groups.new(name=name) for name in ['Root','Body','Head','Leg.L','Leg.R']}
    for old,new in mapping.items():
        for name,weight in weights[old]:
            if name in groups:groups[name].add([new],weight,'REPLACE')
    def bind(obj,name):
        obj.parent=rig;group=obj.vertex_groups.new(name=name);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
        mod=obj.modifiers.new('Rigid '+name,'ARMATURE');mod.object=rig
        obj.data.materials.append(mat)
        for p in obj.data.polygons:p.use_smooth=True
        return obj
    profile=[(-.745,0,0),(-.72,.16,.12),(-.69,.26,.20),(-.65,.325,.255),(-.6,.35,.302),(-.5,.385,.348),(-.4,.40,.354),(-.3,.365,.333),(-.2,.327,.29),(-.1,.288,.245),(0,.26,.22),(.055,.22,.19),(.10,0,0)]
    def interpolate(t,axis):
        i=min(int(t),len(profile)-2);u=t-i
        p0=profile[max(0,i-1)][axis];p1=profile[i][axis];p2=profile[i+1][axis];p3=profile[min(len(profile)-1,i+2)][axis]
        return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
    rings=97;segments=64;vertices=[];faces=[]
    for j in range(rings):
        t=j/(rings-1)*(len(profile)-1);z=interpolate(t,0);rx=max(.00001,interpolate(t,1));ry=max(.00001,interpolate(t,2))
        for k in range(segments):
            angle=k*2*math.pi/segments;vertices.append((rx*math.cos(angle),-.01+ry*math.sin(angle),z))
    for j in range(rings-1):
        for k in range(segments):faces.append((j*segments+k,j*segments+(k+1)%segments,(j+1)*segments+(k+1)%segments,(j+1)*segments+k))
    data=bpy.data.meshes.new('Smooth stable torso');data.from_pydata(vertices,[],faces);data.update()
    torso=bpy.data.objects.new('Eating_Torso',data);bpy.context.collection.objects.link(torso);bind(torso,'Body')
    arms={}
    for side,sign in [('L',1),('R',-1)]:
        bone=rig.data.bones['Arm.'+side];direction=Vector((sign*.566,-.015,-.387))-bone.head_local;length=direction.length;direction.normalize()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32)
        obj=bpy.context.object;obj.name='Rigid_Arm.'+side
        q=Vector((0,0,1)).rotation_difference(direction)
        for v in obj.data.vertices:
            longitudinal=v.co.z;v.co.x*=.119*(1+.08*longitudinal);v.co.y*=.119*(1+.08*longitudinal)
            v.co.z=.215+longitudinal*.315
            v.co=bone.head_local+q@v.co
        bind(obj,'Arm.'+side);arms[side]=obj
    print('REBUILD_COLOR',color)
    return [torso,*arms.values()]
