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
    let disposed = false, bus, mixer, clip, village, environment, removeForest, playerVisibility;
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
            bus.rotation.y = Math.PI;
            bus.scale.setScalar(busScale);
            bus.position.set(stopX + 3000, 0, busZ);
            mixer = new THREE.AnimationMixer(bus);
            clip = gltf.animations.find(a => a.name === 'Wheel_Roll') || gltf.animations[0];
            if (clip) mixer.clipAction(clip).play();
        }),
        getArrivalVillage().then(result => {
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
            removeForest = addArrivalForest(village.scene, village.landscape);
        })
    ]).then(() => { if (!disposed) village.scene.add(bus); });
    const resize = () => {
        if (!renderer) return;
        const { width, height } = host.getBoundingClientRect();
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
            renderer.render(village.scene, camera);
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
        }
    };
}
