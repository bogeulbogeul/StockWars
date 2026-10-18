const fs = require('node:fs');
const assert = require('node:assert/strict');

module.exports = async function auditBuildingMaterials(page) {
    const report = await page.evaluate(async () => {
        const { TOWN_MODEL_BUILDINGS } = await import('/js/data/townModelBuildings.js');
        const scene = window.stockWarsApp.townModelScene;
        scene.draw();
        scene.renderer.compile(scene.scene, scene.camera);
        return {
            buildings: TOWN_MODEL_BUILDINGS.map(definition => {
                const root = scene.scene.getObjectByName(definition.id);
                const materials = [];
                root?.traverse(object => {
                    if (!object.isMesh) return;
                    for (const material of [object.material].flat()) {
                        const original = material.userData.originalMaterial;
                        const shader = { fragmentShader: '#include <map_fragment>', vertexShader: '#include <project_vertex>', uniforms: {} };
                        material.onBeforeCompile(shader);
                        materials.push({
                            name: material.name,
                            corrected: material.customProgramCacheKey().startsWith('building-original-color-filter-v3'),
                            filterInjected: shader.fragmentShader.includes('diffuseColor.rgb *= samples[4]'),
                            oldPaletteAbsent: !shader.fragmentShader.includes('cleanBuildingColor'),
                            originalColorPreserved: !!original && material.color.equals(original.color),
                            originalTexturePreserved: !!original?.map && material.map !== original.map
                                && material.map.source === original.map.source,
                            metallic: material.metalness,
                            roughness: material.roughness,
                            normal: material.normalScale?.toArray(),
                            mipmaps: material.map?.generateMipmaps,
                            colorSpace: material.map?.colorSpace
                        });
                    }
                });
                return { id: definition.id, name: definition.name, present: !!root, materials };
            }),
            shaderErrors: scene.renderer.info.programs.filter(program => program.diagnostics?.runnable === false).length,
            exposure: scene.renderer.toneMappingExposure
        };
    });
    fs.writeFileSync('scratch/building-material-audit.json', JSON.stringify(report, null, 2));
    assert.equal(report.buildings.length, 9);
    assert.equal(report.shaderErrors, 0);
    for (const building of report.buildings) {
        assert.ok(building.present && building.materials.length > 0, building.name);
        for (const material of building.materials) {
            for (const flag of ['corrected', 'filterInjected', 'oldPaletteAbsent', 'originalColorPreserved', 'originalTexturePreserved']) {
                assert.equal(material[flag], true, `${building.name}: ${flag}`);
            }
            assert.equal(material.metallic, 0, building.name);
            assert.equal(material.roughness, 0.9, building.name);
            assert.deepEqual(material.normal, [0.2, 0.2], building.name);
        }
    }
    console.log('MATERIAL AUDIT PASS: ' + report.buildings.map(building => building.name).join(', '));
};
