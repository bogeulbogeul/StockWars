const titles = {
    item_caffeine_shot: '카페인 섭취', item_black_swan_alarm: '조기 경보기',
    item_gas_mask: '디지털 방독면', item_escape_capsule: '탈출 캡슐 준비',
    item_crypto_decoder: '암호 해독 결과', item_darknet_key: '다크넷 해독 결과'
};

export function showItemUseNotice(id, result, engine) {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'width:min(440px,85vw);padding:28px;border:1px solid #35cddd;border-radius:16px;background:#101c29;color:#eaf5ff;font:18px/1.7 sans-serif';
    const title = document.createElement('h2'); title.textContent = titles[id] || '아이템 사용'; title.style.cssText = 'font-size:24px;margin:0 0 16px';
    const message = document.createElement('p'); message.textContent = result.message;
    dialog.append(title, message);
    if (['item_crypto_decoder', 'item_darknet_key'].includes(id)) {
        for (const report of engine.state.reports || []) {
            const content = document.createElement('p');
            content.textContent = report.parts.slice(0, report.revealed).join(' · ');
            dialog.append(content);
        }
    }
    const close = document.createElement('button'); close.textContent = '확인';
    close.style.cssText = 'width:100%;padding:12px;font:inherit;color:#071721;background:#34dbeb;border:0;border-radius:8px;cursor:pointer';
    close.onclick = () => dialog.close(); dialog.append(close);
    dialog.addEventListener('keydown', event => event.stopPropagation());
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    document.body.append(dialog); dialog.showModal();
}
