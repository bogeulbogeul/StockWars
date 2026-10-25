from pathlib import Path
from copy import deepcopy
from docx import Document
p=Path('output/opening-dialogue-v1/포포리_마을_초반_대사집_v1.docx')
d=Document(p)
ps=d.paragraphs
idx=next(i for i,x in enumerate(ps) if x.text.startswith('4 ') and '안내소' in x.text)
anchor=ps[idx]._p
styles={}
for x in ps[:idx]:
    t=x.text
    key='chapter' if t[:1].isdigit() and ' ' in t else 'heading' if x.style.name.startswith('Heading') else 'body'
    styles.setdefault(key,deepcopy(x._p))
base=next(x for x in ps if x.text.startswith('모아  '))
text=Path('web/assets/exhibition/opening.txt').read_text(encoding='utf-8').split('## 4 안내소')[0]
for x in ps[:idx]: x._p.getparent().remove(x._p)
for line in text.splitlines():
    prefix='## ' if line.startswith('## ') else '### ' if line.startswith('### ') else '# ' if line.startswith('# ') else ''
    key='chapter' if prefix=='## ' else 'heading' if prefix=='### ' else 'body'
    node=deepcopy(styles.get(key,base._p)); anchor.addprevious(node)
    from docx.text.paragraph import Paragraph
    para=Paragraph(node,base._parent); para.text=line[len(prefix):]
    if prefix=='# ': para.style='Title'
    elif prefix=='## ': para.style='Heading 1'
    elif prefix=='### ': para.style='Heading 2'
    else: para.style='Normal'
d.save(p)
print('Word updated:',p)

