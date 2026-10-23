import numpy as np


def smooth_connection(bm,group_layer,body_group,normal_layer,source,skin_index):
    """Continue original torso cross sections across the concealed arm sockets."""
    fits=[]
    for z in np.linspace(-.52,-.13,80):
        candidates=source[(np.abs(source[:,2]-z)<.009)&(np.abs(source[:,0])<.36)&(np.abs(source[:,1])>.10)]
        if len(candidates)<15:continue
        y=candidates[:,1];design=np.column_stack((np.ones(len(y)),y,y*y))
        coeff=np.linalg.lstsq(design,candidates[:,0]**2,rcond=None)[0]
        if coeff[2]<0:fits.append((z,coeff))
    heights=np.array([f[0] for f in fits]);coefficients=np.array([f[1] for f in fits])
    for j in range(3):coefficients[:,j]=np.convolve(np.pad(coefficients[:,j],(3,3),mode='edge'),np.ones(7)/7,mode='valid')
    changed=[]
    for v in bm.verts:
        if v[group_layer].get(body_group,0)<.999:continue
        x,y,z=v.co
        az=abs((z+.335)/.155);ay=abs(y/.17)
        if az>=1 or ay>=1 or abs(x)<.18:continue
        coeff=np.array([np.interp(z,heights,coefficients[:,j]) for j in range(3)])
        target=np.sqrt(max(.001,coeff[0]+coeff[1]*y+coeff[2]*y*y))
        target=np.copysign(target,x)
        fade=lambda t:1-(np.clip((t-.55)/.45,0,1)**2)*(3-2*np.clip((t-.55)/.45,0,1))
        weight=fade(az)*fade(ay)
        v.co.x+=np.clip(target-x,-.045,.045)*weight
        if all(f.material_index==skin_index for f in v.link_faces):v.co.x-=np.copysign(.0007*weight,x)
        changed.append((v,weight))
    bm.normal_update()
    for v,weight in changed:
        for loop in v.link_loops:
            old=loop[normal_layer]
            if old.length>0:loop[normal_layer]=old.lerp(v.normal,weight).normalized()
    return len(changed)
