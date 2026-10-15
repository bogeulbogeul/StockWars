/**
 * ToastManager Component
 * Unity equivalent: TooltipManager.cs / ToastHUD.cs
 * Manages floating toast notifications with custom colors and auto-dismiss.
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
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    setQuietMode(enabled) {
        const entering = enabled && !this.quiet;
        this.quiet = !!enabled;
        // Discard queued visual notices; do not replay them after the tutorial.
        if (entering) this.container?.replaceChildren();
    }

    show(message, isSuccess = true, duration = 2500) {
        if (this.quiet && isSuccess) return;
        if (!this.container) this.render();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.borderColor = isSuccess ? 'var(--accent-cyan)' : 'var(--accent-red)';
        toast.textContent = message;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

export const toastManager = new ToastManager(document.getElementById('toastContainer'));
