from pathlib import Path
P=Path(__file__).resolve().parent
exec(compile((P.parent/'somangi-bench-sit-v1/check_scene.py').read_text(),str(P/'check_scene.py'),'exec'))
