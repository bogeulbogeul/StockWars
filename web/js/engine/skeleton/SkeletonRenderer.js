import { SkeletonRig } from './SkeletonRig.js';
import { SlotSkinSystem } from './SlotSkinSystem.js';
import { AnimationEngine } from './AnimationEngine.js';

/**
 * SkeletonRenderer Class
 * High-performance 2D Canvas & WebGL-ready Skeletal Character Renderer.
 * Mounts into any DOM container and renders 60~120 FPS dynamic animated avatars.
 */
export class SkeletonRenderer {
    constructor(container, options = {}) {
        this.container = container;
        this.width = options.width || 240;
        this.height = options.height || 340;
        this.debugBones = options.debugBones || false;

        // Initialize Core Subsystems
        this.rig = new SkeletonRig();
        this.skinSystem = new SlotSkinSystem(this.rig);
        this.animEngine = new AnimationEngine(this.rig);

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'skeleton-avatar-canvas';
        this.ctx = this.canvas.getContext('2d');

        this.initCanvas();
        this.container.appendChild(this.canvas);

        // Render Loop state
        this.lastTime = performance.now();
        this.isRunning = true;
        this.rafId = null;

        this.startRenderLoop();
    }

    initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect crisp anime rendering
    }

    setDirection(dir) {
        this.rig.setDirection(dir);
        this.skinSystem.updateSkinTextures();
    }

    setCustomization(config) {
        this.skinSystem.setCustomization(config);
    }

    playAnimation(clipName, speed = 1.0) {
        this.animEngine.play(clipName, speed);
    }

    toggleDebugBones(enabled) {
        this.debugBones = enabled !== undefined ? enabled : !this.debugBones;
    }

    startRenderLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();

        const loop = (now) => {
            if (!this.isRunning) return;

            const deltaSeconds = Math.min((now - this.lastTime) / 1000, 0.1);
            this.lastTime = now;

            this.update(deltaSeconds);
            this.render();

            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    update(deltaTimeSeconds) {
        this.animEngine.update(deltaTimeSeconds);
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // 1. Render all active skin slots sorted by Z-order
        const sortedSlots = this.skinSystem.getSortedSlots();

        for (const slot of sortedSlots) {
            if (!slot.visible || !slot.texture) continue;

            const bone = this.rig.getBone(slot.boneName);
            if (!bone) continue;

            ctx.save();
            ctx.translate(bone.worldX, bone.worldY);
            ctx.rotate(bone.worldRotation);
            ctx.scale(bone.worldScaleX, bone.worldScaleY);

            // Draw image offset by pivot
            const drawW = slot.width || slot.texture.width;
            const drawH = slot.height || slot.texture.height;
            const drawX = -drawW * slot.pivotX + slot.offsetX;
            const drawY = -drawH * slot.pivotY + slot.offsetY;

            ctx.drawImage(slot.texture, drawX, drawY, drawW, drawH);
            ctx.restore();
        }

        // 2. Render Debug Skeleton Rig Wireframes if enabled
        if (this.debugBones) {
            this.renderDebugBones(ctx);
        }
    }

    renderDebugBones(ctx) {
        ctx.save();
        ctx.lineWidth = 2.5;

        for (const bone of this.rig.bones.values()) {
            // Draw joint circle
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(bone.worldX, bone.worldY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw line to children
            for (const child of bone.children) {
                ctx.strokeStyle = 'rgba(255, 214, 0, 0.85)';
                ctx.beginPath();
                ctx.moveTo(bone.worldX, bone.worldY);
                ctx.lineTo(child.worldX, child.worldY);
                ctx.stroke();
            }

            // Draw bone direction vector
            const endX = bone.worldX + Math.cos(bone.worldRotation) * (bone.length * 0.4);
            const endY = bone.worldY + Math.sin(bone.worldRotation) * (bone.length * 0.4);
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
            ctx.beginPath();
            ctx.moveTo(bone.worldX, bone.worldY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        ctx.restore();
    }
}
