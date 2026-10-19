"""Extract exact representative pixels from manually inspected interior regions."""
from collections import Counter
from pathlib import Path
import csv
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent
source = root / 'design-sheet.png'
image = Image.open(source).convert('RGB')
# Original image coordinates, not the enlarged inspection image.
samples = [
    ('털', '이마 기본색', 220, 217),
    ('털', '정수리 털', 224, 184),
    ('털', '볼 바깥 기본색', 113, 280),
    ('털', '볼 털 그림자', 113, 294),
    ('털', '팔 기본색', 293, 436),
    ('털', '팔 안쪽 털', 157, 420),
    ('털', '허벅지 기본색', 170, 530),
    ('털', '허벅지 안쪽 털', 198, 517),
    ('털', '무릎 접힘 그림자', 158, 551),
    ('귀', '귀 바깥 기본색', 116, 198),
    ('귀', '귀 안쪽 주황색', 160, 188),
    ('크림색', '눈썹', 184, 232),
    ('크림색', '콧등', 219, 288),
    ('크림색', '볼', 146, 323),
    ('크림색', '입 아래', 220, 343),
    ('크림색', '가슴', 220, 393),
    ('크림색', '가슴 털 끝', 190, 424),
    ('크림색', '목 아래 복숭아색 그림자', 220, 363),
    ('크림색', '배 기본색', 220, 458),
    ('크림색', '배 아래 그림자', 220, 504),
    ('크림색', '앞발 기본색', 122, 475),
    ('크림색', '뒷발 기본색', 155, 590),
    ('크림색', '뒷발 아래쪽', 155, 610),
    ('눈', '흰자', 157, 280),
    ('눈', '흰자 위쪽 그림자', 162, 263),
    ('눈', '홍채 위쪽 짙은 갈색', 173, 273),
    ('눈', '홍채 아래쪽 밝은 갈색', 177, 293),
    ('눈', '동공', 181, 282),
    ('눈', '반사광', 183, 269),
    ('눈', '윗눈꺼풀 윤곽선', 164, 258),
    ('코', '윗면 밝은 갈색', 219, 306),
    ('코', '중앙 기본색', 220, 312),
    ('코', '콧구멍', 212, 314),
    ('선', '검은 외곽선', 84, 194),
    ('꼬리', '황금색 기본 털', 93, 434),
    ('꼬리', '털 그림자', 105, 458),
    ('꼬리', '크림색 끝', 100, 386),
    ('표정', '혀 기본색', 471, 908),
    ('표정', '혀 위쪽 그림자', 467, 901),
    ('표정', '입안', 473, 893),
]
records = []
for group, part, x, y in samples:
    roi = [x - 2, y - 2, x + 3, y + 3]
    counts = Counter(image.crop(roi).get_flattened_data())
    rgb, count = counts.most_common(1)[0]
    records.append(dict(group=group, part=part, rgb=list(rgb),
                        hex='#%02X%02X%02X' % rgb, roi=roi,
                        exact_pixel_count=count, sample_pixels=25))
data = dict(source=source.name, sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
            method='Exact RGB mode in manually inspected 5x5 interior regions; ties use first raster occurrence. No quantization or color correction.',
            note='Local representative colors, not an adopted uniform palette. Highlights/shadows are visual region labels; generated art contains continuous color variation.',
            colors=records)
(root / 'colors-detailed.json').write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
with (root / 'colors-detailed.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['분류', '부위', 'R', 'G', 'B', 'HEX', '추출영역'])
    for row in records:
        writer.writerow([row['group'], row['part'], *row['rgb'], row['hex'], row['roi']])
for row in records:
    print(row['group'], row['part'], row['rgb'], row['hex'])
