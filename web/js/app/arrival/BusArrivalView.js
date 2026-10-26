import { TownStaticBatches } from '../../components/town3d/TownStaticBatches.js';
import { FrameBudget } from '../../components/town3d/FrameBudget.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { addGameEnvironment } from '../../components/lighting/GameLighting.js';
import { acquireArrivalRenderer } from './ArrivalRenderer.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { GROUND_PROJECTION, TOWN_CAMERA } from '../../data/townModelBuildings.js';
import { TOWN_BUS_ROAD } from '../../data/townBusRoad.js';
import { getArrivalVillage } from './ArrivalVillage.js';
import { SOMANGI_VIEW_HEIGHT } from '../../data/somangiModels.js';
import { TOWN_ARRIVAL } from '../../data/townLandscapeLayout.js';
import { addArrivalForest } from './ArrivalForest.js';
import { TOWN_BUS_MODEL_SCALE } from '../../data/townObjectScale.js';

function disposeModel(root) {
    const textures = new Set();
    root.traverse(o => {
        o.geometry?.dispose();
        for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
            if (!mat) continue;
            for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value);
            mat.dispose();
        }
    });
    textures.forEach(texture => texture.dispose());
}

export function createArrivalView(host) {
    const camera = new THREE.PerspectiveCamera(TOWN_CAMERA.fieldOfView, 1, 1, 20000);
    let renderer, rendererLease;
    const loader = new GLTFLoader();
    let disposed = false, bus, busBatches, mixer, clip, village, environment, removeForest, playerVisibility;
    const busScale = TOWN_BUS_MODEL_SCALE, stopX = TOWN_BUS_ROAD.stopX;
    const busZ = (TOWN_BUS_ROAD.centerY - TOWN_BUS_ROAD.width / 4) / GROUND_PROJECTION;
    const busBounds = new THREE.Box3(), viewFrustum = new THREE.Frustum(), viewProjection = new THREE.Matrix4();
    const centerX = 1650, centerZ = 4300;
    const releaseVillage = () => {
        if (!village?.live) return;
        village.live.arrivalActive = false;
        if (playerVisibility !== undefined && village.live.player?.root) {
            village.live.player.root.visible = playerVisibility;
        }
        village.live.sleepingAnna?.setSleepEffectEnabled(true);
    };
    const cleanupVillage = () => {
        if (!village?.owned) return;
        disposeModel(village.scene);
        village.scene.background?.dispose();
        village.landscape.pathsMap.dispose();
    };
    const load = async (path, setup) => {
        const gltf = await loader.loadAsync(new URL(path, import.meta.url).href);
        if (disposed) { disposeModel(gltf.scene); return; }
        gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        setup(gltf);
    };
    const ready = Promise.all([
        load('../../../assets/cinematics/bus/Popori-bus-animated.glb', gltf => {
            bus = gltf.scene;
            const fastGlass = new Map();
            bus.traverse(mesh => {
                if (!mesh.isMesh) return;
                const material = original => {
                    if (!original.transmission && !original.transparent) return original;
                    if (!fastGlass.has(original)) {
                        const copy = original.clone();
                        if (copy.transmission > 0) { copy.transmission = 0; copy.transparent = true; copy.opacity = Math.min(copy.opacity, .24); copy.depthWrite = false; }
                        copy.forceSinglePass = true; fastGlass.set(original, copy);
                    }
                    return fastGlass.get(original);
                };
                mesh.material = Array.isArray(mesh.material) ? mesh.material.map(material) : material(mesh.material);
            });
            bus.rotation.y = Math.PI;
            bus.scale.setScalar(busScale);
            bus.position.set(stopX + 3000, 0, busZ);
            mixer = new THREE.AnimationMixer(bus);
            clip = gltf.animations.find(a => a.name === 'Wheel_Roll') || gltf.animations[0];
            if (clip) mixer.clipAction(clip).play();
            // Merge rigid bodywork in bus-local coordinates; animated wheels
            // keep their own meshes and clips and the original nodes remain.
            for (const animation of gltf.animations) for (const track of animation.tracks) {
                const name = THREE.PropertyBinding.parseTrackName(track.name).nodeName;
                bus.traverse(node => { if (node.name === name || node.uuid === name) node.userData.renderAnimated = true; });
            }
            const position = bus.position.clone(), rotation = bus.quaternion.clone(), scale = bus.scale.clone();
            bus.position.set(0, 0, 0); bus.quaternion.identity(); bus.scale.set(1, 1, 1); bus.updateMatrixWorld(true);
            busBatches = new TownStaticBatches(bus, { roots: [bus], maxTriangles: 8192 });
            bus.position.copy(position); bus.quaternion.copy(rotation); bus.scale.copy(scale); bus.updateMatrixWorld(true);
        }),
        getArrivalVillage().then(async result => {
            village = result;
            if (disposed) { releaseVillage(); cleanupVillage(); return; }
            if (village.live?.player?.root) {
                playerVisibility = village.live.player.root.visible;
                village.live.player.root.visible = false;
            }
            village.live?.sleepingAnna?.setSleepEffectEnabled(false);
            rendererLease = acquireArrivalRenderer(host, village.live);
            renderer = rendererLease.renderer;
            resize();
            if (!village.scene.environment) {
                environment = addGameEnvironment(village.scene, renderer);
            }
            host.dataset.villageModels = String(village.scene.children.filter(o => o.name).length);
            removeForest = await addArrivalForest(village.scene, village.landscape);
            if (disposed) { removeForest(); releaseVillage(); cleanupVillage(); }
        })
    ]).then(() => { if (!disposed) village.scene.add(bus); });
    let frameBudget;
    const resize = () => {
        if (!renderer) return;
        const { width, height } = host.getBoundingClientRect();
        frameBudget ||= new FrameBudget(renderer, village?.scene);
        frameBudget.resize(width, height);
        renderer.setSize(width, height);
        camera.aspect = width / Math.max(1, height);
        const visibleHeight = Math.max(3000, 4400 / camera.aspect);
        const distance = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const pitch = THREE.MathUtils.degToRad(TOWN_CAMERA.pitchDegrees);
        camera.position.set(centerX, Math.sin(pitch) * distance, centerZ + Math.cos(pitch) * distance);
        camera.lookAt(centerX, 0, centerZ);
        camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    return {
        ready,
        render(distance, playerView = 0, stopped = distance >= 10) {
            if (disposed || !bus || !village) return;
            frameBudget?.tick(performance.now());
            if (village.live?.player?.root) village.live.player.root.visible = stopped && playerVisibility;
            // The coach faces -X and always enters from screen right.
            bus.position.x = stopX + 3000 * (1 - distance / 10);
            const t = playerView * playerView * (3 - 2 * playerView);
            const targetX = THREE.MathUtils.lerp(centerX, TOWN_ARRIVAL.x, t);
            const targetZ = THREE.MathUtils.lerp(centerZ, (TOWN_ARRIVAL.y - 60) / GROUND_PROJECTION, t);
            const height = THREE.MathUtils.lerp(Math.max(3000, 4400 / camera.aspect), SOMANGI_VIEW_HEIGHT, t);
            const d = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
            const pitch = THREE.MathUtils.degToRad(TOWN_CAMERA.pitchDegrees);
            camera.position.set(targetX, Math.sin(pitch) * d, targetZ + Math.cos(pitch) * d);
            camera.lookAt(targetX, 0, targetZ);
            camera.updateMatrixWorld();
            bus.updateMatrixWorld(true);
            viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            viewFrustum.setFromProjectionMatrix(viewProjection);
            const busVisible = viewFrustum.intersectsBox(busBounds.setFromObject(bus));
            village.live?.sleepingAnna?.setSleepEffectEnabled(stopped && distance > 10 && !busVisible);
            village.live?.player?.update(0);
            village.live?.sleepingAnna?.update(1 / 60);
            if (clip) mixer.setTime(distance * 300 / (Math.PI * 2 * .39 * busScale) * clip.duration);
            host.dataset.busX = bus.position.x.toFixed(4);
            host.dataset.wheelTime = mixer.time.toFixed(4);
            village.landscape.update(targetX, targetZ, { x: TOWN_ARRIVAL.x, y: TOWN_ARRIVAL.y });
            village.landscape.playerShadow.visible = false;
            const draw = () => village.renderCulling
                ? village.renderCulling.render(renderer, village.scene, camera, village.landscape.center.value)
                : renderer.render(village.scene, camera);
            const render = () => removeForest?.render ? removeForest.render(draw, camera.position.y > 1300) : draw();
            if (busBatches) busBatches.render(renderer, village.scene, camera, render);
            else render();
            rendererLease.reveal();
            const center = bus.position.clone().project(camera);
            const front = bus.localToWorld(new THREE.Vector3(2, 0, 0)).project(camera);
            host.dataset.screenX = center.x.toFixed(4);
            host.dataset.frontScreenX = front.x.toFixed(4);
            host.dataset.busVisible = String(busVisible);
            return { busVisible };
        },
        dispose() {
            disposed = true;
            releaseVillage();
            observer.disconnect();
            mixer?.stopAllAction();
            if (bus) mixer?.uncacheRoot(bus);
            if (bus) { bus.removeFromParent(); disposeModel(bus); }
            if (village) village.landscape.playerShadow.visible = false;
            removeForest?.();
            cleanupVillage();
            if (environment) {
                village.scene.environment = null;
                environment.dispose();
            }
            rendererLease?.dispose();
            if (village?.live?.frameBudget && frameBudget) {
                village.live.frameBudget.scale = Math.min(village.live.frameBudget.scale, frameBudget.scale);
                village.live.frameBudget.apply(); village.live.frameBudget.reset();
            }
        }
    };
}
