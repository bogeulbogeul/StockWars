from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'web/css/modules/rumor-letter.css'
text = path.read_text(encoding='utf-8')
colors = {
    '--letter-plum': '--letter-olive', '#71344f': '#4c6237', '#ef812a': '#657f43',
    '#20243e': '#513e25', '#452c42': '#6b5031', '#1e14265c': '#332b205c',
    'rgba(31, 26, 42, .66)': 'rgba(44, 41, 29, .55)', '#302239': '#594528',
    '#f4d7bd': '#e7dfbd', '#63354a': '#51663b', '#442c3c': '#55432c',
    '#704155': '#506239', '#b98f9d': '#a8b188', '#724055': '#51663b',
    '#302d3d': '#503f2b', '#6b3d50': '#51663b', '#e4d1c4': '#dce3c5',
    '#37283a': '#fff8e5', '#633447': '#44512f', '#a94c29': '#3c4d29',
    '#ff9d4c': '#788f52', '#f5e5dc': '#edf0dc', '#d7b7bb': '#bdc69b',
    '#ebd4cf': '#dce4c2', '#383044': '#503f2b', '#caa6ae': '#adb990',
    '#e4c9c8': '#dce2c7', '#ffe9ce': '#f0f4db', '#8d5068': '#6c8050',
    '#655966': '#665b42', '#745569': '#53663c', '#b88e9b': '#9fac7c',
    '#864a68': '#647d43', '#efd8bd': '#e1e8c8'
}
for old, new in colors.items():
    text = text.replace(old, new)
text = text.replace('/* Letter palette sampled visually from the sealed news-envelope item. */',
    '/* Current shop artwork: paper-v4/sealed-news.svg — cream, olive wax, warm brown. */')
path.write_text(text, encoding='utf-8')
