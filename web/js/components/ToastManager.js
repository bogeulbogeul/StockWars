/**
 * ToastManager Component
 * Unity equivalent: TooltipManager.cs / ToastHUD.cs
 * Quiet paper notices, shared by gameplay feedback and level growth.
 */

export class ToastManager {
    constructor(container) {
        this.container = container;
        this.render();
    }

    render() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
        this.container.className = 'game-notice-stack';
        this.container.ariaLive = 'polite';
        this.container.ariaAtomic = 'false';
    }

    setQuietMode(enabled) {
        const entering = enabled && !this.quiet;
        this.quiet = !!enabled;
        // Discard queued visual notices; do not replay them after the tutorial.
        if (entering) this.container?.replaceChildren();
    }

    showLevelUp(level) {
        this.show(`레벨 ${level}이 되었어요`, true, 2500, 'level');
    }

    show(message, isSuccess = true, duration = 2500, kind = '') {
        if (this.quiet && isSuccess) return;
        if (!this.container) this.render();

        const toast = document.createElement('div');
        toast.className = `game-notice${kind === 'level' ? ' game-notice--level' : ''}${isSuccess ? '' : ' game-notice--error'}`;
        toast.setAttribute('role', 'status');
        if (kind === 'level') {
            const mark = document.createElement('span');
            mark.className = 'game-notice-mark';
            mark.setAttribute('aria-hidden', 'true');
            mark.innerHTML = '<svg viewBox="0 0 32 32" fill="none"><path d="M16 26V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 18C7 19 5 12 6 8c7-1 12 3 10 10Zm0-4C16 7 21 4 27 5c1 7-4 12-11 9Z" fill="currentColor"/></svg>';
            toast.append(mark);
        }
        const text = document.createElement('span');
        text.className = 'game-notice-text';
        text.textContent = message;
        toast.append(text);

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(6px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

export const toastManager = new ToastManager(document.getElementById('toastContainer'));
