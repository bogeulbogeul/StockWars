"""Sample exact source RGB values from visually inspected interior regions."""
from collections import Counter
from pathlib import Path
import csv
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent
source = root / 'design-sheet.png'
image = Image.open(source).convert('RGB')
samples = [
    ('털', '정면 이마 기본색', 210, 238),
    ('털', '정수리', 210, 214),
    ('털', '오른쪽 볼', 287, 321),
    ('털', '왼쪽 볼 명암', 128, 324),
    ('털', '주둥이', 211, 339),
    ('털', '가슴 털', 210, 389),
    ('털', '배 중앙', 210, 447),
    ('털', '배 아래 그림자', 210, 485),
    ('털', '오른팔 기본색', 294, 442),
    ('털', '왼팔 기본색', 144, 432),
    ('털', '앞발', 299, 481),
    ('털', '왼 허벅지', 177, 523),
    ('털', '오른 허벅지', 246, 521),
    ('털', '무릎 접힘 그림자', 165, 552),
    ('털', '뒷발 윗면', 156, 587),
    ('털', '뒷발 아래쪽', 156, 609),
    ('털', '측면 몸통', 970, 436),
    ('털', '뒤 머리', 1327, 268),
    ('털', '뒤 몸통', 1317, 415),
    ('귀', '귀 바깥 털', 136, 195),
    ('귀', '안쪽 귀 상부', 132, 181),
    ('귀', '안쪽 귀 중앙', 140, 211),
    ('귀', '안쪽 귀 하부', 119, 229),
    ('귀', '오른 귀 안쪽', 292, 210),
    ('눈', '눈썹', 170, 247),
    ('눈', '왼 흰자', 154, 296),
    ('눈', '흰자 위 그림자', 153, 280),
    ('눈', '왼 홍채 상부', 166, 286),
    ('눈', '왼 홍채 하부', 169, 310),
    ('눈', '오른 홍채 하부', 248, 309),
    ('눈', '동공', 183, 296),
    ('눈', '반사광', 176, 289),
    ('눈', '윗눈꺼풀', 166, 276),
    ('코', '윗면', 212, 320),
    ('코', '중앙', 213, 324),
    ('선', '귀 바깥 윤곽선', 105, 190),
    ('선', '입 곡선', 201, 338),
    ('꼬리', '상부 털', 88, 373),
    ('꼬리', '중앙 털', 58, 417),
    ('꼬리', '아래 그림자', 66, 459),
    ('표정', '혀 기본색', 470, 904),
    ('표정', '혀 위쪽', 470, 898),
    ('표정', '입안', 457, 887),
    ('색상표', '털색 견본', 1014, 825),
    ('색상표', '안쪽 귀 견본', 1122, 825),
    ('색상표', '눈 견본', 1228, 825),
    ('색상표', '코 견본', 1337, 825),
    ('색상표', '윤곽선 견본', 1445, 825),
]
records = []
for group, part, x, y in samples:
    roi = [x - 2, y - 2, x + 3, y + 3]
    counts = Counter(image.crop(roi).get_flattened_data())
    rgb, count = counts.most_common(1)[0]
    records.append(dict(group=group, part=part, rgb=list(rgb),
                        hex='#%02X%02X%02X' % rgb, roi=roi,
                        exact_pixel_count=count, sample_pixels=25))
data = dict(source=source.name,
            sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
            image_size=list(image.size),
            method='Exact RGB mode in visually inspected 5x5 interior regions; ties use first raster occurrence. No quantization or correction.',
            note='Local representative source colors, not a uniform adopted palette or all unique image colors. Generated shading varies continuously. Swatches and actual body colors are recorded separately.',
            colors=records)
(root / 'colors-detailed.json').write_text(
    json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
with (root / 'colors-detailed.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['분류', '부위', 'R', 'G', 'B', 'HEX', '추출영역'])
    for row in records:
        writer.writerow([row['group'], row['part'], *row['rgb'], row['hex'], row['roi']])
assert all(tuple(row['rgb']) in image.crop(row['roi']).get_flattened_data() for row in records)
print(json.dumps(dict(entries=len(records), unique_rgb=len({tuple(r['rgb']) for r in records}),
                     colors=[{k: r[k] for k in ('part', 'rgb', 'hex')} for r in records]),
                 ensure_ascii=False))
