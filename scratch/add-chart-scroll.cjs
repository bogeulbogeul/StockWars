const fs=require('fs'),p='web/js/components/phone/stock/StockChart.js';let s=fs.readFileSync(p,'utf8');
s=s.replaceAll('36 + s.index / Math.max(1, samples.length - 1) * 280','54 + s.index / Math.max(1, samples.length - 1) * 846');
s=s.replace('<svg class="stock-chart','<div class="stock-chart-scroll" tabindex="0" role="region" aria-label="주가 차트 좌우 스크롤"><svg preserveAspectRatio="none" class="stock-chart');
s=s.replace('viewBox="0 0 360 200"','viewBox="0 0 1000 200"').replace('M36 ${y}H320','M54 ${y}H900').replaceAll('x="324"','x="910"').replace('x="36" y="190"','x="54" y="190"').replace('x="255" y="190"','x="820" y="190"').replace('</g></svg><p class="stock-caption">','</g></svg></div><p class="stock-caption">');
s=s.replace('output.textContent = hint; svg.after(output);',`output.textContent = hint;
    const scroll = host.querySelector('.stock-chart-scroll');
    scroll.after(output);
    const restored = host.dataset.chartScrollPeriod === period;
    scroll.scrollLeft = restored ? Number(host.dataset.chartScrollLeft || 0) : scroll.scrollWidth - scroll.clientWidth;
    const rememberScroll = () => { host.dataset.chartScrollLeft = String(scroll.scrollLeft); host.dataset.chartScrollPeriod = period; };
    rememberScroll(); scroll.onscroll = rememberScroll;
    scroll.addEventListener('wheel', event => {
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const before = scroll.scrollLeft;
        scroll.scrollLeft += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroll.clientWidth : 1);
        if (scroll.scrollLeft !== before) event.preventDefault();
    }, { passive: false });
    let drag;
    scroll.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        drag = { x: event.clientX, left: scroll.scrollLeft };
        scroll.setPointerCapture(event.pointerId);
    });
    scroll.addEventListener('pointermove', event => { if (drag) scroll.scrollLeft = drag.left - (event.clientX - drag.x); });
    const release = () => { drag = null; };
    scroll.addEventListener('pointerup', release); scroll.addEventListener('pointercancel', release); scroll.addEventListener('lostpointercapture', release);`);
s=s.replace('x1="36" x2="320"','x1="54" x2="900"').replace('const x = 36 + sample.index / Math.max(1, samples.length - 1) * 280;','const x = 54 + sample.index / Math.max(1, samples.length - 1) * 846;').replace('Math.max(36, Math.min(82, x - 119))','Math.max(54, Math.min(662, x - 119))').replace('(local.x - 36) / 280','(local.x - 54) / 846');
fs.writeFileSync(p,s);
