import { HeartHUD } from './HeartHUD.js?v=1';
// Keep gameplay compatibility while presenting only the newly approved hearts.
export class MainHUD {
    constructor(container, callbacks = {}) {
        this.callbacks = callbacks;
        this.stamina = { current: 3, max: 3 };
        this.heartHUD = new HeartHUD();
    }
    updateState(state) { this.state = state; }
    updateWeather(weather) { this.weather = weather; }
    renderHearts(current = 3, max = 3) { this.stamina = { current, max }; this.heartHUD.update(current, max); }
    updateStamina(current, max = this.stamina.max) { this.renderHearts(current, max); }
    destroy() { this.heartHUD.destroy(); }
}
