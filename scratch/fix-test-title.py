from pathlib import Path
p=Path('scratch/check-shop-items-rollout.cjs');s=p.read_text();s=s.replace("console.log('game ready');", "console.log('game ready');await p.evaluate(()=>{document.querySelector('.crayon-title')?.remove();document.body.classList.remove('title-screen-active');document.getElementById('app').inert=false;});")
p.write_text(s)
