"""Extend the plank surface across the remaining front foundation ledge."""
import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-wall-layout-v2'/'Office-wall-layout-v2.blend'))
planks=[o for o in bpy.context.scene.objects if o.name.startswith('Floor_Plank') and o.type=='MESH']
front=[o for o in planks if abs(o.location.y+2.8)<.01]
assert front
for obj in front:
    # Keep the rear joint fixed, extending only the front edge from -3 to -3.14.
    for vertex in obj.data.vertices:
        t=(.198-vertex.co.y)/.396
        vertex.co.y-=.14*max(0,min(1,t))
base=bpy.data.objects['Rectangular_Floor_Base']
base.data.materials[0]=front[0].data.materials[0]
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
cam.data.type='ORTHO';cam.data.ortho_scale=8.8;cam.location=(0,-8,5)
cam.rotation_euler=(Vector((0,-2.8,0))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=650
scene.render.filepath=str(ROOT/'floor-detail.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-floor-edge-preview.blend'))
(ROOT/'manifest.json').write_text(json.dumps({'front_planks_extended':len(front),
    'front_surface_y':-3.14,'foundation_edge_material':'matching wood',
    'central_exit':'preserved','game_changed':False},indent=2),encoding='utf-8')
