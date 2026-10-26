export function playSeedPlanting() {
    const dialog = document.createElement('dialog'); dialog.className = 'first-day-animation';
    dialog.setAttribute('aria-label', '씨앗을 심고 흙을 덮어 물을 주는 애니메이션');
    const frame = document.createElement('iframe'); frame.title = '소망이 씨앗 심기'; dialog.append(frame);
    dialog.addEventListener('cancel', event => event.preventDefault());
    document.body.append(dialog); dialog.showModal();
    return new Promise((resolve, reject) => {
        let finished = false;
        const finish = error => {
            if (finished) return; finished = true;
            frame.onerror = null;
            window.removeEventListener('message', message); dialog.remove();
            if (error) reject(error); else resolve();
        };
        const message = event => {
            if (event.source !== frame.contentWindow) return;
            if (event.data?.type === 'seed-planting-complete') finish();
            if (event.data?.type === 'seed-planting-error') finish(new Error('씨앗 심기 이미지를 불러오지 못했어요.'));
        };
        window.addEventListener('message', message);
        frame.onerror = () => finish(new Error('씨앗 심기 화면을 불러오지 못했어요.'));
        frame.src = new URL('../../../assets/planting/seed-v1/scene.html', import.meta.url).href;
    });
}
