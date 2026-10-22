import bpy,numpy as np
from collections import Counter
from mathutils import Vector
from mathutils.kdtree import KDTree
from motion_utils import ease

class Shoulder:
    def __init__(self,base,ids,faces,palms):
        self.ids=np.array(sorted(ids));self.lookup={v:i for i,v in enumerate(self.ids)}
        merged={};representatives=[];self.proxy_map=[]
        for j,i in enumerate(self.ids):
            key=tuple(np.round(base[i],6))
            if key not in merged:merged[key]=len(representatives);representatives.append(j)
            self.proxy_map.append(merged[key])
        self.proxy_map=np.array(self.proxy_map);self.representatives=np.array(representatives)
        proxy_faces=[[int(self.proxy_map[self.lookup[i]]) for i in f] for f in faces]
        proxy_faces=[f for f in proxy_faces if len(set(f))==len(f)]
        edges=Counter(tuple(sorted((a,b))) for f in proxy_faces for a,b in zip(f,f[1:]+f[:1]))
        proxy_boundary={i for edge,count in edges.items() if count==1 for i in edge}
        boundary={int(i) for i,j in zip(self.ids,self.proxy_map) if j in proxy_boundary}
        self.boundary=np.array(sorted(boundary))
        self.boundary_set=boundary
        tree=KDTree(len(boundary))
        for j,i in enumerate(boundary):tree.insert(Vector(base[i]),j)
        tree.balance();distance=np.array([tree.find(Vector(base[i]))[2] for i in self.ids])
        self.hand=ease(distance/.20)
        self.hand/=np.mean([self.hand[self.lookup[i]] for i in palms])
        self.fair=1-ease(distance/.14)
        data=bpy.data.meshes.new('Shoulder smoothing proxy')
        data.from_pydata(base[self.ids[self.representatives]],[],proxy_faces);data.update()
        self.obj=bpy.data.objects.new('Shoulder smoothing proxy',data);bpy.context.collection.objects.link(self.obj)
        group=self.obj.vertex_groups.new(name='Proximal shoulder')
        for k,j in enumerate(self.representatives):
            if self.fair[j]:group.add([k],float(self.fair[j]),'REPLACE')
        mod=self.obj.modifiers.new('Round shoulder end','SMOOTH');mod.factor=.8;mod.iterations=100;mod.vertex_group=group.name

    def solve(self,coords,delta,body_tree,head_tree):
        result=coords[self.ids].copy()+self.hand[:,None]*delta
        for i in self.boundary:
            j=self.lookup[i];p=Vector(result[j]);p.z-=.008
            hit,n,_,_=body_tree.find_nearest(p)
            if (p-hit).dot(n)>-.006:p=hit-n*.010
            result[j]=p
        self.obj.data.vertices.foreach_set('co',result[self.representatives].astype(np.float32).ravel())
        self.obj.data.update();bpy.context.view_layer.update()
        ev=self.obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        solved=np.array([tuple(v.co) for v in mesh.vertices])[self.proxy_map];ev.to_mesh_clear()
        # Hide the cut rim inside the torso, with clearance from the head on visible surfaces.
        for j in np.flatnonzero(self.fair):
            p=Vector(solved[j]);bh,bn,_,_=body_tree.find_nearest(p)
            if int(self.ids[j]) in self.boundary_set:
                if (p-bh).dot(bn)>-.004:p=bh-bn*.008
            elif (p-bh).dot(bn)>.002:
                hit,n,_,_=head_tree.find_nearest(p)
                if (p-hit).dot(n)<.003:p=hit+n*.003
            solved[j]=p
        return solved

    def close(self):bpy.data.objects.remove(self.obj,do_unlink=True)
