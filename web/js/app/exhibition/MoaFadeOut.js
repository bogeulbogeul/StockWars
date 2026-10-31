import { animate } from './HandoffMotion.js';

export async function fadeOutMoa(root) {
    if (!root?.visible) return;
    const meshes = [];
    root.traverse(mesh => {
        if (!mesh.isMesh) return;
        const original = mesh.material;
        const materials = (Array.isArray(original) ? original : [original]).map(material => {
            const copy = material.clone();
            copy.onBeforeCompile = material.onBeforeCompile;
            copy.customProgramCacheKey = material.customProgramCacheKey;
            copy.transparent = true;
            copy.depthWrite = false;
            return { copy, opacity: material.opacity };
        });
        meshes.push({ mesh, original, materials, castShadow: mesh.castShadow });
        mesh.material = Array.isArray(original) ? materials.map(m => m.copy) : materials[0].copy;
        mesh.castShadow = false;
    });
    try {
        await animate(.55, t => {
            for (const { materials } of meshes)
                for (const { copy, opacity } of materials) copy.opacity = opacity * (1 - t);
        });
        root.visible = false;
    } finally {
        for (const { mesh, original, materials, castShadow } of meshes) {
            mesh.material = original;
            mesh.castShadow = castShadow;
            for (const { copy } of materials) copy.dispose();
        }
    }
}
