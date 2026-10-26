import * as THREE from '../../../vendor/three/three.module.js';
import { GAME_LIGHTING as profile } from '../../data/gameLighting.js';

export function configureGameRenderer(renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = profile.exposure;
}

export function addGameLights(scene, shadows = false) {
    const ambient = new THREE.HemisphereLight(profile.skyColor, profile.groundColor, profile.ambientIntensity);
    ambient.name = 'game-ambient-light';
    const key = new THREE.DirectionalLight(profile.keyColor, profile.keyIntensity);
    key.name = 'game-key-light';
    key.position.set(...profile.direction);
    key.castShadow = shadows;
    key.shadow.intensity = profile.shadowIntensity;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -800, right: 800, top: 800, bottom: -800, near: 1, far: 3000 });
    key.shadow.bias = -.0004;
    scene.add(ambient, key);
    scene.backgroundIntensity = profile.backgroundIntensity;
    scene.userData.gameLighting = profile;
    return key;
}

export function addGameEnvironment(scene, renderer) {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0xdce1e6);
    const generator = new THREE.PMREMGenerator(renderer);
    const target = generator.fromScene(studio);
    generator.dispose();
    scene.environment = target.texture;
    scene.environmentIntensity = profile.environmentIntensity;
    return target;
}

export function applyGameLighting(scene, renderer, shadows = false) {
    configureGameRenderer(renderer);
    addGameLights(scene, shadows);
    renderer.shadowMap.enabled = shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return addGameEnvironment(scene, renderer);
}
