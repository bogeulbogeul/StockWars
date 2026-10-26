"""Native window and emblem design preview; game v2 stays installed."""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'cipher-exterior-blender-v1'))
from exterior_geometry import box,extrude,stroke,material
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent/'cipher-exterior-polish-v2'/'CipherSecurities-clock.blend'))
gold=material('Cipher_Satin_Brass',(.60,.385,.135),.64)
navy=material('Cipher_Enamel_Navy',(.022,.065,.13),.78)
cream=bpy.data.materials['Trim_Cream']
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith(('Emblem_Plaque','Rising_Bar','Rising_Arrow','Arrow_Tip','Window_Unified_Recessed_Cross')):
        bpy.data.objects.remove(obj,do_unlink=True)
for cx in (-.77,.77):
    # Thin brass inlay follows the continuous cream surround, seated into it.
    r=.191;bottom=.369;spring=.68
    outline=[(cx-r,-.958,bottom),(cx+r,-.958,bottom),(cx+r,-.958,spring)]
    outline += [(cx+r*math.cos(math.pi*i/64),-.958,spring+r*math.sin(math.pi*i/64)) for i in range(1,65)]
    outline += [outline[0]]
    stroke('Window_Brass_Arch_Inlay',outline,.0045,gold)
    # Lower panes and an arched fanlight share one restrained frame language.
    box('Window_Lower_Mullion',(.019,.022,.279),(cx,-.936,.5315),cream,.004)
    box('Window_Fanlight_Transom',(.346,.022,.023),(cx,-.936,.674),cream,.004)
    for angle in (math.pi/4,math.pi/2,3*math.pi/4):
        stroke('Window_Fanlight_Radial',[(cx,-.934,.682),
            (cx+.169*math.cos(angle),-.934,.68+.169*math.sin(angle))],.006,cream)
    # Restrained inner brass accents, without painted reflections on the glass.
    box('Window_Mullion_Brass_Inlay',(.0035,.004,.251),(cx,-.949,.528),gold,.001)
    box('Window_Transom_Brass_Inlay',(.317,.004,.0035),(cx,-.949,.674),gold,.001)
    box('Window_Sill_Recessed_Apron',(.348,.028,.046),(cx,-.91,.335),cream,.006)
    box('Window_Sill_Brass_Line',(.342,.005,.004),(cx,-1.008,.372),gold,.001)
# Sapphire enamel plaque, fine continuous brass inset, centered chart relief.
box('Cipher_Logo_Cream_Mount',(.50,.043,.217),(0,-.928,1.105),cream,.025)
box('Cipher_Logo_Navy_Plaque',(.467,.027,.185),(0,-.959,1.105),navy,.021)
def rounded_rect(w,h,r):
    pts=[]
    for cx,cz,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),
                         (-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(17):
            a=math.radians(start+90*i/16)
            pts.append((cx+r*math.cos(a),-.975,1.105+cz+r*math.sin(a)))
    return pts+[pts[0]]
stroke('Cipher_Logo_Continuous_Brass_Border',rounded_rect(.438,.156,.020),.003,gold)
for x,h in [(-.105,.035),(-.032,.058),(.041,.082)]:
    box('Cipher_Logo_Chart_Bar',(.036,.012,h),(x,-.981,1.052+h/2),gold,.005)
# Single closed filled arrow: no intersecting tubular strokes or detached tips.
arrow=[(-.137,1.112),(-.071,1.146),(-.013,1.128),(.103,1.166),
       (.084,1.171),(.146,1.178),(.116,1.126),(.116,1.147),
       (-.011,1.108),(-.069,1.126),(-.131,1.095)]
extrude('Cipher_Logo_Single_Rising_Arrow',arrow,-.993,-.980,gold,.002)
scene=bpy.context.scene;scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ('MESH','CURVE','EMPTY') and not obj.name.startswith(('Preview_','Studio_')):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'CipherSecurities-detail-v3.glb'),export_format='GLB',
    use_selection=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
cam=scene.camera;scene.cycles.samples=40
for name,loc,target,scale in [
    ('front-right',(4,-6,3.5),(0,-.03,1.03),3.65),
    ('window-detail',(-1.5,-4,1.3),(-.77,-.94,.61),.78),
    ('logo-detail',(.3,-4,1.6),(0,-.965,1.105),.65)]:
    cam.location=loc;cam.data.ortho_scale=scale
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/(name+'.png'));bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'CipherSecurities-detail-v3.blend'))
(ROOT/'README.md').write_text('# 증권사 창문·로고 v3 시안\n\nP1 (Major) · ✅ 네이티브 3D 시안 제작 / ⏳ 사용자 외형 검수·게임 적용.\n\n파란 지붕·시계·양문은 v2를 유지한다. 창문은 황동 인레이·부채꼴 상부 창살·하부 세로살과 창턱 마감으로 정리했다. 로고는 남색 에나멜 바탕·연속 황동 테두리·세 개의 상승 막대와 단일 솔리드 화살표 부조다. 실제 모델 전체·창문·로고 확대 렌더를 제공하며 현재 게임의 v2는 교체하지 않았다.\n',encoding='utf-8')
