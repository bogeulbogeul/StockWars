import bpy,hashlib,struct
from mathutils import Vector,Quaternion

def surface_hash(obj):
    payload=bytearray()
    for v in obj.data.vertices:payload.extend(struct.pack('<3f',*v.co))
    for p in obj.data.polygons:
        payload.extend(struct.pack('<I',len(p.vertices)))
        for i in p.vertices:payload.extend(struct.pack('<I',i))
    for layer in obj.data.uv_layers:
        for loop in layer.data:payload.extend(struct.pack('<2f',*loop.uv))
    return hashlib.sha256(payload).hexdigest()

def reset(rig):
    for pb in rig.pose.bones:
        pb.rotation_mode='QUATERNION'
        pb.rotation_quaternion=(1,0,0,0)
        pb.location=(0,0,0)
        pb.scale=(1,1,1)

def rotate(rig,name,degrees,axis=(1,0,0)):
    pb=rig.pose.bones[name]
    basis=pb.bone.matrix_local.to_quaternion()
    import math
    pb.rotation_quaternion=basis.inverted()@Quaternion(axis,math.radians(degrees))@basis

def translate(rig,name,world_delta):
    pb=rig.pose.bones[name]
    pb.location=pb.bone.matrix_local.to_3x3().inverted()@Vector(world_delta)

def key(rig,frame):
    for pb in rig.pose.bones:
        pb.keyframe_insert('location',frame=frame,group=pb.name)
        pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)

def evaluated_points(obj):
    ev=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=ev.to_mesh()
    result=[ev.matrix_world@v.co for v in mesh.vertices]
    ev.to_mesh_clear()
    return result
