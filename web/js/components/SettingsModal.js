import { KEY_ACTIONS, DEFAULT_KEY_BINDINGS, canonicalCode, isBindingCode } from '../engine/KeyBindings.js';
import { bindingLabel, refreshKeyHints } from '../app/GameKeys.js';
import { settingsStore, DEFAULT_SETTINGS } from '../engine/SettingsStore.js';

export class SettingsModal {
    constructor(container, { onExit, onQuit, isTutorialActive = () => false, canQuit = () => !!window.stockWarsDesktop?.quit } = {}) {
        this.isTutorialActive = isTutorialActive;
        this.canQuit = canQuit;
        settingsStore.apply();
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'settings-dialog';
        this.dialog.setAttribute('aria-labelledby', 'settingsTitle');
        this.dialog.innerHTML = `
            <header class="settings-header"><div><span>GAME PREFERENCES</span><h2 id="settingsTitle">설정</h2></div><button type="button" data-action="close" aria-label="설정 닫기" autofocus>✕</button></header>
            <section class="settings-section"><h3>소리</h3><label class="settings-volume-label" for="settingsEffectsVolume">효과음 <output for="settingsEffectsVolume" id="settingsVolumeValue"></output></label><input id="settingsEffectsVolume" type="range" min="0" max="100" step="1"><p>물류 알바 효과음에 적용됩니다. 0%로 설정하면 음소거됩니다.</p></section>
            <section class="settings-section"><h3>화면</h3><label class="settings-row"><span><strong>애니메이션 줄이기</strong><small>UI 전환과 반복 효과를 최소화합니다.</small></span><input type="checkbox" id="settingsReducedMotion"></label><label class="settings-row"><span><strong>상단 날씨 표시</strong><small>상태 바에 날씨와 기온을 표시합니다.</small></span><input type="checkbox" id="settingsShowWeather"></label></section>
            <section class="settings-section"><h3>조작키</h3><p>버튼을 누른 뒤 원하는 키를 입력하세요. 문자키·Space·Shift를 지정할 수 있습니다. ESC는 취소, 방향키는 이동 보조키로 유지됩니다. E·R·숫자키는 편집 및 메뉴 조작에 사용됩니다.</p><div class="settings-key-list">${Object.entries(KEY_ACTIONS).map(([action, label]) => `<div class="settings-key-row"><span>${label}</span><button type="button" data-bind-action="${action}" aria-label="${label} 키 변경"></button></div>`).join('')}</div><button type="button" data-action="reset-keys">조작키 기본값 복원</button><p role="status" id="settingsKeyStatus">중복된 키는 지정할 수 없습니다.</p></section><footer class="settings-footer"><p role="status" id="settingsSaveStatus">변경 사항은 즉시 적용됩니다.</p><button type="button" data-action="reset">기본값으로 복원</button><p class="settings-tutorial-lock" role="status" hidden>튜토리얼 완료 후 메인메뉴 이동과 게임 종료를 이용할 수 있어요.</p><div class="settings-actions settings-navigation"><button type="button" data-action="main-menu">메인화면으로 나가기</button><button type="button" class="settings-exit" data-action="exit">게임 종료</button></div></footer>`;
        container.append(this.dialog);
        this.volume = this.dialog.querySelector('#settingsEffectsVolume');
        this.motion = this.dialog.querySelector('#settingsReducedMotion');
        this.weather = this.dialog.querySelector('#settingsShowWeather');
        this.status = this.dialog.querySelector('#settingsSaveStatus');
        this.keyStatus = this.dialog.querySelector('#settingsKeyStatus');
        this.dialog.querySelectorAll('[data-bind-action]').forEach(button => button.addEventListener('click', () => {
            this.pendingBinding = button.dataset.bindAction;
            this.sync();
            this.keyStatus.textContent = KEY_ACTIONS[this.pendingBinding] + ': 원하는 키를 누르세요. ESC로 취소합니다.';
        }));
        this.dialog.querySelector('[data-action="reset-keys"]').addEventListener('click', () => {
            this.cancelBinding();
            this.save({ keyBindings: DEFAULT_KEY_BINDINGS });
        });
        this.dialog.addEventListener('cancel', event => {
            if (this.pendingBinding) { event.preventDefault(); this.cancelBinding(); }
        });
        this.volume.addEventListener('input', () => this.save({ effectsVolume: Number(this.volume.value) }));
        this.motion.addEventListener('change', () => this.save({ reducedMotion: this.motion.checked }));
        this.weather.addEventListener('change', () => this.save({ showWeather: this.weather.checked }));
        this.dialog.querySelector('[data-action="reset"]').addEventListener('click', () => { this.cancelBinding(); this.save(DEFAULT_SETTINGS); });
        this.dialog.querySelector('[data-action="close"]').addEventListener('click', () => this.dialog.close());
        this.dialog.querySelector('[data-action="main-menu"]').addEventListener('click', () => {
            if (this.isTutorialActive()) { this.syncNavigation(); return; }
            this.dialog.close();
            onExit?.();
        });
        const exitButton = this.dialog.querySelector('[data-action="exit"]');
        this.syncNavigation();
        exitButton.addEventListener('click', async () => {
            if (this.isTutorialActive() || exitButton.disabled) { this.syncNavigation(); return; }
            exitButton.disabled = true;
            try {
                if (onQuit || window.stockWarsDesktop?.quit) {
                    const result = await (onQuit ? onQuit() : window.stockWarsDesktop.quit());
                    if (result?.error) throw new Error(result.error);
                }
            } catch {
                this.status.textContent = '게임을 종료하지 못했습니다. 다시 시도해 주세요.';
            } finally { this.syncNavigation(); }
        });
        this.dialog.addEventListener('keydown', event => {
            event.stopPropagation();
            if (!this.pendingBinding) return;
            event.preventDefault();
            if (event.key === 'Escape') { this.cancelBinding(); return; }
            if (event.repeat || event.isComposing) return;
            const code = canonicalCode(event.code);
            if (event.ctrlKey || event.altKey || event.metaKey || !isBindingCode(code)) {
                this.keyStatus.textContent = '문자키(E·R 제외), Space 또는 Shift를 눌러 주세요.';
                return;
            }
            const conflict = Object.entries(settingsStore.value.keyBindings).find(([action, assigned]) => action !== this.pendingBinding && assigned === code);
            if (conflict) { this.keyStatus.textContent = KEY_ACTIONS[conflict[0]] + '에 사용 중인 키입니다. 다른 키를 눌러 주세요.'; return; }
            const action = this.pendingBinding;
            this.pendingBinding = null;
            this.save({ keyBindings: { ...settingsStore.value.keyBindings, [action]: code } });
            this.keyStatus.textContent = KEY_ACTIONS[action] + ': ' + bindingLabel(action) + '로 변경했습니다.';
        });
        this.dialog.addEventListener('close', () => { this.cancelBinding(); this.returnFocus?.focus(); });
        this.dialog.addEventListener('click', event => {
            const bounds = this.dialog.getBoundingClientRect();
            if (event.target === this.dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) this.dialog.close();
        });
    }
    cancelBinding() {
        this.pendingBinding = null;
        this.keyStatus.textContent = '중복된 키는 지정할 수 없습니다.';
        this.sync();
    }
    syncNavigation() {
        const locked = this.isTutorialActive();
        const main = this.dialog.querySelector('[data-action="main-menu"]');
        const exit = this.dialog.querySelector('[data-action="exit"]');
        main.disabled = locked;
        main.title = locked ? '튜토리얼 완료 후 이용할 수 있어요.' : '메인메뉴로 나가기';
        exit.disabled = locked || !this.canQuit();
        exit.title = locked ? '튜토리얼 완료 후 이용할 수 있어요.' : this.canQuit() ? '게임 앱 종료' : '게임 종료는 데스크톱 앱에서 사용할 수 있습니다.';
        this.dialog.querySelector('.settings-tutorial-lock').hidden = !locked;
    }
    sync() {
        this.syncNavigation();
        this.dialog.querySelectorAll('[data-bind-action]').forEach(button => {
            const action = button.dataset.bindAction;
            button.textContent = this.pendingBinding === action ? '키 입력 대기…' : bindingLabel(action);
            button.setAttribute('aria-pressed', String(this.pendingBinding === action));
        });
        refreshKeyHints();
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
