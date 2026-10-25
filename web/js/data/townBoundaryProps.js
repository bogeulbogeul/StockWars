// Native common-tree GLBs form the woodland without oversized hedge meshes.
// The matching playable edge is defined in townBoundary.js.
const boundary = [];
function row(edge, count, position) {
    for (let index = 0; index < count; index++) {
        const [x, y] = position(index);
        boundary.push({
            id: `boundary_tree_${edge}_${index}`, name: '마을 외곽 나무',
            file: 'CommonTree-clean.glb', nativeMaterials: true,
            x, y, width: 190 + (index % 4) * 18,
            rotation: ((index % 5) - 2) * 0.13
        });
    }
}

// Three staggered northern rows leave breathing room between crowns while
// the offset background trees close the foreground sightlines.
row('north_inner', 13, i => [350 + i * 235, 580 + Math.sin(i * 1.2) * 25]);
row('north_outer', 15, i => [232.5 + i * 235, 370 + Math.sin(i * 1.3) * 25]);
row('north_backdrop', 17, i => [-120 + i * 235 + (i % 2) * 24, 150 + Math.sin(i * 1.1) * 22]);
// End the side groves before the road and shelter. No southern tree row.
row('west', 12, i => [390 + Math.sin(i * 1.3) * 28, 650 + i * 140]);
row('east', 12, i => [3130 + Math.sin(i * 1.3) * 28, 650 + i * 140]);
// Half-step offsets close the sightlines between foreground trunks without
// stacking four dense bands of crowns along each edge.
row('west_outer', 13, i => [200 + Math.sin(i * 1.1) * 25, 580 + i * 140]);
row('east_outer', 13, i => [3320 + Math.sin(i * 1.1) * 25, 580 + i * 140]);
row('west_backdrop', 12, i => [10 + Math.sin(i * 1.4) * 22, 625 + i * 140]);
row('east_backdrop', 12, i => [3510 + Math.sin(i * 1.4) * 22, 625 + i * 140]);

export const TOWN_BOUNDARY_PROPS = boundary;
