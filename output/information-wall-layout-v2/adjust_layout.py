"""Clear the wall molding and place the noticeboard over the left cabinet."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector,Matrix

ROOT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'information-map-brochures-v1'/'Office-map-brochures-preview.blend'))
map_root=bpy.data.objects['Blank_Map_And_Brochure_Stand']
# Molding projects to x=-3.76. Keep the stand's back outside that face.
map_root.matrix_world=Matrix.Translation((.27,0,0))@map_root.matrix_world
board=bpy.data.objects['Information_Wall_Noticeboard']
board.matrix_world=(Matrix.Translation((-2.15,2.945,1.94))
                    @Matrix.Scale(.82,4)@Matrix.Rotation(-math.pi/2,4,'Z')
                    @Matrix.Translation((3.96,-.70,-1.60))@board.matrix_world)
bpy.context.view_layer.update()
def bounds(root):
    points=[obj.matrix_world@Vector(c) for obj in root.children_recursive if obj.type=='MESH' for c in obj.bound_box]
    return {'min':[min(p[i] for p in points) for i in range(3)],
            'max':[max(p[i] for p in points) for i in range(3)]}
map_box=bounds(map_root);board_box=bounds(board)
assert map_box['min'][0]>-3.76,map_box
assert board_box['min'][2]>1.25,board_box
assert board_box['max'][2]<2.8,board_box
scene=bpy.context.scene;cam=scene.camera
cam.data.type='PERSP';cam.data.lens=38;cam.location=(0,-12,9)
cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1400;scene.render.resolution_y=1100
scene.render.filepath=str(ROOT/'room-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'Office-wall-layout-v2.blend'))
(ROOT/'placement.json').write_text(json.dumps({'map_bounds':map_box,'board_bounds':board_box,
    'map_back_to_molding_gap':map_box['min'][0]+3.76,
    'board_center':[-2.15,2.945,1.94],'board_scale':.82,
    'map_surface':'blank','game_changed':False},indent=2),encoding='utf-8')
