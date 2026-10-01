/**
 * SkyWeatherLayer Component
 * Renders atmospheric sun & dynamic drifting cloud sprites based on real-time local weather.
 * Synchronizes with timeOfDayService (Dawn/Day/Sunset/Night) & weatherService (Clear/Clouds/Storm).
 */

import { weatherService } from '../../engine/weatherService.js';
import { timeOfDayService, TIME_OF_DAY } from '../../engine/timeOfDayService.js';

export class SkyWeatherLayer {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.sunEl = null;
        this.cloudsContainer = null;
        this.rainContainer = null;
        this.snowContainer = null;
        this.thunderFlashEl = null;
        this.unsubWeather = null;
        this.unsubTime = null;
        this.currentWeather = weatherService.currentWeather || { category: 'clear', isDay: true };
        this.currentTime = timeOfDayService.getCurrentTime() || TIME_OF_DAY.DAY;

        this.init();
    }

    static getTemplateHtml() {
        return `
            <div class="sky-weather-layer">
                <!-- Glowing Stylized Sun -->
                <div class="sky-sun-element visible day-mode" id="skySunElement">
                    <div class="sun-halo"></div>
                    <div class="sun-sprite"></div>
                </div>

                <!-- Multi-depth Drifting Clouds Container -->
                <div class="sky-clouds-container" id="skyCloudsContainer"></div>

                <!-- Rain VFX Particles Container -->
                <div class="sky-rain-vfx-container" id="skyRainVfxContainer"></div>

                <!-- Snow VFX Particles Container -->
                <div class="sky-snow-vfx-container" id="skySnowVfxContainer"></div>

                <!-- Thunder Flash Effect -->
                <div class="sky-thunder-flash" id="skyThunderFlash"></div>

                <!-- Black Swan Crisis Special Atmosphere Overlay -->
                <div class="sky-black-swan-vfx" id="skyBlackSwanVfx"></div>
            </div>
        `;
    }

    init() {
        if (!this.parentContainer) return;

        let existing = this.parentContainer.querySelector('.sky-weather-layer');
        if (!existing) {
            this.parentContainer.insertAdjacentHTML('beforeend', SkyWeatherLayer.getTemplateHtml());
            existing = this.parentContainer.querySelector('.sky-weather-layer');
        }

        this.layerEl = existing;
        this.sunEl = this.layerEl.querySelector('.sky-sun-element');
        this.cloudsContainer = this.layerEl.querySelector('.sky-clouds-container');
        this.rainContainer = this.layerEl.querySelector('#skyRainVfxContainer');
        this.snowContainer = this.layerEl.querySelector('#skySnowVfxContainer');
        this.thunderFlashEl = this.layerEl.querySelector('#skyThunderFlash');
        this.blackSwanEl = this.layerEl.querySelector('#skyBlackSwanVfx');

        // Build static particle pools for Rain and Snow
        this.buildRainParticles();
        this.buildSnowParticles();

        // Subscriptions
        this.unsubWeather = weatherService.subscribe((weather) => {
            this.currentWeather = weather;
            this.updateAtmosphere();
        });

        this.unsubTime = timeOfDayService.subscribe((timeKey) => {
            this.currentTime = timeKey;
            this.updateAtmosphere();
        });

        this.updateAtmosphere();
    }

    buildRainParticles() {
        if (!this.rainContainer) return;
        const particleCount = 45;
        let html = '';
        for (let i = 0; i < particleCount; i++) {
            const left = Math.random() * 100;
            const duration = (0.55 + Math.random() * 0.45).toFixed(2);
            const delay = (-Math.random() * 2).toFixed(2);
            const height = Math.floor(20 + Math.random() * 24);
            const opacity = (0.35 + Math.random() * 0.55).toFixed(2);

            html += `<div class="rain-drop" style="
                left: ${left}%;
                height: ${height}px;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
                opacity: ${opacity};
            "></div>`;
        }
        this.rainContainer.innerHTML = html;
    }

    buildSnowParticles() {
        if (!this.snowContainer) return;
        const particleCount = 50;
        let html = '';
        for (let i = 0; i < particleCount; i++) {
            const left = Math.random() * 100;
            const size = Math.floor(3 + Math.random() * 5);
            const duration = (3.5 + Math.random() * 4.5).toFixed(2);
            const delay = (-Math.random() * 5).toFixed(2);
            const opacity = (0.5 + Math.random() * 0.45).toFixed(2);

            html += `<div class="snow-flake" style="
                left: ${left}%;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
                opacity: ${opacity};
            "></div>`;
        }
        this.snowContainer.innerHTML = html;
    }

    updateAtmosphere() {
        if (!this.sunEl || !this.cloudsContainer) return;

        const weather = this.currentWeather || weatherService.currentWeather || { category: 'clear' };
        const time = this.currentTime || timeOfDayService.getCurrentTime() || TIME_OF_DAY.DAY;
        const category = weather.category || 'clear';
        const isNight = time === TIME_OF_DAY.NIGHT;

        // 1. Sun East-to-West Orbit Trajectory & Visibility
        const isSunVisible = !isNight && (category === 'clear' || category === 'partly_cloudy');
        this.sunEl.classList.toggle('visible', isSunVisible);
        this.sunEl.classList.remove('dawn-mode', 'day-mode', 'sunset-mode', 'night-mode');
        this.sunEl.classList.add(`${time}-mode`);

        // 2. Weather VFX Particles (Rain, Snow, Thunder, Black Swan Crisis)
        const isRain = category === 'rain' || category === 'thunderstorm';
        const isSnow = category === 'snow';
        const isThunder = category === 'thunderstorm' || category === 'black_swan';
        const isBlackSwan = category === 'black_swan';

        if (this.rainContainer) this.rainContainer.classList.toggle('active', isRain);
        if (this.snowContainer) this.snowContainer.classList.toggle('active', isSnow);
        if (this.thunderFlashEl) this.thunderFlashEl.classList.toggle('flash-active', isThunder);
        if (this.blackSwanEl) this.blackSwanEl.classList.toggle('active', isBlackSwan);

        // 3. Render Clouds based on Weather Category & Time
        this.renderCloudSprites(category, time);
    }

    renderCloudSprites(category, time) {
        if (!this.cloudsContainer) return;

        const v = '20260926_clean';
        let cloudConfigs = [];

        if (category === 'clear') {
            // Light, sparse white clouds
            cloudConfigs = [
                { src: `assets/weather/cloud_white_3.png?v=${v}`, top: 12, size: 90, speed: 75, delay: 0, opacity: 0.65 },
                { src: `assets/weather/cloud_white_8.png?v=${v}`, top: 28, size: 110, speed: 90, delay: -35, opacity: 0.55 }
            ];
        } else if (category === 'partly_cloudy') {
            // Fluffy aesthetic clouds
            cloudConfigs = [
                { src: `assets/weather/cloud_white_1.png?v=${v}`, top: 10, size: 160, speed: 65, delay: 0, opacity: 0.85 },
                { src: `assets/weather/cloud_white_4.png?v=${v}`, top: 22, size: 210, speed: 80, delay: -25, opacity: 0.8 },
                { src: `assets/weather/cloud_white_9.png?v=${v}`, top: 38, size: 170, speed: 70, delay: -50, opacity: 0.75 }
            ];
        } else if (category === 'overcast') {
            // Denser clouds with mixed depth
            cloudConfigs = [
                { src: `assets/weather/cloud_white_1.png?v=${v}`, top: 8, size: 200, speed: 55, delay: 0, opacity: 0.9 },
                { src: `assets/weather/cloud_white_5.png?v=${v}`, top: 18, size: 240, speed: 68, delay: -20, opacity: 0.85 },
                { src: `assets/weather/cloud_white_10.png?v=${v}`, top: 32, size: 190, speed: 60, delay: -40, opacity: 0.8 },
                { src: `assets/weather/cloud_dark_4.png?v=${v}`, top: 24, size: 170, speed: 75, delay: -10, opacity: 0.45 }
            ];
        } else if (category === 'snow') {
            // Snow clouds (Soft greyish-white heavy winter clouds)
            cloudConfigs = [
                { src: `assets/weather/cloud_white_1.png?v=${v}`, top: 6, size: 250, speed: 50, delay: 0, opacity: 0.92 },
                { src: `assets/weather/cloud_white_5.png?v=${v}`, top: 16, size: 270, speed: 60, delay: -15, opacity: 0.88 },
                { src: `assets/weather/cloud_dark_4.png?v=${v}`, top: 28, size: 220, speed: 55, delay: -35, opacity: 0.5 }
            ];
        } else {
            // Rain & Thunderstorm dark clouds
            cloudConfigs = [
                { src: `assets/weather/cloud_dark_1.png?v=${v}`, top: 6, size: 260, speed: 45, delay: 0, opacity: 0.95 },
                { src: `assets/weather/cloud_dark_3.png?v=${v}`, top: 16, size: 280, speed: 52, delay: -18, opacity: 0.9 },
                { src: `assets/weather/cloud_dark_7.png?v=${v}`, top: 28, size: 240, speed: 48, delay: -35, opacity: 0.85 },
                { src: `assets/weather/cloud_dark_10.png?v=${v}`, top: 38, size: 250, speed: 56, delay: -25, opacity: 0.92 }
            ];
        }

        // Night & Black Swan tone tint modifiers
        const isNight = time === TIME_OF_DAY.NIGHT;
        const isSunset = time === TIME_OF_DAY.SUNSET;
        const isBlackSwan = category === 'black_swan';

        const html = cloudConfigs.map((cfg, i) => {
            let tintClass = '';
            if (isBlackSwan) {
                tintClass = 'cloud-blackswan-tint';
            } else if (isNight) {
                tintClass = 'cloud-night-tint';
            } else if (isSunset) {
                tintClass = 'cloud-sunset-tint';
            }

            return `
                <div class="sky-cloud-item ${tintClass}" style="
                    top: ${cfg.top}%;
                    width: ${cfg.size}px;
                    opacity: ${cfg.opacity};
                    animation-duration: ${cfg.speed}s;
                    animation-delay: ${cfg.delay}s;
                ">
                    <img src="${cfg.src}" alt="Sky Cloud" class="cloud-img" draggable="false" />
                </div>
            `;
        }).join('');

        this.cloudsContainer.innerHTML = html;
    }

    destroy() {
        if (this.unsubWeather) this.unsubWeather();
        if (this.unsubTime) this.unsubTime();
    }
}
