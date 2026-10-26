import * as THREE from '../../../vendor/three/three.module.js';
import { configureGameRenderer } from '../../components/lighting/GameLighting.js';

// Render targets such as the town's environment map belong to its WebGL context.
// Borrow that context for the cinematic so materials keep identical lighting.
export function acquireArrivalRenderer(host, live) {
    const renderer = live?.renderer || new THREE.WebGLRenderer({ antialias: true });
    const canvas = renderer.domElement;
    const parent = canvas.parentNode, next = canvas.nextSibling;
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    if (!live?.renderer) {
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
        configureGameRenderer(renderer);
    }
    host.append(canvas);
    return {
        renderer,
        dispose() {
            if (live?.renderer) {
                renderer.setPixelRatio(pixelRatio);
                renderer.setSize(size.x, size.y);
                parent?.insertBefore(canvas, next?.parentNode === parent ? next : null);
            } else {
                renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
            }
        }
    };
}
