import json
import struct
from pathlib import Path
from PIL import Image

out = Path('C:/GitHub/StockWars/output/cipher-exterior-clock-v1')
data = (out / 'CipherSecurities-clock.glb').read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
doc = json.loads(data[20:20+length])
channels = [c for a in doc['animations'] for c in a['channels']]
animated = {doc['nodes'][c['target']['node']]['name'] for c in channels
            if c['target']['path'] == 'rotation'}
assert {'Clock_Hour', 'Clock_Minute'} <= animated
images = [Image.open(out / f'preview-{i:02}.png').convert('RGB') for i in range(48)]
images[0].save(out / 'clock-motion.gif', save_all=True, append_images=images[1:], duration=125, loop=0)
(out / 'validation.json').write_text(json.dumps({'result':'PASS',
    'animated_hands':sorted(animated), 'animation_clips':len(doc['animations']),
    'preview_frames':len(images)}, indent=2))
print('PASS: exported hour/minute rotation tracks and 48-frame GIF')
