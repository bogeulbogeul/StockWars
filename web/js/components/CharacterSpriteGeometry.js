const LEGACY_GEOMETRY = Object.freeze({ width: 320, height: 400, anchorX: 160, anchorY: 372, carryX: 240, carryY: 210 });

export function characterGeometry(style) {
    return style.geometry || LEGACY_GEOMETRY;
}

export function characterCargoPlacement(style) {
    const g = characterGeometry(style);
    return { left: g.carryX * style.scale - 22, bottom: (g.anchorY - g.carryY) * style.scale - 3 };
}
