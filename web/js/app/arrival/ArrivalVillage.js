import * as THREE from '../../../vendor/three/three.module.js';
import { addGameLights } from '../../components/lighting/GameLighting.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TownLandscape } from '../../components/town3d/TownLandscape.js';
import { TOWN_MODEL_BUILDINGS, GROUND_PROJECTION, modelAssetUrl } from '../../data/townModelBuildings.js';
import { TOWN_MODEL_PROPS, propAssetUrl } from '../../data/townModelProps.js';
import { fitTownProp } from '../../components/town3d/TownObjectFit.js';

// Borrow the running village; isolated previews use the same assets and layout.
export async function getArrivalVillage() {
    const live = window.stockWarsApp?.townModelScene;
    if (live) {
        await live.ready;
        live.arrivalActive = true;
        return { scene: live.scene, landscape: live.landscape, live, owned: false };
    }
    const scene = new THREE.Scene();
    addGameLights(scene);
    const landscape = new TownLandscape(scene);
    const definitions = [
        ...TOWN_MODEL_BUILDINGS.map(d => ({ ...d, url: modelAssetUrl(d.file) })),
        ...TOWN_MODEL_PROPS.map(d => ({ ...d, url: propAssetUrl(d.file) }))
    ];
    const loader = new GLTFLoader(), assets = new Map();
    await Promise.all(definitions.map(async d => {
        if (!assets.has(d.url)) assets.set(d.url, loader.loadAsync(d.url));
        const model = (await assets.get(d.url)).scene.clone(true);
        model.rotation.y = d.rotation;
        model.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(model);
        const scale = d.width / bounds.getSize(new THREE.Vector3()).x;
        const center = bounds.getCenter(new THREE.Vector3());
        model.scale.multiplyScalar(scale);
        fitTownProp(model, d, scale);
        model.position.set(d.x - center.x * scale, -bounds.min.y * scale,
            d.y / GROUND_PROJECTION - bounds.max.z * scale);
        model.name = d.id;
        landscape.wrap(model);
        landscape.addContactShadow(model);
        scene.add(model);
    }));
    return { scene, landscape, owned: true };
}
