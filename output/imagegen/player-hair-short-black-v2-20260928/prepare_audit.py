from pathlib import Path
root=Path('C:/GitHub/StockWars/output/imagegen')
s=(root/'player-composite-review-20260928/audit.ps1').read_text(encoding='utf-8-sig')
s=s.replace('"$root/player-hair-short-black-20260928/hair_short_front_idle_down.png"\n)', '"$root/player-hair-short-black-v2-20260928/hair_short_front_idle_down_v3.png",\n "$root/player-hair-short-black-20260928/hair_short_front_idle_down.png"\n)')
s=s.replace("'face','hair_front')", "'face','hair_front_v2','hair_front_original')")
s=s.replace("$lines | Set-Content", "$lines+='upper scalp covered by new hair: '+[LayerAudit]::Covered($images[1],$images[6],320,243,902,440)\n$lines+='upper scalp covered by old hair: '+[LayerAudit]::Covered($images[1],$images[7],320,243,902,440)\n$lines | Set-Content")
s=s.replace('$sets=@(@(0,1,2,3,4,5,6),@(1,2,3,4,5),@(1,5),@(1,2,3))','$sets=@(@(0,1,2,3,4,5,7),@(0,1,2,3,4,5,6),@(0,1,5,7),@(0,1,5,6))')
s=s.replace("$titles=@('A  Original full stack','B  Hair hidden','C  Body + face','D  Body + shorts + shoes')", "$titles=@('A  Before','B  Hair adjusted','C  Before - body + face + hair','D  After - body + face + hair')")
Path(__file__).with_name('audit.ps1').write_text(s,encoding='utf-8-sig')
