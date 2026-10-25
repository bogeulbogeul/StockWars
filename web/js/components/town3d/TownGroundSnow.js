import * as THREE from '../../../vendor/three/three.module.js';
import { townWeather } from '../../data/townWeatherProfiles.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { TOWN_BUS_ROAD } from '../../data/townBusRoad.js';

// Snow is composited on the existing terrain: no overlapping ground planes.
export class TownGroundSnow {
    constructor(scene, material) {
        this.scene = scene;
        this.amount = { value: townWeather(scene) === 'snow' ? .35 : 0 };
        const compile = material.onBeforeCompile;
        const cacheKey = material.customProgramCacheKey.bind(material);
        material.onBeforeCompile = (shader, renderer) => {
            compile.call(material, shader, renderer);
            shader.uniforms.townSnowAmount = this.amount;
            shader.fragmentShader = 'uniform float townSnowAmount;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
                vec2 snowWorld = vec2(villageGroundWorld.x,
                    villageGroundWorld.y * ${GROUND_PROJECTION.toFixed(8)});
                vec2 snowPathUv = vec2(snowWorld.x / 3700.0, 1.0 - snowWorld.y / 2600.0);
                float snowPath = 0.0;
                if(all(greaterThanEqual(snowPathUv,vec2(0.0))) && all(lessThanEqual(snowPathUv,vec2(1.0))))
                    snowPath = texture2D(villagePathsMap,snowPathUv).a;
                float snowRoad = 1.0 - smoothstep(${(TOWN_BUS_ROAD.width / 2).toFixed(1)},
                    ${(TOWN_BUS_ROAD.width / 2 + TOWN_BUS_ROAD.shoulder + 5).toFixed(1)},
                    abs(snowWorld.y - ${TOWN_BUS_ROAD.centerY.toFixed(1)}));
                float snowPatch = .5 + .25*sin(snowWorld.x*.019+sin(snowWorld.y*.013))
                    + .25*cos(snowWorld.y*.025+sin(snowWorld.x*.011));
                float snowCover = smoothstep(snowPatch*.62, snowPatch*.62+.24,townSnowAmount);
                snowCover *= 1.0 - snowPath*.72;
                snowCover *= 1.0 - snowRoad*.92;
                vec3 snowColor = vec3(.86,.92,.97) + snowPatch*.035;
                diffuseColor.rgb = mix(diffuseColor.rgb,snowColor,snowCover);
                #include <color_fragment>
            `);
        };
        material.customProgramCacheKey = () => cacheKey() + '-ground-snow-v1';
        material.needsUpdate = true;
    }

    update(now = performance.now(), immediate = false) {
        const snowing = townWeather(this.scene) === 'snow';
        const seconds = this.lastUpdate === undefined ? 0 : Math.max(0, Math.min(5, (now - this.lastUpdate) / 1000));
        this.lastUpdate = now;
        if (immediate) this.amount.value = snowing ? 1 : 0;
        else {
            if (snowing && !this.wasSnowing) this.amount.value = Math.max(.25, this.amount.value);
            this.amount.value = THREE.MathUtils.clamp(this.amount.value + seconds * (snowing ? 1 / 90 : -1 / 180), 0, 1);
        }
        this.wasSnowing = snowing;
    }
}
