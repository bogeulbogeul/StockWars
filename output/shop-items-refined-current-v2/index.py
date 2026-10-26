"""Inventory the twelve refined native products; no deployment or file replacement."""
from pathlib import Path
import json,hashlib
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
products=[
('item_honey_cookie','꿀 쿠키','honey-cookie-reference-v2'),
('item_petal_tea','꽃잎 차','petal-tea-seal-end-v4'),
('item_apple_juice','사과 주스','apple-juice-clean-label-v3'),
('item_popori_bread','포포리빵','popori-bread-reference-ends-v5'),
('item_berry_juice','꽃꿀 베리 주스','berry-juice-reference-v2'),
('item_herb_tea','허브 차','herb-tea-paperbox-v2'),
('item_dew_jelly','이슬 젤리','dew-jelly-reference-v2'),
('item_honey_candy','꽃꿀사탕','honey-candy-reference-v2'),
('item_crypto_decoder','별가루','star-moon-powders-v2'),
('item_moon_powder','달가루','star-moon-powders-v2'),
('item_lotto_ticket','복권','lotto-paper-ticket-v2'),
('item_premium_rumor','봉인된 소식 봉투','sealed-news-envelope-v2')]
entries=[];rows=[]
for item,name,folder in products:
    p=ROOT/'output'/folder/(item+'.glb');assert p.is_file(),p
    validation=json.loads((p.parent/'validation.json').read_text(encoding='utf8'))
    if isinstance(validation,list):validation=next(v for v in validation if v['id']==item)
    sha=hashlib.sha256(p.read_bytes()).hexdigest();assert sha==validation['sha256'],item
    entries.append(dict(id=item,name=name,path=p.relative_to(ROOT).as_posix(),sha256=sha,validation=(p.parent/'validation.json').relative_to(ROOT).as_posix(),deployed=False))
    rows.append(f'| {name} | [{item}.glb](../{folder}/{item}.glb) | [렌더·원본·검증](../{folder}/README.md) |')
(OUT/'manifest.json').write_text(json.dumps(dict(date='2026-10-25',count=12,status='assets_only_not_deployed',products=entries),ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'README.md').write_text('# 상점 상품 12종 — 개별 수정본 목록\n\n2026-10-25. 사용자 피드백을 순서대로 반영한 최신 개별 제작본이다. 파일별 SHA-256이 실제 재수입 검증 기록과 일치함을 확인했다. 기존 일괄 제작본은 이력으로 보존한다.\n\n**3D 에셋 제작 완료이며 게임 적용·사용자 최종 외형/플레이 검수는 별도다.** 이 목록은 게임 파일·가격·저장·기능을 변경하지 않는다.\n\n| 상품 | 개별 GLB | 원본과 검증 |\n| --- | --- | --- |\n'+'\n'.join(rows)+'\n\n[기계 판독용 파일·해시 목록](manifest.json). `index.py`로 존재·검증 해시를 다시 대조할 수 있다.\n',encoding='utf8')
print('Verified current inventory:',len(entries),'products')
