/**
 * Canvas Stock Chart Renderer
 * Renders smooth high-precision Stock Line & Candlestick charts with gridlines,
 * price badge, and trend fill gradients.
 */

export class StockChartRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        this.width = rect.width;
        this.height = rect.height;
    }

    render(priceHistory = [], isPositive = true) {
        if (!this.ctx || priceHistory.length < 2) return;
        this.resize();

        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 20, right: 15, bottom: 25, left: 15 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const minPrice = Math.min(...priceHistory) * 0.98;
        const maxPrice = Math.max(...priceHistory) * 1.02;
        const range = maxPrice - minPrice || 1;

        // Draw Background Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        for (let i = 0; i <= 5; i++) {
            const x = padding.left + (chartW / 5) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Points calculation
        const points = priceHistory.map((val, idx) => {
            const x = padding.left + (idx / (priceHistory.length - 1)) * chartW;
            const y = padding.top + chartH - ((val - minPrice) / range) * chartH;
            return { x, y, val };
        });

        // Colors
        const lineColor = isPositive ? '#00e5ff' : '#ff3b5c';
        const gradTop = isPositive ? 'rgba(0, 229, 255, 0.35)' : 'rgba(255, 59, 92, 0.35)';
        const gradBot = isPositive ? 'rgba(0, 229, 255, 0.0)' : 'rgba(255, 59, 92, 0.0)';

        // Fill Area
        const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        fillGradient.addColorStop(0, gradTop);
        fillGradient.addColorStop(1, gradBot);

        ctx.fillStyle = fillGradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fill();

        // Stroke Line
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current Price Node Pulse
        const lastP = points[points.length - 1];
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(lastP.x, lastP.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Price Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round(lastP.val).toLocaleString()}G`, width - padding.right, lastP.y - 8);
    }
}
