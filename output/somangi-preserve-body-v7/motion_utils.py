import bpy,numpy as np
from mathutils import Vector
def ease(t):
    t=np.clip(t,0,1);return t*t*t*(t*(t*6-15)+10)
def ratio(t):return 1-sum(.18*ease((t-a)/.1) for a in [1.07,1.47,1.77])
def points(body):
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
    a=np.empty(len(mesh.vertices)*3,dtype=np.float32);mesh.vertices.foreach_get('co',a);ev.to_mesh_clear()
    return a.reshape(-1,3)
def arm_masks(body,rig,base):
    masks={}
    def shoulder(z):
        knots=[(-.24,.255),(-.16,.222),(-.08,.225),(0,.245),(.02,.25)]
        if z<-.24:return .255+.60*min(.10,-z-.24)+.35*max(0,-z-.34)
        if z>.02:return .25
        for (a,x),(b,y) in zip(knots,knots[1:]):
            if a<=z<=b:return x+(y-x)*(z-a)/(b-a)
    boundary=np.array([shoulder(z) for z in base[:,2]])
    for side in ['L','R']:
        sign=1 if side=='L' else -1
        masks[side]=ease((sign*base[:,0]-boundary)/.10)
        masks[side]*=ease((-.025-base[:,2])/.04)
    return masks
def move_arm(coords,pivot,old,target,weight):
    q=(Vector(old)-Vector(pivot)).rotation_difference(Vector(target)-Vector(pivot))
    axis,angle=q.to_axis_angle();axis=np.array(axis);v=coords-pivot
    theta=angle*weight;c=np.cos(theta)[:,None];s=np.sin(theta)[:,None]
    rotated=v*c+np.cross(axis,v)*s+(v@axis)[:,None]*axis*(1-c)
    residual=np.array(target)-(np.array(pivot)+np.array(q@(Vector(old)-Vector(pivot))))
    return np.array(pivot)+rotated+weight[:,None]*residual
def key_linear(keys):
    action=keys.animation_data.action
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for point in curve.keyframe_points:point.interpolation='LINEAR'
def bake_shapes(obj,arrays,prefix):
    obj.shape_key_clear();obj.shape_key_add(name='Basis');keys=[]
    for i,coords in enumerate(arrays):
        key=obj.shape_key_add(name=f'{prefix}_{i+1:03}');key.data.foreach_set('co',np.asarray(coords,dtype=np.float32).ravel());keys.append(key)
    for i in range(len(keys)):
        for j,key in enumerate(keys):
            key.value=1 if i==j else 0;key.keyframe_insert('value',frame=i+1)
    key_linear(obj.data.shape_keys)
