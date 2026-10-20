"""Audit both dining chair gaps with the adopted animated sideways walk."""
from pathlib import Path
root=Path(__file__).resolve().parent
source=(root.parent/'pub-furniture-height-check-v1'/'check_passage.py').read_text(encoding='utf-8')
setup=source.split('def audit(y,samples):')[0]
setup=setup.replace("('Bar_Counter_','Counter_Front_','Stool_')",
                    "('Table_','Dining_Chair_','Side_Wall','Continuous_')")
exec(compile(setup,str(__file__),'exec'))
results=[]
for lane in [-1,1]:
    hits=[]
    y=-1.88+lane*.9075
    for i in range(97):
        distance=1.70*i/96
        phase=(distance/.135)%1
        scene.frame_set(1+int(phase*24),subframe=(phase*24)%1)
        wrapper.location.x=1.65+distance
        wrapper.location.y=y
        bpy.context.view_layer.update()
        vertices,faces=character_mesh()
        moving=BVHTree.FromPolygons(vertices,faces)
        bounds=tuple((min(v[k] for v in vertices),max(v[k] for v in vertices)) for k in range(3))
        for name,fixed,box in static:
            if any(bounds[k][1]<box[k][0] or bounds[k][0]>box[k][1] for k in range(3)):continue
            if moving.overlap(fixed):hits.append({'sample':i,'object':name})
    results.append({'lane_y':y,'samples':97,'intersections':len(hits),'hits':hits[:20]})
report={'motion':'Crab_Left v4','character_height':1.0,'clear_gap':.615,
        'runtime':'model audit only; pub gameplay integration pending','results':results}
(root/'dining-passage-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('DINING_PASSAGE:',json.dumps(report))
assert all(r['intersections']==0 for r in results),report
