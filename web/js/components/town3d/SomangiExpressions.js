import * as THREE from '../../../vendor/three/three.module.js';
import { SOMANGI_EXPRESSIONS, somangiAssetUrl } from '../../data/somangiModels.js';
const cache = new Map();
function loadFace(id, assetUrl) {
    const key = assetUrl(`faces/${id}.png`);
    if (!cache.has(key)) {
        const loader = new THREE.TextureLoader();
        cache.set(key, Promise.all(['', '-specular'].map(suffix => loader.loadAsync(assetUrl(`faces/${id}${suffix}.png`))))
            .then(([map, specular]) => {
                map.flipY = specular.flipY = false;
                map.colorSpace = THREE.SRGBColorSpace; specular.colorSpace = THREE.NoColorSpace;
                return { map, specular };
            }).catch(error => { cache.delete(key); throw error; }));
    }
    return cache.get(key);
}
export class SomangiExpressions {
    constructor(assetUrl = somangiAssetUrl) { this.assetUrl = assetUrl; this.id = 'smile'; this.revision = 0; this.materials = new Map(); }
    register(model) {
        model.traverse(mesh => {
            if (!mesh.isMesh) return;
            for (const mat of [mesh.material].flat()) {
                if (!/^(Expression_.*_(skin|ink)|Material_0|Face_ink_nonmetal)$/.test(mat.name)) continue;
                if (!this.materials.has(mat)) this.materials.set(mat, { map: mat.map, specular: mat.specularIntensityMap });
            }
        }); this.apply();
    }
    async set(id) {
        if (!SOMANGI_EXPRESSIONS.includes(id)) return false;
        const revision = ++this.revision, maps = id === 'smile' ? null : await loadFace(id, this.assetUrl);
        if (revision !== this.revision) return false;
        this.id = id; this.maps = maps; this.apply(); return true;
    }
    apply() {
        for (const [mat, original] of this.materials) {
            const maps = this.maps || original;
            mat.map = maps.map; mat.specularIntensityMap = maps.specular; mat.metalness = 0; mat.needsUpdate = true;
        }
    }
}
