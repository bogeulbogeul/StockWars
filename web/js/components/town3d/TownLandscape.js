import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { createGrassTexture, createPathsTexture, createContactShadowTexture } from './TownLandscapeTextures.js';
import { TownSky } from './TownSky.js';
import { TownWeather } from './TownWeather.js';
import { TownGroundSnow } from './TownGroundSnow.js';
import { applyTownRoadSurface } from './TownRoadSurface.js';

// Presentation-only bend. Ground coordinates, collisions and model files stay flat.
export class TownLandscape {
    constructor(scene) {
        this.scene = scene;
        this.center = { value: 0 };
        this.materials = new WeakSet();
        this.root = new THREE.Group();
        this.root.name = 'town-landscape';
        scene.add(this.root);
        this.sky = new TownSky(scene);
        this.weather = new TownWeather(scene);
        this.shadowMap = createContactShadowTexture();
        this.ground = this.plane(26000, 26000, createGrassTexture(), 0, false, 256);
        this.ground.name = 'village-grass-ground';
        // The grass and road must follow the same exposure as the 3D buildings.
        this.ground.material.toneMapped = true;
        this.pathsMap = createPathsTexture();
        this.blendPathsIntoGround();
        applyTownRoadSurface(this.ground.material);
        this.snow = new TownGroundSnow(scene, this.ground.material);
        this.playerShadow = this.shadow(75, 55);
        this.playerShadow.visible = false;
    }

    blendPathsIntoGround() {
        const material = this.ground.material;
        const previousCompile = material.onBeforeCompile;
        const previousKey = material.customProgramCacheKey.bind(material);
        material.onBeforeCompile = (shader, renderer) => {
            previousCompile.call(material, shader, renderer);
            shader.uniforms.villagePathsMap = { value: this.pathsMap };
            shader.vertexShader = 'varying vec2 villageGroundWorld;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
                #include <project_vertex>
                villageGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xz;
            `);
            shader.fragmentShader = 'uniform sampler2D villagePathsMap;\nvarying vec2 villageGroundWorld;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
                #include <map_fragment>
                vec2 villagePathUv = vec2(villageGroundWorld.x / 3700.0,
                    1.0 - villageGroundWorld.y * ${GROUND_PROJECTION.toFixed(8)} / 2600.0);
                if (all(greaterThanEqual(villagePathUv, vec2(0.0))) && all(lessThanEqual(villagePathUv, vec2(1.0)))) {
                    vec4 villagePath = texture2D(villagePathsMap, villagePathUv);
                    diffuseColor.rgb = mix(diffuseColor.rgb, villagePath.rgb, villagePath.a);
                }
            `);
        };
        material.customProgramCacheKey = () => previousKey() + '-paths-v1';
        material.needsUpdate = true;
    }

    plane(width, depth, map, height, transparent, segments = 1) {
        const material = new THREE.MeshBasicMaterial({ map, transparent, depthWrite: !transparent, toneMapped: false });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, segments, segments), material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = height;
        plane.frustumCulled = false;
        this.root.add(plane);
        this.wrap(plane);
        return plane;
    }

    shadow(width, depth) {
        const plane = this.plane(width, depth, this.shadowMap, 0.65, true, 8);
        plane.renderOrder = 2;
        return plane;
    }

    addContactShadow(model) {
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const shadow = this.shadow(Math.max(25, size.x * 1.15), Math.max(30, size.z * 1.1));
        model.contactShadow = shadow;
        shadow.position.x = (bounds.min.x + bounds.max.x) / 2;
        shadow.position.z = (bounds.min.z + bounds.max.z) / 2;
    }

    wrap(root) {
        root.traverse(object => {
            if (!object.isMesh) return;
            object.frustumCulled = false;
            for (const material of [object.material].flat()) {
                if (this.materials.has(material)) continue;
                this.materials.add(material);
                const compile = material.onBeforeCompile;
                const cacheKey = material.customProgramCacheKey.bind(material);
                material.onBeforeCompile = (shader, renderer) => {
                    compile.call(material, shader, renderer);
                    shader.uniforms.villageCenterZ = this.center;
                    shader.vertexShader = 'uniform float villageCenterZ;\n' + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
                        #include <project_vertex>
                        vec4 villageLocalPosition = vec4(transformed, 1.0);
                        #ifdef USE_INSTANCING
                            villageLocalPosition = instanceMatrix * villageLocalPosition;
                        #endif
                        vec4 villageWorldPosition = modelMatrix * villageLocalPosition;
                        float villageBend = max(0.0, villageCenterZ - villageWorldPosition.z - 1100.0);
                        mvPosition += viewMatrix * vec4(0.0, -0.00018 * villageBend * villageBend, 0.0, 0.0);
                        gl_Position = projectionMatrix * mvPosition;
                    `);
                };
                material.customProgramCacheKey = () => cacheKey() + '-village-bend-v2';
                material.needsUpdate = true;
            }
        });
    }

    update(centerX, centerZ, playerPosition) {
        this.sky.update();
        this.weather.update();
        this.snow.update();
        this.center.value = centerZ;
        this.ground.position.x = centerX;
        this.ground.position.z = centerZ;
        // Keep the repeated texture pinned to world coordinates while recentering.
        const map = this.ground.material.map;
        map.offset.set(centerX / 400, -centerZ / 400);
        this.playerShadow.position.x = playerPosition.x;
        this.playerShadow.position.z = playerPosition.y / GROUND_PROJECTION;
    }
}
