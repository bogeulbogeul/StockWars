"""Register ImageGen edits to unchanged source UV coordinates, protect details."""
import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'building-retouch-v2'/'runtime'))
import cv2,numpy as np
SRC=ROOT
GEN=pathlib.Path('C:/Users/bogeu/.codex/generated_images/01a14e70-80f5-7ec1-b269-fd22033bebfe')
FILES={'BigTree':'exec-c4e2bb5b-9fc3-4bef-ba47-66f78451af0f.png'}
metrics=[]
for name,filename in FILES.items():
    source=cv2.imread(str(SRC/(name+'-texture-0.png')))
    edit=cv2.imread(str(GEN/filename))
    cv2.imwrite(str(ROOT/(name+'-imagegen.png')),edit)
    h,w=source.shape[:2]; edit=cv2.resize(edit,(w,h),interpolation=cv2.INTER_CUBIC)
    # Dense optical registration transfers the generated cleanup, not its UV shifts.
    a=cv2.resize(source,(1024,1024)); b=cv2.resize(edit,(1024,1024))
    gray_a=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY); gray_b=cv2.cvtColor(b,cv2.COLOR_BGR2GRAY)
    dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    dis.setFinestScale(0); dis.setGradientDescentIterations(64)
    flow=dis.calc(gray_a,gray_b,None)
    flow=cv2.resize(flow,(w,h))*np.array([w/1024,h/1024],dtype=np.float32)
    hsv=cv2.cvtColor(source,cv2.COLOR_BGR2HSV)
    missing=(hsv[:,:,1]<75)&(hsv[:,:,2]>180)&(source[:,:,0]>125)
    # Missing paint has no reliable optical correspondence; use nearby valid UV flow.
    for channel in range(2):
        flow[:,:,channel]=cv2.inpaint(flow[:,:,channel].copy(),missing.astype(np.uint8),5,cv2.INPAINT_NS)
    yy,xx=np.mgrid[:h,:w].astype(np.float32)
    aligned=cv2.remap(edit,xx+flow[:,:,0],yy+flow[:,:,1],cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
    # Keep original pigment boundaries and fine clock/sign edges pixel-exact.
    lab=cv2.cvtColor(source,cv2.COLOR_BGR2LAB).astype(np.float32)
    grad=np.sqrt(np.sum(cv2.Sobel(lab,cv2.CV_32F,1,0)**2+cv2.Sobel(lab,cv2.CV_32F,0,1)**2,axis=2))
    protected=cv2.dilate((grad>100).astype(np.uint8),np.ones((3,3),np.uint8))
    old=source.astype(np.float32); new=aligned.astype(np.float32)
    difference=np.linalg.norm(old-new,axis=2)
    trust=np.clip((95-difference)/50,0,1)*(1-protected)*.78
    # Avoid baking a global palette change into the edited texture.
    # Transfer pigment cleanup without introducing newly generated cracks or grain.
    old_lab=cv2.cvtColor(source,cv2.COLOR_BGR2LAB).astype(np.float32)
    new_lab=cv2.cvtColor(aligned,cv2.COLOR_BGR2LAB).astype(np.float32)
    delta=cv2.GaussianBlur(new_lab-old_lab,(0,0),3)
    delta[:,:,0]*=.25
    retouched_lab=np.clip(old_lab+delta*trust[:,:,None],0,255).astype(np.uint8)
    retouched=cv2.cvtColor(retouched_lab,cv2.COLOR_LAB2BGR).astype(np.float32)
    correction=np.clip(retouched-old,-24,24)
    result=np.clip(old+correction,0,255).astype(np.uint8)
    result[protected.astype(bool)]=source[protected.astype(bool)]
    # Full ImageGen bark fill is needed here: a conservative color delta would leave white.
    result[missing]=aligned[missing]
    remaining=(cv2.cvtColor(result,cv2.COLOR_BGR2HSV)[:,:,1]<75)&(result.max(axis=2)>180)&missing
    # Extend valid generated brown pigment across any residual unpainted border samples.
    bark=(result[:,:,2]>result[:,:,1]*1.1)&(result[:,:,1]>result[:,:,0]*1.15)&(~remaining)
    if remaining.any():
        _,labels=cv2.distanceTransformWithLabels((~bark).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
        valid=result[bark]
        result[remaining]=valid[labels[remaining]-1]
    print('Missing paint repaired:',int(missing.sum()),flush=True)
    cv2.imwrite(str(ROOT/(name+'-basecolor.png')),result)
    metrics.append({'model':name,'size':[w,h],'changed_pixels':int(np.any(result!=source,axis=2).sum()),'protected_edge_pixels':int(protected.sum()),'mean_registration_pixels':float(np.linalg.norm(flow,axis=2).mean())})
    print(name,metrics[-1],flush=True)
(ROOT/'texture-registration.json').write_text(json.dumps(metrics,indent=2))
