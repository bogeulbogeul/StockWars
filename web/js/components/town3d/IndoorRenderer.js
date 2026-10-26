import { WebGLRenderer } from '../../../vendor/three/three.module.js';

// Only one interior is visible at a time. Sharing its context reuses character
// vertex buffers and textures instead of uploading them once per visited room.
let renderer;
export function getIndoorRenderer() {
    return renderer ||= new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
}
export function attachIndoorRenderer(owner) {
    if (!owner.renderer) return;
    owner.layer.prepend(owner.renderer.domElement);
    owner.renderer.domElement.setAttribute('aria-label', owner.layer.getAttribute('aria-label') || '실내 3D 화면');
}
