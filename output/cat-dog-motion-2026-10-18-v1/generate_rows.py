"""Canonical single-row gen calls with additional explicit dog motion references."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent
cli = 'C:/Users/bogeu/.codex/skills/sprite-gen/.venv/Scripts/sprite-gen.exe'
run = root/'run'
states = sys.argv[1:] or ['right_walk']
(run/'reports').mkdir(exist_ok=True)
def generate(state):
    out = run/'raw'/f'{state}.png'
    if out.exists():
        print(state, 'already generated', flush=True)
        return
    command = [cli,'gen','--provider','codex','--prompt-file',str(run/'prompts'/f'{state}.txt'),
        '--ref',str(root/'references/cat-front.png'),
        '--ref',str(root.parent/'cat-design-2026-10-18-v1/design-sheet.png'),
        '--ref',str(root/'references'/f'dog-{state}.png'),
        '--ref',str(run/'references/layout-guides'/f'{state}.png'),
        '--out',str(out),'--report',str(run/'reports'/f'gen-{state}.json')]
    result = subprocess.run(command, capture_output=True, text=True, encoding='utf-8')
    (root/f'generation-{state}.log').write_text(result.stdout+'\n'+result.stderr, encoding='utf-8')
    print(state, 'OK' if result.returncode==0 else result.stderr[-1500:],flush=True)
    if result.returncode:
        raise RuntimeError(state)
with ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(generate, states))
