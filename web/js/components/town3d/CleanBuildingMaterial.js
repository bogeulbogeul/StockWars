// Runtime-only art treatment. Preserve the embedded maps and original GLBs.
import { LinearFilter } from '../../../vendor/three/three.module.js';

const CLEAN_MAP_SHADER = `
#ifdef USE_MAP
    // Median sampling rejects isolated bright texels along baked atlas seams.
    vec2 dx = dFdx(vMapUv) * 0.65;
    vec2 dy = dFdy(vMapUv) * 0.65;
    vec3 samples[9];
    int sampleIndex = 0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            samples[sampleIndex] = texture2D(map, vMapUv + float(x) * dx + float(y) * dy).rgb;
            sampleIndex++;
        }
    }
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 8; j++) {
            if (j >= i) {
                vec3 a = samples[i];
                vec3 b = samples[j + 1];
                samples[i] = min(a, b);
                samples[j + 1] = max(a, b);
            }
        }
    }
    diffuseColor.rgb *= samples[4];
#endif

`;

export function applyCleanBuildingMaterials(model, renderer) {
    const cache = new Map();
    model.traverse(object => {
        if (!object.isMesh) return;
        const clean = original => {
            if (cache.has(original)) return cache.get(original);
            const material = original.clone();
            material.name = `${original.name || 'building'}-clean`;
            material.normalScale?.set(0.2, 0.2);
            material.metalness = 0;
            material.metalnessMap = null;
            material.roughness = 0.9;
            material.roughnessMap = null;
            if (material.map) {
                material.map = material.map.clone();
                material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                material.map.minFilter = LinearFilter;
                material.map.generateMipmaps = false;
                material.map.needsUpdate = true;
            }
            material.onBeforeCompile = shader => {
                // Preserve original base colors; only reject isolated atlas speckles.
                shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', CLEAN_MAP_SHADER);
            };
            material.customProgramCacheKey = () => 'building-original-color-filter-v3';
            material.userData.originalMaterial = original;
            cache.set(original, material);
            return material;
        };
        object.material = Array.isArray(object.material)
            ? object.material.map(clean) : clean(object.material);
    });
}

