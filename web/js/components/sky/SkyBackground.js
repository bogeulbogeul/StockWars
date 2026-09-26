/**
 * SkyBackground Component
 * Renders layered atmospheric sky background with smooth cross-fade transitions.
 * Supports Dawn, Day, Sunset, and Night states.
 */

import { TIME_OF_DAY, timeOfDayService } from '../../engine/timeOfDayService.js';

export class SkyBackground {
    constructor(parentContainer, options = {}) {
        this.parentContainer = parentContainer;
        this.options = options;
        this.currentActive = null;
        this.containerEl = null;
        this.layers = {};
        this.unsubscribe = null;

        this.init();
    }

    static getTemplateHtml(id = 'skyContainer', extraClass = '') {
        return `
            <div class="sky-stage-container ${extraClass}" id="${id}">
                <div class="sky-layer sky-dawn" data-time="${TIME_OF_DAY.DAWN}"></div>
                <div class="sky-layer sky-day" data-time="${TIME_OF_DAY.DAY}"></div>
                <div class="sky-layer sky-sunset" data-time="${TIME_OF_DAY.SUNSET}"></div>
                <div class="sky-layer sky-night" data-time="${TIME_OF_DAY.NIGHT}"></div>
                <div class="sky-twinkle-layer"></div>
                <div class="sky-ambient-overlay"></div>
            </div>
        `;
    }

    init() {
        if (!this.parentContainer) return;

        // If not already in DOM, append
        let existing = this.parentContainer.querySelector('.sky-stage-container');
        if (!existing) {
            this.parentContainer.insertAdjacentHTML('afterbegin', SkyBackground.getTemplateHtml());
            existing = this.parentContainer.querySelector('.sky-stage-container');
        }

        this.containerEl = existing;
        this.layers[TIME_OF_DAY.DAWN] = this.containerEl.querySelector('.sky-dawn');
        this.layers[TIME_OF_DAY.DAY] = this.containerEl.querySelector('.sky-day');
        this.layers[TIME_OF_DAY.SUNSET] = this.containerEl.querySelector('.sky-sunset');
        this.layers[TIME_OF_DAY.NIGHT] = this.containerEl.querySelector('.sky-night');

        // Subscribe to global timeOfDayService
        this.unsubscribe = timeOfDayService.subscribe((timeKey) => {
            this.applyTimeOfDay(timeKey);
        });
    }

    applyTimeOfDay(timeKey) {
        if (!this.containerEl) return;

        // Remove existing time classes on parent or container
        const timeClasses = ['time-dawn', 'time-day', 'time-sunset', 'time-night'];
        timeClasses.forEach(cls => {
            this.parentContainer.classList.remove(cls);
            this.containerEl.classList.remove(cls);
        });

        // Add new active time class
        this.parentContainer.classList.add(`time-${timeKey}`);
        this.containerEl.classList.add(`time-${timeKey}`);

        // Update layers cross-fade
        Object.entries(this.layers).forEach(([key, layerEl]) => {
            if (!layerEl) return;
            if (key === timeKey) {
                layerEl.classList.add('active');
                layerEl.classList.remove('previous');
            } else if (layerEl.classList.contains('active')) {
                layerEl.classList.remove('active');
                layerEl.classList.add('previous');
                // Remove previous after transition ends
                setTimeout(() => {
                    layerEl.classList.remove('previous');
                }, 2200);
            } else {
                layerEl.classList.remove('active', 'previous');
            }
        });

        this.currentActive = timeKey;
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
