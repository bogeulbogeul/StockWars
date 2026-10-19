import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';
import { TOWN_BUS_ROAD } from '../../data/townBusRoad.js';

const rgb = hex => new THREE.Color(hex).toArray().map(value => value.toFixed(6)).join(', ');

// Composite the continuous road on the existing ground: no seams or extra planes.
export function applyTownRoadSurface(material) {
    const compile = material.onBeforeCompile;
    const cacheKey = material.customProgramCacheKey.bind(material);
    const halfWidth = TOWN_BUS_ROAD.width / 2;
    material.onBeforeCompile = (shader, renderer) => {
        compile.call(material, shader, renderer);
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
            float roadY = villageGroundWorld.y * ${GROUND_PROJECTION.toFixed(8)};
            float roadDistance = abs(roadY - ${TOWN_BUS_ROAD.centerY.toFixed(1)});
            float roadAA = max(0.4, fwidth(roadY));
            float roadShoulder = 1.0 - smoothstep(${(halfWidth + TOWN_BUS_ROAD.shoulder).toFixed(1)} - roadAA,
                ${(halfWidth + TOWN_BUS_ROAD.shoulder).toFixed(1)} + roadAA, roadDistance);
            float roadMask = 1.0 - smoothstep(${halfWidth.toFixed(1)} - roadAA,
                ${halfWidth.toFixed(1)} + roadAA, roadDistance);
            vec3 roadColor = vec3(${rgb('#6c7b7f')});
            float edgeDistance = abs(roadDistance - ${(halfWidth - 7).toFixed(1)});
            float edgeLine = 1.0 - smoothstep(1.2, 1.2 + roadAA, edgeDistance);
            float centerLine = 1.0 - smoothstep(1.1, 1.1 + roadAA, roadDistance);
            float dashPosition = mod(villageGroundWorld.x + 10000.0, 100.0);
            float dash = smoothstep(0.0, 2.0, dashPosition) * (1.0 - smoothstep(55.0, 57.0, dashPosition));
            roadColor = mix(roadColor, vec3(${rgb('#e7e8d8')}), edgeLine);
            roadColor = mix(roadColor, vec3(${rgb('#eddb92')}), centerLine * dash);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${rgb('#c8cfba')}), roadShoulder);
            diffuseColor.rgb = mix(diffuseColor.rgb, roadColor, roadMask);
            #include <color_fragment>
        `);
    };
    material.customProgramCacheKey = () => cacheKey() + '-bus-road-v1';
    material.needsUpdate = true;
}
