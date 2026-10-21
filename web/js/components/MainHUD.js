// Compatibility state for gameplay consumers after retiring the old HUD view.
// Financial presentation now belongs to the smartphone.
export class MainHUD {
    constructor(container, callbacks = {}) {
        this.callbacks = callbacks;
        this.stamina = { current: 3, max: 3 };
    }
    updateState(state) { this.state = state; }
    updateWeather(weather) { this.weather = weather; }
    renderHearts(current = 3, max = 3) { this.stamina = { current, max }; }
    updateStamina(current, max = this.stamina.max) { this.renderHearts(current, max); }
    destroy() {}
}
