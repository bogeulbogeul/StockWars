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
    polys=[p for p in src.polygons if min(src.vertices[i].co.z for i in p.vertices)>.005 or p.center.z<-.64]
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
        point=data.vertices[new].co
        name='Head' if point.z>.005 else 'Leg.'+('L' if point.x>=0 else 'R')
        groups[name].add([new],1,'REPLACE')
        if point.z<-.60:
            # Extend the thigh top inside the fixed torso so rotation cannot open a seam.
            blend=max(0,min(1,(point.z+.75)/.11))
            point.z+=.075*blend*blend
    def bind(obj,name):
        obj.parent=rig;group=obj.vertex_groups.new(name=name);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
        mod=obj.modifiers.new('Rigid '+name,'ARMATURE');mod.object=rig
        obj.data.materials.append(mat)
        for p in obj.data.polygons:p.use_smooth=True
        return obj
    # Match this new Meshy model's measured sections, not the old character's body.
    profile=[(-.705,0,0),(-.69,.12,.055),(-.665,.235,.105),(-.64,.286,.155),(-.6,.294,.207),(-.5,.329,.259),(-.4,.318,.267),(-.3,.278,.251),(-.2,.255,.223),(-.1,.239,.190),(0,.237,.177),(.055,.22,.19),(.10,0,0)]
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
        bone=rig.data.bones['Arm.'+side];direction=Vector((sign*.47,0,-.40))-bone.head_local;length=direction.length;direction.normalize()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32)
        obj=bpy.context.object;obj.name='Rigid_Arm.'+side
        q=Vector((0,0,1)).rotation_difference(direction)
        for v in obj.data.vertices:
            longitudinal=v.co.z
            along=.180+longitudinal*.240
            cap_distance=max(0,abs(along-.180)-.135)
            radius=math.sqrt(max(0,.105**2-cap_distance**2))
            source_radius=math.hypot(v.co.x,v.co.y)
            if source_radius>1e-7:
                v.co.x*=radius/source_radius;v.co.y*=radius/source_radius
            v.co.z=along
            v.co=bone.head_local+q@v.co
        bind(obj,'Arm.'+side);arms[side]=obj
    print('REBUILD_COLOR',color)
    return [torso,*arms.values()]
