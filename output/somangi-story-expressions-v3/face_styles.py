import numpy as np

STYLES=[
 ('smile','기본 미소','평소 대화·첫 인사'),
 ('happy','기쁨','반가운 소식·즐거운 순간'),
 ('neutral','차분함','설명을 듣거나 일상 대화'),
 ('curious','궁금함','마을 구경·새 물건을 발견할 때'),
 ('surprised','놀람','예상하지 못한 말·새로운 발견'),
 ('worried','걱정','처음 하는 알바·불확실한 선택'),
 ('sad','시무룩','실수·아쉬움·작은 좌절'),
 ('teary','울먹임','속상한 일·위로가 필요한 순간'),
 ('pout','삐침','가벼운 불만·장난스러운 대화'),
 ('determined','결심','해볼게·새로운 도전'),
 ('shy','쑥스러움','칭찬이나 감사 인사를 받을 때'),
 ('proud','뿌듯함','포장 완료·처음 번 보수'),
 ('relieved','안도','도움받은 뒤·긴장이 풀릴 때'),
 ('touched','감동','따뜻한 배려·고마운 마음'),
 ('sleepy','졸림','첫날 귀가·취침 직전'),
 ('delicious','맛있음','꿀 쿠키·음식을 맛보는 순간'),
]

def paint(points,style):
 x,z=points.T;ink=np.zeros(len(points));blush=np.zeros(len(points));tear=np.zeros(len(points))
 def ellipse(cx,cy,rx,ry):
  return np.clip((1-np.sqrt(((x-cx)/rx)**2+((z-cy)/ry)**2))/.055+.5,0,1)
 def stroke(cx,cy,half,curve=0,slope=0,width=.008):
  t=np.clip((x-cx)/half,-1,1)
  px=cx+half*t;pz=cy+curve*(1-t*t)+slope*t
  d=np.sqrt((x-px)**2+(z-pz)**2)
  return np.clip((width-d)/.002+.5,0,1)
 def eye_arc(cx,cy,half,lift,width=.0145):
  # Distance to a circular arc, including its round caps. Using the actual
  # closest point keeps the thickness constant at the ends as well as the apex.
  height=abs(lift);radius=(half*half+height*height)/(2*height)
  center=cy+height-radius
  zz=z if lift>0 else 2*cy-z
  limit=2*np.arctan(height/half)
  angle=np.clip(np.arctan2(x-cx,zz-center),-limit,limit)
  px=cx+radius*np.sin(angle);pz=center+radius*np.cos(angle)
  distance=np.sqrt((x-px)**2+(zz-pz)**2)
  return np.clip((width-distance)/.002+.5,0,1)
 def add(v):
  nonlocal ink;ink=np.maximum(ink,v)
 keep_eyes=style in ['smile','neutral','curious','worried','determined','touched']
 keep_mouth=style in ['smile','happy','shy','proud','relieved','touched']
 for side,cx in [(-1,-.219),(1,.203)]:
  if style in ['happy','shy','proud','delicious']:
   lift={'happy':.026,'shy':.020,'proud':.014,'delicious':.028}[style]
   half={'happy':.059,'shy':.050,'proud':.065,'delicious':.059}[style]
   level=.338 if style=='shy' else .348
   add(eye_arc(cx,level,half,lift))
  elif style=='relieved':add(eye_arc(cx,.375,.055,-.018))
  elif style=='surprised':add(ellipse(cx,.367,.040,.064))
  elif style=='teary':
   add(ellipse(cx,.352,.038,.055));tear=np.maximum(tear,ellipse(cx-side*.012,.270,.010,.025))
  elif style=='sad':add(stroke(cx,.348,.052,-.015,slope=side*.016,width=.014))
  elif style=='pout':add(stroke(cx,.354,.050,0,slope=side*.020,width=.015))
  elif style=='sleepy':add(stroke(cx,.350,.053,-.006,width=.014))
  if style in ['worried','sad','teary']:
   add(stroke(cx,.452,.054,.004,slope=-side*.021,width=.005))
  if style=='determined':add(stroke(cx,.450,.052,0,slope=side*.022,width=.0055))
  if style=='curious':add(stroke(cx,.465 if side<0 else .439,.052,.012,width=.0045))
  if style in ['shy','proud','touched','delicious']:
   strength={'shy':.58,'proud':.08,'touched':.22,'delicious':.22}[style]
   spread=.057 if style=='shy' else .045
   blush=np.maximum(blush,np.exp(-((x-(cx+side*.055))/spread)**2-((z-.277)/.024)**2)*strength)
 if style=='neutral':add(stroke(-.008,.275,.041,width=.0065))
 if style=='curious':add(ellipse(-.008,.278,.018,.022))
 if style=='surprised':add(ellipse(-.008,.275,.031,.039))
 if style in ['worried','sad','teary']:add(stroke(-.008,.254,.062,.021,width=.0065))
 if style=='pout':add(stroke(-.008,.268,.028,width=.008))
 if style=='determined':add(stroke(-.008,.273,.044,width=.0075))
 if style=='sleepy':add(stroke(-.008,.271,.035,.002,width=.006))
 if style=='delicious':add(ellipse(-.008,.274,.024,.017))
 if style=='touched':tear=np.maximum(tear,ellipse(.242,.275,.008,.018))
 return ink,blush,tear,keep_eyes,keep_mouth
