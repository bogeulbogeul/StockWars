import json
from pathlib import Path
from PIL import Image
root=Path(__file__).parent
im=Image.open(root/'run/frames/down_idle/frame-0.png').convert('RGBA')
box=im.getchannel('A').point(lambda v:255 if v>=128 else 0).getbbox()
height=box[3]-box[1]
data={'reference':'run/frames/down_idle/frame-0.png','targetStandingHeight':90,'referenceAlphaBox':list(box),'referenceStandingHeight':height,'uniformScale':90/height,'groundY':box[3],'policy':'Single uniform scale for ALL states. Never fit each seated or walking frame to90. Camera zoom is separate.'}
(root/'scale.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
print(json.dumps(data))
