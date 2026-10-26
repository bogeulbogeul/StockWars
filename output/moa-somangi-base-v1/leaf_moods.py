"""Independent two-bone leaf actions, layered over the existing body walk."""
import bpy, math, json
import struct
from mathutils import Euler

MOODS = {
    'Calm': (2.4, 0, 3, 0, 4),
    'Happy': (1.2, 0, 15, 0, 12),
    'Sad': (2.4, -32, 2, -20, 3),
    'Curious': (2.0, 18, 5, 10, 7),
    'Surprised': (1.0, 28, 3, 14, 5),
}

def add_leaf_moods(rig, leaf, stem, folder):
    scene = bpy.context.scene
    walk = rig.animation_data.action
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for name, head, tail, parent in [
        ('Leaf.Base', (.018,0,.96), (.24,0,1.22), 'Head'),
        ('Leaf.Tip', (.24,0,1.22), (.455,0,1.44), 'Leaf.Base')]:
        bone = rig.data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        bone.parent = rig.data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for ob in (leaf, stem):
        ob.vertex_groups.clear()
        groups = {n: ob.vertex_groups.new(name=n) for n in ('Head','Leaf.Base','Leaf.Tip')}
        for v in ob.data.vertices:
            z = (ob.matrix_world @ v.co).z
            if ob == stem:
                base = max(0,min(1,(z-.96)/.065))
                weights = {'Head':1-base,'Leaf.Base':base}
            else:
                tip = max(0,min(1,(z-1.15)/.20))
                tip = tip*tip*(3-2*tip)
                weights = {'Leaf.Base':1-tip,'Leaf.Tip':tip}
            for name, weight in weights.items():
                if weight:
                    groups[name].add([v.index], weight, 'REPLACE')
    # Export only the original walk and leaf actions, excluding unused source actions.
    for action in list(bpy.data.actions):
        if action != walk:
            bpy.data.actions.remove(action, do_unlink=True)
    manifest = {}
    for mood, (seconds, lean, sway, tip_lean, tip_sway) in MOODS.items():
        action = bpy.data.actions.new('Moa_Leaf_'+mood)
        rig.animation_data.action = action
        frames = round(seconds*scene.render.fps)
        for i in range(frames+1):
            phase = 2*math.pi*i/frames
            for name, angle in [('Leaf.Base',lean+sway*math.sin(phase)),
                                ('Leaf.Tip',tip_lean+tip_sway*math.sin(phase))]:
                pb = rig.pose.bones[name]
                pb.rotation_mode = 'QUATERNION'
                pb.rotation_quaternion = Euler((0,0,math.radians(angle))).to_quaternion()
                pb.keyframe_insert('rotation_quaternion', frame=i+1, group=name)
        action.use_fake_user = True
        manifest[mood.lower()] = dict(clip=action.name, seconds=seconds,
            loop=True, affectedBones=['Leaf.Base','Leaf.Tip'])
    rig.animation_data.action = walk
    for name in ('Leaf.Base','Leaf.Tip'):
        rig.pose.bones[name].rotation_quaternion = (1,0,0,0)
    scene.frame_set(1)
    (folder/'leaf-moods.json').write_text(json.dumps(dict(
        moods=manifest, blending='Crossfade leaf actions over the body walk; leaf-only tracks.',
        rootAttachment='Head > Leaf.Base > Leaf.Tip', gameInstalled=False),indent=2))

def isolate_exported_tracks(path):
    raw = path.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    data = json.loads(raw[20:20+size])
    report = {}
    for clip in data['animations']:
        mood = clip['name'].startswith('Moa_Leaf_')
        clip['channels'] = [c for c in clip['channels']
            if data['nodes'][c['target']['node']]['name'].startswith('Leaf.') == mood]
        targets = sorted({data['nodes'][c['target']['node']]['name'] for c in clip['channels']})
        assert targets == ['Leaf.Base','Leaf.Tip'] if mood else 'Body' in targets
        report[clip['name']] = targets
    encoded = json.dumps(data,separators=(',',':')).encode()
    encoded += b' '*((-len(encoded))%4)
    tail = raw[20+size:]
    path.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(tail))+
                     struct.pack('<II',len(encoded),0x4e4f534a)+encoded+tail)
    (path.parent/'leaf-track-check.json').write_text(json.dumps(report,indent=2))
