"""Small horizontal oak dispensing barrel, stand and metal tap."""
import bpy
import math
from exterior_geometry import material, box, extrude, disk, stroke, finish

def build_barrel():
    x0,y0,z0=-2.73,1.84,1.49
    length=.68
    woods=[material('Keg_Oak_'+str(i),c,.65) for i,c in enumerate([
        (.27,.125,.044),(.31,.15,.055),(.245,.105,.035),(.29,.132,.046)])]
    iron=material('Keg_Dark_Iron',(.035,.040,.042),.55)
    metal=material('Keg_Tap_Steel',(.36,.40,.41),.30)
    metal.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.75
    stand=material('Keg_Stand_Oak',(.15,.063,.023),.72)
    def radius(t):return .26+.045*math.sin(math.pi*t)
    # Closed staves follow the barrel's bulging profile, with fine true seams.
    for stave in range(20):
        angles=[2*math.pi*(stave+j/5)/20+.0015 for j in range(6)]
        vertices=[]
        for inner in [False,True]:
            for ring in range(17):
                t=ring/16
                r=radius(t)-(.018 if inner else 0)
                for a in angles:
                    vertices.append((x0+r*math.cos(a),y0-length/2+length*t,z0+r*math.sin(a)))
        n=17*6
        faces=[]
        for ring in range(16):
            for j in range(5):
                a=ring*6+j
                faces.extend([(a,a+1,a+7,a+6),(n+a,n+a+6,n+a+7,n+a+1)])
            for j in [0,5]:
                a=ring*6+j
                faces.append((a,a+6,n+a+6,n+a))
        for ring in [0,16]:
            for j in range(5):
                a=ring*6+j
                faces.append((a,n+a,n+a+1,a+1))
        mesh=bpy.data.meshes.new('Keg_Stave')
        mesh.from_pydata(vertices,[],faces)
        obj=bpy.data.objects.new('Keg_Stave',mesh)
        bpy.context.collection.objects.link(obj)
        finish(obj,woods[stave%4],0)
    # Front wooden head, slightly inside the surrounding staves.
    disk('Keg_Front_Head',x0,y0-length/2+.008,z0,.249,.025,woods[1])
    disk('Keg_Back_Head',x0,y0+length/2-.008,z0,.249,.025,woods[1])
    for t in [.08,.28,.72,.92]:
        r=radius(t)+.007
        bpy.ops.mesh.primitive_torus_add(major_radius=r-.008,minor_radius=.012,
            major_segments=64,minor_segments=8,location=(x0,y0-length/2+t*length,z0),
            rotation=(math.pi/2,0,0))
        band=bpy.context.object
        band.name='Keg_Iron_Hoop'
        band.scale.z=2.6
        finish(band,iron,0)
    for y in [1.61,2.06]:
        # Low saddle beneath the belly, rather than tall prongs around its sides.
        support_radius=.26+.045*math.sin(math.pi*((y-(y0-length/2))/length))
        contour=[(x0-.24,1.08),(x0+.24,1.08),(x0+.24,1.16),(x0+.18,1.22)]
        contour += [(x0+.18-.36*i/48,
                     z0-math.sqrt(max(0,support_radius**2-(.18-.36*i/48)**2))+.003)
                    for i in range(49)]
        contour += [(x0-.24,1.16)]
        extrude('Keg_Curved_Cradle',contour,y-.055,y+.055,stand,.009)
    for x in [x0-.23,x0+.23]:
        box('Keg_Stand_Rail',(.07,.65,.06),(x,1.84,1.10),stand,.012)
    # A connected steel dispensing tap faces the guest side of the counter.
    disk('Keg_Tap_Mount',x0,1.475,1.39,.047,.035,metal)
    # One continuous neck/elbow replaces intersecting cylindrical bars.
    path=[(x0,1.475,1.39),(x0,1.345,1.39)]
    path += [(x0,1.345-.030*math.sin(math.pi/2*i/24),
              1.36+.030*math.cos(math.pi/2*i/24)) for i in range(1,25)]
    path.append((x0,1.315,1.315))
    spout=stroke('Keg_Tap_Smooth_Spout',path,.020,metal)
    spout.data.bevel_resolution=5
    # Rounded valve cap and a short paddle lever, seated directly on the body.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=.025,
        location=(x0,1.354,1.402))
    finish(bpy.context.object,metal,0).name='Keg_Tap_Valve_Cap'
    box('Keg_Tap_Paddle',(.065,.025,.014),(x0+.023,1.354,1.427),metal,.006)
    # Thin annular outlet rim with a dark inset, rather than a solid flat end.
    bpy.ops.mesh.primitive_torus_add(major_radius=.017,minor_radius=.003,
        major_segments=32,minor_segments=8,location=(x0,1.315,1.315))
    finish(bpy.context.object,metal,0).name='Keg_Tap_Outlet_Rim'
    dark=material('Keg_Tap_Outlet_Interior',(.025,.030,.032),.65)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.015,depth=.002,
        location=(x0,1.315,1.3135))
    finish(bpy.context.object,dark,0).name='Keg_Tap_Outlet_Inset'
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.035,
        location=(x0,1.84,1.822))
    obj=bpy.context.object
    obj.name='Keg_Top_Bung'
    obj.scale.z=.55
    finish(obj,stand,0)
