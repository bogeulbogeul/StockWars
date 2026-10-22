import * as THREE from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { SOMANGI_HEIGHT } from '../../data/somangiModels.js';

// The current shared-body Anna asset keeps its authored seat plane at y=0.
export async function addSleepingAnna(scene, stop) {
    if (!stop) return null;
    const { scene: model, animations } = await new GLTFLoader().loadAsync(
        new URL('../../../assets/characters/3d/anna/bench-doze.glb', import.meta.url).href);
    model.name = 'anna-bus-stop-sleeping';
    model.scale.setScalar(SOMANGI_HEIGHT / 1.95);
    const seat = stop.getObjectByName('Bench_Seat');
    if (!seat) return null;
    const bounds = new THREE.Box3().setFromObject(seat);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.set(center.x, bounds.max.y, center.z);
    scene.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map(['Bench_Seated', 'Seated_Doze'].map(name => {
        const clip = animations.find(clip => clip.name === name);
        if (!clip) throw new Error(`Missing Moa clip: ${name}`);
        return [name, mixer.clipAction(clip)];
    }));
    const face = model.getObjectByName('Somangi_Body').material;
    const sleepingMap = face.map;
    const smilingMap = await new THREE.TextureLoader().loadAsync(
        new URL('../../../assets/characters/3d/anna/smile-basecolor.png', import.meta.url).href);
    smilingMap.flipY = false;
    smilingMap.colorSpace = THREE.SRGBColorSpace;
    smilingMap.wrapS = sleepingMap.wrapS;
    smilingMap.wrapT = sleepingMap.wrapT;
    model.traverse(object => { if (object.isMesh) object.frustumCulled = false; });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 60px sans-serif';
    ctx.fillStyle = '#f8f1d2';
    ctx.shadowColor = '#596777'; ctx.shadowBlur = 6;
    ctx.fillText('Z z', 10, 82);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false }));
    sprite.scale.set(42, 42, 1);
    sprite.name = 'anna-sleep-indicator';
    scene.add(sprite);
    let time = 0;
    let awake = null;
    function setAwake(value) {
        if (awake === value) return;
        awake = value;
        mixer.stopAllAction();
        actions.get(awake ? 'Bench_Seated' : 'Seated_Doze').reset().play();
        face.map = awake ? smilingMap : sleepingMap;
        face.needsUpdate = true;
        sprite.visible = !awake;
        model.userData.moaState = awake ? 'smile' : 'doze';
        mixer.update(0);
    }
    setAwake(false);
    return {
        model,
        update(dt, playerPosition) {
            time += Math.min(dt, .1);
            if (playerPosition) {
                const distance = Math.hypot(playerPosition.x - center.x, playerPosition.z - center.z);
                setAwake(distance < (awake ? 170 : 130));
            }
            mixer.update(Math.min(dt, .1));
            sprite.position.set(center.x + 45, bounds.max.y + 110 + 4 * Math.sin(time * 1.5), center.z);
        }
    };
}
