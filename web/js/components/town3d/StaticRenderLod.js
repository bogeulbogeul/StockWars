import { Mesh } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';

const PARTS = ['Bank_Continuous_Joined_Eaves', 'Porch_Continuous_Timber_Frame'];
// These two authored parts each contain 1.5M triangles. Their source meshes
// remain untouched for collisions and queries; only rendering uses the copies.
export class StaticRenderLod {
    constructor(scene) { this.scene = scene; this.parts = []; this.enabled = true; }
    async load() {
        const loader = new GLTFLoader();
        await Promise.all(PARTS.map(async name => {
            const source = this.scene.getObjectByName(name);
            if (!source) return;
            try {
                const url = new URL(`../../../assets/buildings/3d/render-lite-v1/${name}.glb`, import.meta.url);
                const gltf = await loader.loadAsync(url.href);
                let geometry;
                gltf.scene.traverse(mesh => { if (mesh.isMesh) geometry = mesh.geometry; });
                if (!geometry) return;
                const proxy = new Mesh(geometry, source.material);
                proxy.name = `${name}-render-lite`; proxy.userData.renderOnly = true;
                proxy.matrixAutoUpdate = false; proxy.frustumCulled = false;
                proxy.renderOrder = source.renderOrder; proxy.layers.mask = source.layers.mask;
                proxy.castShadow = source.castShadow; proxy.receiveShadow = source.receiveShadow;
                proxy.raycast = () => {}; proxy.visible = false;
                this.scene.add(proxy); this.parts.push({ source, proxy });
            } catch (error) { console.warn('경량 렌더링 대신 원본을 사용합니다.', name, error.message); }
        }));
    }
    render(draw) {
        if (!this.enabled) return draw();
        const active = [];
        try {
            for (const part of this.parts) {
                let visible = true;
                for (let node = part.source; node && node !== this.scene; node = node.parent) {
                    if (!node.visible) { visible = false; break; }
                }
                if (!visible) continue;
                part.source.updateWorldMatrix(true, false);
                part.proxy.matrix.copy(part.source.matrixWorld);
                part.proxy.visible = true; active.push(part); part.source.visible = false;
            }
            return draw();
        } finally {
            for (const { source, proxy } of active) { source.visible = true; proxy.visible = false; }
        }
    }
}
