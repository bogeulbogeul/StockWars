import * as THREE from '../../../vendor/three/three.module.js';
import { timeOfDayService } from '../../engine/timeOfDayService.js';
import { TOWN_SKY_PALETTES } from '../../data/townSkyPalettes.js';
import { drawTownClouds } from './TownClouds.js';
import { TOWN_WEATHER_PROFILES, townWeather } from '../../data/townWeatherProfiles.js';

const TRANSITION_MS = 12000;

export class TownSky {
    constructor(scene) {
        this.scene = scene;
        this.image = document.createElement('canvas');
        this.image.width = 1024;
        this.image.height = 512;
        this.context = this.image.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.image);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.name = 'town-drifting-cloud-sky';
        this.colors = [];
        scene.background = this.texture;
        this.update(performance.now(), true);
    }

    currentStage(now) {
        const preview = this.scene.userData.skyTimeOfDay;
        if (TOWN_SKY_PALETTES[preview]) return preview;
        if (document.body.classList.contains('exhibition-sunset')) return 'sunset';
        // Reuse the game's regional/seasonal clock without requesting location
        // or starting another service timer for each scene.
        if (timeOfDayService.isManual) return timeOfDayService.getCurrentTime();
        if (!this.nextClockCheck || now >= this.nextClockCheck) {
            this.clockStage = timeOfDayService.calculateTimeOfDay(new Date());
            this.nextClockCheck = now + 10000;
        }
        return this.clockStage;
    }

    update(now = performance.now(), immediate = false) {
        const stage = this.currentStage(now);
        const weather = townWeather(this.scene);
        if (stage !== this.stage || weather !== this.weather || immediate) {
            this.stage = stage;
            this.weather = weather;
            this.from = this.colors.length ? [...this.colors] : [...TOWN_SKY_PALETTES[stage]];
            const profile = TOWN_WEATHER_PROFILES[weather];
            this.target = TOWN_SKY_PALETTES[stage].map(color => {
                // Preserve night darkness instead of washing it into daytime gray.
                const tint = new THREE.Color(profile.tint);
                if (stage === 'night') tint.multiplyScalar(.25);
                return `#${new THREE.Color(color).lerp(tint, profile.blend).getHexString()}`;
            });
            this.started = immediate ? now - TRANSITION_MS : now;
            this.lastPaint = -Infinity;
        }
        if (now - this.lastPaint < 100 && !immediate) return;
        const t = immediate ? 1 : Math.min(1, Math.max(0, (now - this.started) / TRANSITION_MS));
        const blend = t * t * (3 - 2 * t);
        this.colors = this.target.map((hex, index) => {
            const a = new THREE.Color(this.from[index]);
            return `#${a.lerp(new THREE.Color(hex), blend).getHexString()}`;
        });
        const gradient = this.context.createLinearGradient(0, 0, 0, this.image.height);
        // The village ground hides the lower screen: keep the warm horizon
        // inside the visible sky band rather than underneath the terrain.
        this.colors.forEach((color, index) => gradient.addColorStop([0, .12, .27][index], color));
        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.image.width, this.image.height);
        drawTownClouds(this.context, this.image.width, this.image.height, now / 1000,
            this.colors, matchMedia('(prefers-reduced-motion: reduce)').matches);
        this.texture.needsUpdate = true;
        this.lastPaint = now;
        this.lastStage = stage;
        this.finished = t === 1;
    }
}
