import { COMMON_PLAYER_RULES } from '../engine/AbilityRetirement.js';

// Presentation only; spending/recovering stamina remains with the existing engine.
export class HeartHUD {
    constructor(container = document.body) {
        this.element = document.createElement('aside');
        this.element.className = 'heart-hud';
        this.element.hidden = true;
        this.element.innerHTML = '<div class="heart-hud__heading"><span>체력</span><span data-heart-count></span></div><div class="heart-hud__hearts" aria-hidden="true"></div>';
        container.append(this.element);
        this.observed = new Set();
        this.resize = new ResizeObserver(() => this.schedule());
        this.mutations = new MutationObserver(records => {
            if (records.some(record => !this.element.contains(record.target))) this.schedule();
        });
        this.mutations.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'open'] });
        this.onResize = () => this.schedule();
        window.addEventListener('resize', this.onResize);
        this.update(COMMON_PLAYER_RULES.maxStamina);
    }
    update(current, max = COMMON_PLAYER_RULES.maxStamina) {
        max = Math.max(1, Math.floor(Number.isFinite(max) ? max : COMMON_PLAYER_RULES.maxStamina));
        current = Math.max(0, Math.min(max, Number.isFinite(current) ? current : max));
        this.element.querySelector('[data-heart-count]').textContent = `${current} / ${max}`;
        this.element.setAttribute('aria-label', `체력 ${max}칸 중 ${current}칸`);
        this.element.querySelector('.heart-hud__hearts').innerHTML = Array.from({ length: max }, (_, index) =>
            `<svg viewBox="0 0 32 32" class="${index < current ? '' : 'is-empty'}"><path d="M16 28C13 25 3 18 3 10.5 3 3 12 1.5 16 8 20 1.5 29 3 29 10.5 29 18 19 25 16 28Z"/></svg>`).join('');
        this.schedule();
    }
    schedule() {
        if (!this.frame) this.frame = requestAnimationFrame(() => { this.frame = null; this.layout(); });
    }
    layout() {
        const blockers = [...document.querySelectorAll('.game-guidance, .money-hud, .exhibition-panel, .crayon-dialogue, .seat-action, .board-launch, .cozy-phone-launch, .exhibition-phone, .somangi-controls')];
        for (const node of this.observed) if (!blockers.includes(node)) { this.resize.unobserve(node); this.observed.delete(node); }
        for (const node of blockers) if (!this.observed.has(node)) { this.resize.observe(node); this.observed.add(node); }
        this.element.hidden = false;
        const own = this.element.getBoundingClientRect();
        if (!own.width || !own.height) return; // Title, modal or minigame hides all HUD chrome in CSS.
        const margin = innerWidth <= 600 ? 12 : 24;
        const obstacles = blockers.filter(node => getComputedStyle(node).visibility !== 'hidden')
            .map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
        let top = margin;
        for (let attempt = 0; attempt <= obstacles.length; attempt++) {
            const hits = obstacles.filter(rect => margin < rect.right + 12 && margin + own.width > rect.left - 12
                && top < rect.bottom + 12 && top + own.height > rect.top - 12);
            if (!hits.length) break;
            top = Math.max(...hits.map(rect => rect.bottom + 12));
        }
        this.element.style.left = `${margin}px`;
        this.element.style.top = `${top}px`;
        this.element.hidden = top + own.height > innerHeight - margin;
    }
    destroy() {
        cancelAnimationFrame(this.frame); this.resize.disconnect(); this.mutations.disconnect();
        window.removeEventListener('resize', this.onResize); this.element.remove();
    }
}
