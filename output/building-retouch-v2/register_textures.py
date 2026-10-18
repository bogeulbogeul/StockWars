"""Register ImageGen edits to unchanged source UV coordinates, protect details."""
import sys,pathlib,json
ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'runtime'))
import cv2,numpy as np
SRC=ROOT.parent/'building-retouch-v1'
GEN=pathlib.Path('C:/Users/bogeu/.codex/generated_images/01a14e70-80f5-7ec1-b269-fd22033bebfe')
FILES={
 'FinanceBuilding':'exec-66cfffe3-316c-42d0-9108-ff9ed89e2086.png',
 'FunitueStoreBuilding':'exec-cb22a1f3-f77c-431a-979e-051a7bcbcf23.png',
 'StoreBuilding':'exec-a2ae07cd-a69c-4dd7-bb08-014f94ac52b8.png',
 'InformationBuilding':'exec-8c66703f-0a60-4d3c-8bc3-f9c059c966bf.png',
 'HomeBuilding':'exec-984fdeed-8a7c-4c37-9182-136470e35287.png'}
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
    cv2.imwrite(str(ROOT/(name+'-basecolor.png')),result)
    metrics.append({'model':name,'size':[w,h],'changed_pixels':int(np.any(result!=source,axis=2).sum()),'protected_edge_pixels':int(protected.sum()),'mean_registration_pixels':float(np.linalg.norm(flow,axis=2).mean())})
    print(name,metrics[-1],flush=True)
(ROOT/'texture-registration.json').write_text(json.dumps(metrics,indent=2))
