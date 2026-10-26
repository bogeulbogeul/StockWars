import { FrameBudget } from './FrameBudget.js';
import { StaticRenderLod } from './StaticRenderLod.js';
import { worldRenderVisible } from './WorldRenderVisibility.js';
import { StaticInstances } from './StaticInstances.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { applyGameLighting } from '../lighting/GameLighting.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { applyCleanBuildingMaterials } from './CleanBuildingMaterial.js';
import { TOWN_MODEL_BUILDINGS, TOWN_CAMERA, TOWN_PREVIEW_FRAME, GROUND_PROJECTION, modelAssetUrl } from '../../data/townModelBuildings.js';
import { TOWN_MODEL_PROPS, propAssetUrl } from '../../data/townModelProps.js';
import { SomangiPlayer } from './SomangiPlayer.js';
import { SOMANGI_VIEW_HEIGHT } from '../../data/somangiModels.js';
import { installModelPreviewCollision } from './TownModelCollision.js';
import { TownLandscape } from './TownLandscape.js';
import { addSleepingAnna } from './SleepingAnna.js';
import { BuildingClock } from './BuildingClock.js';
import { fitTownProp } from './TownObjectFit.js';
import { createTownPropBodies } from './TownPropBodies.js';
import { createCharacterBodies, charactersCanStand } from './CharacterBodies.js';
import { createExteriorBuildingBodies } from './ExteriorBuildingBodies.js';
import { createJumpBodies, installJumpCollision } from './JumpCollision.js';
import { BusStopSeat } from './BusStopSeat.js';
import { SeatInteraction } from './SeatInteraction.js';
import { townSeatSurfaces } from './SeatSurfaces.js';
import { busStopSolidMesh, busStopPlatform } from './BusStopGround.js';
import { getTownMusic } from '../../engine/TownMusic.js';
import { createConversationCamera } from './ConversationCamera.js';
import { createDialogueOcclusion } from './DialogueOcclusion.js';
import { isCharacterSpeaking } from './SpeechVisibility.js';
import { TownRenderCulling } from './TownRenderCulling.js';
import { TownStaticBatches } from './TownStaticBatches.js';
import { ExteriorDoorProximity } from './ExteriorDoors.js';

// Separate from the retained sprite stage: both use the same ground coordinates.
export class TownModelScene {
    constructor(town) {
        this.town = town;
        this.music = getTownMusic();
        this.viewport = town.viewportEl;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(TOWN_CAMERA.fieldOfView, 1, 1, 12000);
        this.layer = document.createElement('section');
        this.layer.className = 'town-model-layer';
        this.layer.setAttribute('aria-label', '건물·정류장·광장 쉼터가 배치된 마을');
        this.status = document.createElement('p');
        this.status.className = 'town-model-status';
        this.status.setAttribute('role', 'status');
        this.status.textContent = '마을 건물과 쉼터를 불러오는 중…';
        this.layer.append(this.status);
        this.viewport.append(this.layer);
        this.labels = [];
        this.buildingClocks = [];
        this.collisionFootprints = [];
        this.jumpCollisionBodies = [];
        this.renderCulling = new TownRenderCulling();
        this.lastDrawTime = performance.now();
        this.ready = this.initialize().catch(error => {
            this.status.hidden = false;
            this.status.textContent = '3D 건물을 표시하지 못했습니다. 새로고침해 주세요.';
            console.error('Town building models:', error);
        });
    }

    async initialize() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        this.frameBudget = new FrameBudget(this.renderer, this.scene);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.setClearColor(0, 0);
        this.renderer.domElement.setAttribute('aria-label', '건물 7곳·버스 정류장·나무·벤치·게시판·광고판');
        this.layer.prepend(this.renderer.domElement);
        this.environmentTarget = applyGameLighting(this.scene, this.renderer);
        this.landscape = new TownLandscape(this.scene);
        this.dialogueOcclusion = createDialogueOcclusion(this.scene);
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(this.viewport);
        this.resize();
        this.player = new SomangiPlayer(this.scene, this.town, this.layer);
        const loader = new GLTFLoader();
        const definitions = [
            ...TOWN_MODEL_BUILDINGS.map(definition => ({ ...definition, url: modelAssetUrl(definition.file) })),
            ...TOWN_MODEL_PROPS.map(definition => ({ ...definition, url: propAssetUrl(definition.file) }))
        ];
        const assets = new Map();
        const results = await Promise.allSettled(definitions.map(async definition => {
            if (!assets.has(definition.url)) assets.set(definition.url, loader.loadAsync(definition.url));
            const gltf = await assets.get(definition.url);
            const model = gltf.scene.clone(true);
            if (!definition.nativeMaterials) applyCleanBuildingMaterials(model, this.renderer);
            if (definition.clock) this.buildingClocks.push(new BuildingClock(model));
            model.rotation.y = definition.rotation;
            model.updateMatrixWorld(true);
            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            if (!Number.isFinite(size.x) || size.x <= 0) throw new Error('Invalid model bounds');
            const scale = definition.width / size.x;
            model.scale.multiplyScalar(scale);
            fitTownProp(model, definition, scale);
            const center = bounds.getCenter(new THREE.Vector3());
            // Front edge sits on the retained town's building ground-contact line.
            model.position.set(definition.x - center.x * scale, -bounds.min.y * scale,
                definition.y / GROUND_PROJECTION - bounds.max.z * scale);
            model.name = definition.id;
            model.userData.walkThrough = definition.file.startsWith('Flowers-mini-');
            model.userData.dialogueOccluder = true;
            model.userData.entryOccluder = /Tree|Popori/i.test(definition.file);
            this.landscape.wrap(model);
            this.landscape.addContactShadow(model);
            if (TOWN_MODEL_BUILDINGS.some(building => building.id === definition.id)) {
                this.collisionFootprints.push(...createExteriorBuildingBodies(model, definition.id));
            } else {
                this.collisionFootprints.push(...createTownPropBodies(model, definition.id,
                    definition.id==='village_bus_stop'?{includeMesh:busStopSolidMesh}:{}));
            }
            this.scene.add(model);
            this.dialogueOcclusion.prepare(model);
            this.renderCulling.add(model);
            this.renderCulling.add(model.contactShadow);
            this.jumpCollisionBodies.push(...createJumpBodies(model, definition.id, {
                supportHeight:definition.id==='village_bus_stop'?busStopPlatform(model)?.max.y||0:0
            }));
        }));
        this.loadedCount = results.filter(result => result.status === 'fulfilled').length;
        if (this.loadedCount !== definitions.length) {
            this.status.textContent = `마을 요소 ${this.loadedCount}/${definitions.length}개 표시됨 · 일부 모델을 불러오지 못했습니다.`;
            results.filter(result => result.status === 'rejected').forEach(result => console.error(result.reason));
        } else this.status.hidden = true;
        await this.player.ready;
        this.sleepingAnna = await addSleepingAnna(this.scene, this.scene.getObjectByName('village_bus_stop'));
        this.characterBodies = createCharacterBodies(this.scene);
        this.landscape.wrap(this.player.root);
        installModelPreviewCollision(this.town.playerController, this.collisionFootprints);
        const controller = this.town.playerController;
        const sceneryCanStand = controller.canStand;
        controller.sceneryCanStand = sceneryCanStand;
        controller.canStand = (x, y) => sceneryCanStand(x, y)
            && charactersCanStand(this.characterBodies, x, y / GROUND_PROJECTION);
        installJumpCollision(controller, controller.canStand, this.jumpCollisionBodies);
        this.busSeat=new BusStopSeat(this,this.scene.getObjectByName('village_bus_stop'));
        this.seatInteraction=new SeatInteraction(this,townSeatSurfaces(this.scene));
        this.exteriorDoors = new ExteriorDoorProximity(this.scene);
        this.renderCulling.lod = new StaticRenderLod(this.scene);
        await this.renderCulling.lod.load();
        this.renderCulling.instances = new StaticInstances(this.scene, this.scene.children.filter(root => root.userData.dialogueOccluder));
        this.renderCulling.batches = new TownStaticBatches(this.scene);
        this.draw();
    }

    resize() {
        const width = this.viewport.clientWidth;
        const height = this.viewport.clientHeight;
        if (!width || !height || !this.renderer) return;
        if (this.width === width && this.height === height) return;
        this.width = width;
        this.height = height;
        this.frameBudget.resize(width, height);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    draw() {
        const now = performance.now();
        if (this.landscape) {
            this.music.update(this.landscape.sky.currentStage(now), {
                active: !document.body.classList.contains('title-screen-active')
                    && (!window.stockWarsExhibition || !!window.stockWarsExhibition.started),
                indoors: document.body.classList.contains('home-model-active')
                    || document.body.classList.contains('cipher-lobby-active')
            });
        }
        const dt = (now - this.lastDrawTime) / 1000;
        this.lastDrawTime = now;
        this.seatInteraction?.update(dt);
        if (this.arrivalActive || !this.renderer || this.town.containerEl.classList.contains('hidden') || !worldRenderVisible()) { this.frameBudget?.reset(); return; }
        this.frameBudget.tick(now);
        this.resize();
        const { cameraX, cameraY } = this.town.playerController;
        const preview = document.body.classList.contains('town-model-mode');
        if (preview && !this.previewCameraOrigin) this.previewCameraOrigin = { x: cameraX, y: cameraY };
        const followPlayer = this.player && this.player.state !== 'loading';
        const x = followPlayer ? this.town.playerController.charPosX
            : preview ? TOWN_PREVIEW_FRAME.x + cameraX - this.previewCameraOrigin.x
            : cameraX + this.viewport.clientWidth / 2;
        const groundY = followPlayer ? this.town.playerController.charPosY - 60
            : preview ? TOWN_PREVIEW_FRAME.y + cameraY - this.previewCameraOrigin.y
            : cameraY + this.viewport.clientHeight / 2;
        const z = groundY / GROUND_PROJECTION;
        const pitch = THREE.MathUtils.degToRad(TOWN_CAMERA.pitchDegrees);
        const visibleHeight = followPlayer ? SOMANGI_VIEW_HEIGHT : preview ? Math.max(TOWN_PREVIEW_FRAME.visibleHeight,
            TOWN_PREVIEW_FRAME.visibleWidth / this.camera.aspect) : this.viewport.clientHeight;
        const distance = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
        this.camera.position.set(x, Math.sin(pitch) * distance, z + Math.cos(pitch) * distance);
        this.camera.lookAt(x, 0, z);
        for (const { label, definition } of this.labels) {
            label.style.left = `${definition.x - cameraX}px`;
            label.style.top = `${definition.y - cameraY + 20}px`;
        }
        this.sleepingAnna?.update(dt, this.player?.root.position);
        // Resolve the player's position against the NPC's new pose/position
        // before rendering, including the shelter stand-up motion.
        this.busSeat?.update();
        this.player?.update(dt);
        if (!this.entryActive && !document.body.classList.contains('title-screen-active')) {
            this.exteriorDoors?.update(this.player.root.position.x, this.player.root.position.z);
        }
        this.conversationCamera ||= createConversationCamera({ faceFraming: true });
        this.conversationCamera.update(this.camera, this.player, this.sleepingAnna, dt);
        const wallTime = Date.now();
        for (const clock of this.buildingClocks) clock.update(wallTime);
        this.landscape.update(x, z, this.town.playerController.renderPosition);
        this.dialogueOcclusion ||= createDialogueOcclusion(this.scene);
        if (document.body.classList.contains('title-screen-active')) this.dialogueOcclusion.reset();
        else this.dialogueOcclusion.update(this.camera, [this.player, this.sleepingAnna],
            this.entryActive && !isCharacterSpeaking() ? { includeRoot: root => root.userData.entryOccluder } : undefined);
        this.renderCulling.render(this.renderer, this.scene, this.camera, this.landscape.center.value);
    }
}
