// Bounds measured from the final v7 atlas; each frame is anchored at its feet.
const FRAMES = {
    down: [[199, 35, 389, 391], [477, 35, 668, 393], [729, 35, 919, 392]],
    left: [[198, 401, 398, 756], [478, 402, 679, 756], [740, 402, 939, 758]],
    right: [[222, 763, 422, 1118], [481, 764, 682, 1118], [761, 764, 960, 1120]],
    up: [[199, 1123, 392, 1444], [477, 1124, 671, 1445], [751, 1124, 945, 1446]]
};
const WALK = [0, 1, 2, 1];
// Keep the route inside the open floor, away from the exit.
const ROUTE = [[1.2, 4.8], [2.6, 6.2], [4.4, 4.4], [3, 3], [2.2, 3.8]];

export class OfficeAnna {
    constructor(layer) {
        this.x = 2.2;
        this.y = 3.8;
        this.direction = 'down';
        this.phase = 0;
        this.wait = 2.5;
        this.routeIndex = 0;
        this.moving = false;
        this.lastFrame = '';
        const atlas = new URL('../../../assets/characters/anna/anna-walk-4direction-v7.png', import.meta.url).href;
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.element.id = 'isoAnnaCharacter';
        this.element.setAttribute('pointer-events', 'all');
        this.element.setAttribute('cursor', 'pointer');
        this.element.setAttribute('role', 'img');
        this.element.setAttribute('aria-label', '오피스 매니저 안나');
        this.element.innerHTML = `
            <ellipse cx="0" cy="0" rx="15" ry="6" fill="rgba(0,0,0,0.18)" />
            <svg class="office-anna-sprite" overflow="hidden" preserveAspectRatio="none">
                <image href="${atlas}" width="1086" height="1448" />
            </svg>`;
        this.sprite = this.element.querySelector('.office-anna-sprite');
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onTalkToAnna) this.onTalkToAnna();
        });
        this.updateAvailability(new Date().getHours());
        layer.appendChild(this.element);
        this.render();
    }

    updateAvailability(hour, marriageCompleted = false) {
        this.visible = hour >= 6 || marriageCompleted === true;
        this.element.style.display = this.visible ? '' : 'none';
        this.element.setAttribute('aria-hidden', String(!this.visible));
    }

    resetForGameStart() {
        this.x = 2.2;
        this.y = 3.8;
        this.direction = 'down';
        this.phase = 0;
        this.wait = 2.5;
        this.routeIndex = 0;
        this.moving = false;
        this.render();
    }

    update(dt, player, paused = false) {
        paused = paused || !this.visible;
        this.moving = false;
        if (!paused && this.wait > 0) {
            this.wait = Math.max(0, this.wait - dt);
        } else if (!paused) {
            const [targetX, targetY] = ROUTE[this.routeIndex];
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const distance = Math.hypot(dx, dy);
            const step = Math.min(distance, dt * 0.65);
            if (distance > 0.001) {
                const nextX = this.x + dx / distance * step;
                const nextY = this.y + dy / distance * step;
                // Permit moving away if the player walked into Anna's space.
                const separation = Math.hypot(nextX - player.x, nextY - player.y);
                const previousSeparation = Math.hypot(this.x - player.x, this.y - player.y);
                if (separation >= 0.7 || separation > previousSeparation) {
                    this.x = nextX;
                    this.y = nextY;
                    const screenX = (dy - dx) * 33.75;
                    const screenY = (dx + dy) * 19.1;
                    this.direction = Math.abs(screenX) > Math.abs(screenY)
                        ? (screenX < 0 ? 'left' : 'right') : (screenY < 0 ? 'up' : 'down');
                    this.moving = step > 0;
                    this.phase += dt * 6;
                }
            }
            if (distance <= step + 0.001) {
                this.routeIndex = (this.routeIndex + 1) % ROUTE.length;
                this.wait = 2.5;
                this.moving = false;
            }
        }
        if (!this.moving) this.phase = 0;
        this.render();
    }

    render() {
        const column = this.moving ? WALK[Math.floor(this.phase) % WALK.length] : 1;
        const key = `${this.direction}:${column}`;
        if (key !== this.lastFrame) {
            const [left, top, right, bottom] = FRAMES[this.direction][column];
            const width = right - left;
            const height = bottom - top;
            // Rear views have shorter drawn proportions: normalize height across directions.
            const scale = 90 / height;
            this.sprite.setAttribute('viewBox', `${left - 2} ${top - 2} ${width + 4} ${height + 4}`);
            this.sprite.setAttribute('x', -(width / 2 + 2) * scale);
            this.sprite.setAttribute('y', -(height + 2) * scale);
            this.sprite.setAttribute('width', (width + 4) * scale);
            this.sprite.setAttribute('height', (height + 4) * scale);
            this.element.dataset.direction = this.direction;
            this.element.dataset.frame = String(column);
            this.lastFrame = key;
        }
        this.element.dataset.moving = String(this.moving);
        this.element.setAttribute('transform', `translate(${500 + (this.y - this.x) * 33.75},${320 + (this.x + this.y + 1) * 19.1})`);
    }
}
