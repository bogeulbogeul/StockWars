import { TOWN_OBJECT_HEIGHTS } from '../../data/townObjectScale.js';

// Lower the integrated shelter bench while preserving the roof/head clearance.
export function fitTownProp(model, definition, scale) {
    if (definition.file !== 'BusStop-clean.glb') return;
    const floor = .15;
    const ratio = TOWN_OBJECT_HEIGHTS.seat / ((.74 - floor) * scale);
    model.traverse(object => {
        if (!object.isMesh || !object.name.startsWith('Bench_')) return;
        object.position.y = floor + (object.position.y - floor) * ratio;
        object.scale.y *= ratio;
    });
}
