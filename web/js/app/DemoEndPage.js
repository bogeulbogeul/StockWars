import { clearDemoRecords, DEMO_END_KEY } from './DemoLifecycle.js';

const status = document.querySelector('[data-status]');
const retry = document.querySelector('[data-retry]');
const restart = document.querySelector('[data-restart]');
const quit = document.querySelector('[data-quit]');
let busy = false;

async function discardRecords() {
    if (busy) return;
    busy = true;
    retry.hidden = true;
    restart.disabled = true;
    status.textContent = '플레이 기록을 정리하고 있어요…';
    try {
        localStorage.setItem(DEMO_END_KEY, 'pending');
        const desktop = window.stockWarsDesktop;
        if (desktop) {
            if (!desktop.discardDemoRecords) throw new Error('앱 업데이트가 필요해요.');
            const result = await desktop.discardDemoRecords();
            if (!result?.success) throw new Error(result?.error || '온라인 기록 삭제를 확인하지 못했어요.');
        } else if (window.stockWarsPresence) {
            throw new Error('온라인 기록 삭제를 지원하는 앱에서 다시 시도해 주세요.');
        }
        clearDemoRecords(localStorage);
        clearDemoRecords(sessionStorage);
        localStorage.setItem(DEMO_END_KEY, 'complete');
        status.textContent = '이번 데모의 플레이 기록이 삭제되었습니다.';
        restart.disabled = false;
    } catch (error) {
        status.textContent = `${error.message} 연결을 확인하고 다시 시도해 주세요. 새로 시작하기는 삭제 완료 후 가능합니다.`;
        retry.hidden = false;
    } finally { busy = false; }
}

retry.onclick = () => void discardRecords();
restart.onclick = async () => {
    restart.disabled = true;
    try {
        clearDemoRecords(localStorage);
        clearDemoRecords(sessionStorage);
        if (window.stockWarsDesktop) {
            const result = await window.stockWarsDesktop.restartDemo();
            if (result?.error) throw new Error(result.error);
        } else {
            localStorage.removeItem(DEMO_END_KEY);
            location.replace(new URL('index.html', location.href));
        }
    } catch (error) { status.textContent = error.message; restart.disabled = false; }
};
quit.onclick = async () => {
    if (window.stockWarsDesktop?.quit) {
        const result = await window.stockWarsDesktop.quit();
        if (result?.error) status.textContent = result.error;
    } else {
        window.close();
        status.textContent = '데모가 종료되었습니다. 이 탭을 닫아 주세요.';
    }
};
void discardRecords();
