import { TownRenderCulling } from '../../components/town3d/TownRenderCulling.js';
import { TownStaticBatches } from '../../components/town3d/TownStaticBatches.js';
import { StaticInstances } from '../../components/town3d/StaticInstances.js';
import { StaticRenderLod } from '../../components/town3d/StaticRenderLod.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { addGameLights } from '../../components/lighting/GameLighting.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { TownLandscape } from '../../components/town3d/TownLandscape.js';
import { TOWN_MODEL_BUILDINGS, GROUND_PROJECTION, modelAssetUrl } from '../../data/townModelBuildings.js';
import { TOWN_MODEL_PROPS, propAssetUrl } from '../../data/townModelProps.js';
import { fitTownProp } from '../../components/town3d/TownObjectFit.js';

// Borrow the running village; isolated previews use the same assets and layout.
export async function getArrivalVillage() {
    const live = window.stockWarsExhibition?.scenes?.townModelScene || window.stockWarsApp?.townModelScene;
    if (live) {
        await live.ready;
        live.arrivalActive = true;
        live.dialogueOcclusion?.reset();
        await live.sleepingAnna?.setAwake(false);
        return { scene: live.scene, landscape: live.landscape, renderCulling: live.renderCulling, live, owned: false };
    }
    const scene = new THREE.Scene();
    addGameLights(scene);
    const landscape = new TownLandscape(scene);
    const renderCulling = new TownRenderCulling();
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
        model.name = d.id; model.userData.dialogueOccluder = true;
        landscape.wrap(model);
        landscape.addContactShadow(model);
        scene.add(model); renderCulling.add(model); renderCulling.add(model.contactShadow);
    }));
    renderCulling.lod = new StaticRenderLod(scene); await renderCulling.lod.load();
    renderCulling.instances = new StaticInstances(scene, scene.children.filter(root => root.userData.dialogueOccluder));
    renderCulling.batches = new TownStaticBatches(scene);
    return { scene, landscape, renderCulling, owned: true };
}
