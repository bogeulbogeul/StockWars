import { settingsStore, DEFAULT_SETTINGS } from '../engine/SettingsStore.js';

export class SettingsModal {
    constructor(container, { onExit } = {}) {
        settingsStore.apply();
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'settings-dialog';
        this.dialog.setAttribute('aria-labelledby', 'settingsTitle');
        this.dialog.innerHTML = `
            <header class="settings-header"><div><span>GAME PREFERENCES</span><h2 id="settingsTitle">설정</h2></div><button type="button" data-action="close" aria-label="설정 닫기" autofocus>✕</button></header>
            <section class="settings-section"><h3>소리</h3><label class="settings-volume-label" for="settingsEffectsVolume">효과음 <output for="settingsEffectsVolume" id="settingsVolumeValue"></output></label><input id="settingsEffectsVolume" type="range" min="0" max="100" step="1"><p>물류 알바 효과음에 적용됩니다. 0%로 설정하면 음소거됩니다.</p></section>
            <section class="settings-section"><h3>화면</h3><label class="settings-row"><span><strong>애니메이션 줄이기</strong><small>UI 전환과 반복 효과를 최소화합니다.</small></span><input type="checkbox" id="settingsReducedMotion"></label><label class="settings-row"><span><strong>상단 날씨 표시</strong><small>상태 바에 날씨와 기온을 표시합니다.</small></span><input type="checkbox" id="settingsShowWeather"></label></section>
            <footer class="settings-footer"><p role="status" id="settingsSaveStatus">변경 사항은 즉시 적용됩니다.</p><button type="button" data-action="reset">기본값으로 복원</button><div class="settings-actions settings-navigation"><button type="button" data-action="main-menu">메인화면으로 나가기</button><button type="button" class="settings-exit" data-action="exit">게임 종료</button></div></footer>`;
        container.append(this.dialog);
        this.volume = this.dialog.querySelector('#settingsEffectsVolume');
        this.motion = this.dialog.querySelector('#settingsReducedMotion');
        this.weather = this.dialog.querySelector('#settingsShowWeather');
        this.status = this.dialog.querySelector('#settingsSaveStatus');
        this.volume.addEventListener('input', () => this.save({ effectsVolume: Number(this.volume.value) }));
        this.motion.addEventListener('change', () => this.save({ reducedMotion: this.motion.checked }));
        this.weather.addEventListener('change', () => this.save({ showWeather: this.weather.checked }));
        this.dialog.querySelector('[data-action="reset"]').addEventListener('click', () => this.save(DEFAULT_SETTINGS));
        this.dialog.querySelector('[data-action="close"]').addEventListener('click', () => this.dialog.close());
        this.dialog.querySelector('[data-action="main-menu"]').addEventListener('click', () => {
            this.dialog.close();
            onExit?.();
        });
        const exitButton = this.dialog.querySelector('[data-action="exit"]');
        exitButton.disabled = !window.stockWarsApp?.quit;
        exitButton.title = exitButton.disabled ? '게임 종료는 데스크톱 앱에서 사용할 수 있습니다. 브라우저에서는 탭을 닫아 주세요.' : '게임 앱 종료';
        exitButton.addEventListener('click', async () => {
            if (exitButton.disabled) return;
            exitButton.disabled = true;
            try {
                if (window.stockWarsApp?.quit) {
                    const result = await window.stockWarsApp.quit();
                    if (result?.error) throw new Error(result.error);
                }
            } catch {
                this.status.textContent = '게임을 종료하지 못했습니다. 다시 시도해 주세요.';
            } finally { exitButton.disabled = false; }
        });
        this.dialog.addEventListener('keydown', event => event.stopPropagation());
        this.dialog.addEventListener('close', () => this.returnFocus?.focus());
        this.dialog.addEventListener('click', event => {
            const bounds = this.dialog.getBoundingClientRect();
            if (event.target === this.dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) this.dialog.close();
        });
    }
    sync() {
        const value = settingsStore.value;
        this.volume.value = value.effectsVolume;
        this.motion.checked = value.reducedMotion;
        this.weather.checked = value.showWeather;
        this.dialog.querySelector('#settingsVolumeValue').textContent = `${value.effectsVolume}%`;
    }
    save(patch) {
        const persisted = settingsStore.update(patch);
        this.sync();
        this.status.textContent = persisted ? '적용 및 저장되었습니다.' : '적용되었습니다. 이 환경에서는 설정을 저장할 수 없습니다.';
    }
    open() {
        if (this.dialog.open) return;
        this.returnFocus = document.activeElement;
        this.sync();
        this.dialog.showModal();
    }
}
