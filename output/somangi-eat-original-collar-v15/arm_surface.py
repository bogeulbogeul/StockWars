import bpy,numpy as np,math
from collections import Counter
from mathutils import Vector
from mathutils.kdtree import KDTree
from motion_utils import ease

def prepare(body,rest,parts):
    old=body.data;n=len(old.vertices);vertices=[tuple(v.co) for v in old.vertices]
    all_arm=set().union(parts['Arm.L'][0],parts['Arm.R'][0]);faces=[];uv=[];materials=[]
    for face in old.polygons:
        if all(i in all_arm for i in face.vertices):continue
        faces.append(list(face.vertices));materials.append(face.material_index)
        uv.extend(tuple(old.uv_layers.active.data[i].uv) for i in face.loop_indices)
    layouts={}
    for side,sign in [('L',1),('R',-1)]:
        first_face=len(faces)
        ids=parts['Arm.'+side][0];pivot=np.array([sign*.285,0,-.11])
        direction=np.array([sign*.195,0,-.33]);direction/=np.linalg.norm(direction)
        along=(rest-pivot)@direction;plane=.16;merged={};representative={}
        for i in sorted(ids):
            key=tuple(np.round(rest[i],6));representative[i]=merged.setdefault(key,i)
        cuts={};interpolations=[];distal=[]
        for face in old.polygons:
            if not all(i in ids for i in face.vertices):continue
            polygon=[(representative[i],np.array(old.uv_layers.active.data[j].uv)) for i,j in zip(face.vertices,face.loop_indices)]
            output=[]
            for (a,ua),(b,ub) in zip(polygon,polygon[1:]+polygon[:1]):
                inside_a=along[a]>=plane;inside_b=along[b]>=plane
                if inside_a:output.append((a,ua))
                if inside_a!=inside_b:
                    t=(plane-along[a])/(along[b]-along[a]);key=tuple(sorted((a,b)))
                    if key not in cuts:
                        index=len(vertices);cuts[key]=index
                        vertices.append(tuple(rest[a]*(1-t)+rest[b]*t));interpolations.append((index,a,b,t))
                    output.append((cuts[key],ua*(1-t)+ub*t))
            if len(output)<3:continue
            polygon_ids=[i for i,_ in output]
            if len(set(polygon_ids))!=len(polygon_ids):continue
            faces.append(polygon_ids);distal.append(polygon_ids);materials.append(face.material_index)
            uv.extend(tuple(v) for _,v in output)
        edges=Counter(tuple(sorted((a,b))) for f in distal for a,b in zip(f,f[1:]+f[:1]))
        boundary=[(a,b) for f in distal for a,b in zip(f,f[1:]+f[:1]) if edges[tuple(sorted((a,b)))]==1]
        following=dict(boundary);remaining=set(following);loops=[]
        while remaining:
            seed=next(iter(remaining));loop=[seed];remaining.remove(seed);cursor=following[seed]
            while cursor!=seed:
                assert cursor not in loop,'Shoulder ring not closed'
                loop.append(cursor);remaining.remove(cursor);cursor=following[cursor]
            loops.append(loop)
        loops.sort(key=len,reverse=True);loop=loops[0];minor=[]
        for small in loops[1:]:
            center_id=len(vertices);vertices.append(tuple(np.array(vertices)[small].mean(0)))
            for j in range(len(small)):
                faces.append([small[(j+1)%len(small)],small[j],center_id]);materials.append(2);uv.extend([(.5,.5)]*3)
            minor.append((center_id,small))
        center=np.array(vertices)[loop].mean(0);anchor=np.array([sign*.17,-.005,.05])
        ring_rest=np.array(vertices)[loop];length=np.linalg.norm(np.roll(ring_rest,-1,axis=0)-ring_rest,axis=1)
        angle=np.r_[0,np.cumsum(length[:-1])]/length.sum()*2*math.pi
        fourier=np.stack([np.ones(len(loop)),np.cos(angle),np.sin(angle),np.cos(2*angle),np.sin(2*angle)],axis=1)
        weights=(length+np.roll(length,1))*.5;weights/=weights.sum()
        tree=KDTree(len(loop))
        for j,p in enumerate(ring_rest):tree.insert(Vector(p),j)
        tree.balance();near=[]
        for i in ids:
            if along[i]<.26:near.append((i,tree.find(Vector(rest[i]))[1],1-ease((along[i]-.16)/.10)))
        previous=loop;rings=[];white=(.5,.5)
        for u in [.12,.28,.45,.61,.75,.88,.96]:
            ring=[]
            for i in loop:
                point=center*(1-u)+anchor*u+(np.array(vertices[i])-center)*math.sqrt(1-.5*u*u)
                ring.append(len(vertices));vertices.append(tuple(point))
            for j in range(len(loop)):
                k=(j+1)%len(loop);faces.append([previous[k],previous[j],ring[j],ring[k]])
                materials.append(2);uv.extend([white]*4)
            rings.append((u,ring));previous=ring
        end=len(vertices);vertices.append(tuple(anchor))
        for j in range(len(loop)):
            faces.append([previous[(j+1)%len(loop)],previous[j],end]);materials.append(2);uv.extend([white]*3)
        layouts[side]={'ids':np.array(sorted(ids)),'weights':ease((along[sorted(ids)]-.15)/.15),
          'cuts':interpolations,'loop':np.array(loop),'rings':rings,'end':end,'anchor':anchor,'minor':minor,
          'fourier':fourier,'fitWeights':weights,'near':near}
        layouts[side]['faces']=[f[:] for f in faces[first_face:]]
    data=bpy.data.meshes.new('Preserved forearms with rounded shoulder ends');data.from_pydata(vertices,[],faces);data.update()
    for material in old.materials:data.materials.append(material)
    layer=data.uv_layers.new(name='UVMap')
    for i,v in enumerate(uv):layer.data[i].uv=v
    for face,material in zip(data.polygons,materials):face.material_index=material;face.use_smooth=True
    body.shape_key_clear();body.data=data
    return np.array(vertices),layouts

def pose(coords,base,layouts,delta,palms):
    result=base.copy();result[:len(coords)]=coords
    for side,layout in layouts.items():
        ids=layout['ids'];weights=layout['weights'].copy();lookup={i:j for j,i in enumerate(ids)}
        weights/=np.mean([weights[lookup[i]] for i in palms[side]])
        result[ids]+=weights[:,None]*delta
        for i,a,b,t in layout['cuts']:result[i]=result[a]*(1-t)+result[b]*t
        for i,small in layout['minor']:result[i]=result[small].mean(0)
        loop=layout['loop'];raw=result[loop].copy();basis=layout['fourier'];weights=layout['fitWeights']
        coefficient=np.linalg.lstsq(basis*np.sqrt(weights[:,None]),raw*np.sqrt(weights[:,None]),rcond=None)[0]
        smooth=basis@coefficient;change=smooth-raw
        for i,j,w in layout['near']:result[i]+=change[j]*w
        result[loop]=smooth;center=np.sum(smooth*weights[:,None],axis=0);vectors=smooth-center
        for u,ring in layout['rings']:
            result[ring]=center*(1-u)+layout['anchor']*u+vectors*math.sqrt(1-.5*u*u)
        result[layout['end']]=layout['anchor']
    return result.astype(np.float32)

class FairArm:
    def __init__(self,base,layout):
        self.ids=np.array(sorted({i for f in layout['faces'] for i in f}));lookup={i:j for j,i in enumerate(self.ids)}
        data=bpy.data.meshes.new('Local round shoulder fairing')
        data.from_pydata(base[self.ids],[],[[lookup[i] for i in f] for f in layout['faces']]);data.update()
        self.obj=bpy.data.objects.new('Local round shoulder fairing',data);bpy.context.collection.objects.link(self.obj)
        group=self.obj.vertex_groups.new(name='Shoulder only');weights={i:w for i,j,w in layout['near']}
        for i in layout['loop']:weights[i]=1
        for u,ring in layout['rings']:
            for i in ring:weights[i]=1-ease((u-.8)/.2)
        for i in self.ids:
            if weights.get(i,0)>0:group.add([lookup[i]],float(weights[i]),'REPLACE')
        modifier=self.obj.modifiers.new('Remove shoulder surface wrinkles','SMOOTH')
        modifier.factor=.6;modifier.iterations=60;modifier.vertex_group=group.name

    def solve(self,coords):
        self.obj.data.vertices.foreach_set('co',coords[self.ids].ravel());self.obj.data.update();bpy.context.view_layer.update()
        ev=self.obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        coords[self.ids]=np.array([tuple(v.co) for v in mesh.vertices]);ev.to_mesh_clear()

    def close(self):bpy.data.objects.remove(self.obj,do_unlink=True)


