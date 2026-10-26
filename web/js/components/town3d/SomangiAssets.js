import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SOMANGI_MODELS, somangiAssetUrl } from '../../data/somangiModels.js';

const assets = new Map();
export async function loadSomangi(name) {
    const url = somangiAssetUrl(SOMANGI_MODELS[name].file);
    return loadCharacterAsset(url);
}
export async function loadCharacterAsset(url) {
    if (!assets.has(url)) assets.set(url, new GLTFLoader().loadAsync(url).catch(error => { assets.delete(url); throw error; }));
    const source = await assets.get(url), model = source.scene.clone(true);
    const nodes = new Map(), materials = new Map();
    function pair(original, clone) {
        nodes.set(original, clone);
        original.children.forEach((child, i) => pair(child, clone.children[i]));
    }
    pair(source.scene, model);
    function material(original) {
        if (!materials.has(original)) materials.set(original, original.clone());
        return materials.get(original);
    }
    source.scene.traverse(original => {
        const clone = nodes.get(original);
        if (original.isMesh) {
            clone.material = Array.isArray(original.material) ? original.material.map(material) : material(original.material);
            clone.frustumCulled = false;
        }
        if (original.isSkinnedMesh) {
            clone.skeleton = original.skeleton.clone();
            clone.skeleton.bones = original.skeleton.bones.map(bone => nodes.get(bone));
            clone.bind(clone.skeleton, original.bindMatrix.clone());
        }
    });
    return { model, animations: source.animations };
}
