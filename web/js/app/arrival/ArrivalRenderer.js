import * as THREE from '../../../vendor/three/three.module.js';
import { configureGameRenderer } from '../../components/lighting/GameLighting.js';

// Render targets such as the town's environment map belong to its WebGL context.
// Borrow that context for the cinematic so materials keep identical lighting.
export function acquireArrivalRenderer(host, live) {
    const renderer = live?.renderer || new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const canvas = renderer.domElement;
    const visibility = canvas.style.visibility;
    const parent = canvas.parentNode, next = canvas.nextSibling;
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    if (!live?.renderer) {
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
        configureGameRenderer(renderer);
    }
    // A borrowed canvas still contains its previous (possibly half-loaded) town
    // frame. Reveal it only after the cinematic has drawn its complete scene.
    canvas.style.visibility = 'hidden';
    host.append(canvas);
    return {
        renderer,
        reveal() { canvas.style.visibility = visibility; },
        dispose() {
            canvas.style.visibility = visibility;
            if (live?.renderer) {
                renderer.setPixelRatio(pixelRatio);
                renderer.setSize(size.x, size.y);
                parent?.insertBefore(canvas, next?.parentNode === parent ? next : null);
                // The game window may have changed size while this canvas was
                // borrowed. Fit the restored canvas to its current viewport.
                live.resize?.();
            } else {
                renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
            }
        }
    };
}
