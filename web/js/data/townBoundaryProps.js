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

// Staggered pairs of rows hide gaps without changing the adopted tree mesh.
row('north_outer', 15, i => [440 + i * 185, 480 + Math.sin(i * 1.2) * 65]);
row('north_inner', 14, i => [520 + i * 185, 580 + Math.sin(i * 1.2) * 55]);
// End the side groves before the road and shelter. No southern tree row.
row('west', 17, i => [390 + Math.sin(i * 0.9) * 55, 680 + i * 88]);
row('east', 17, i => [3130 + Math.sin(i * 0.9) * 55, 680 + i * 88]);
row('west_outer', 19, i => [230 + Math.sin(i) * 35, 605 + i * 86]);
row('east_outer', 19, i => [3300 + Math.sin(i) * 35, 605 + i * 86]);
// Additional depth stays outside the collision edge; irregular staggered rows
// cover the distant lawn with the same trees used inside the village.
row('west_deep', 20, i => [60 + Math.sin(i * 1.3) * 35, 550 + i * 86]);
row('west_far', 21, i => [-110 + Math.sin(i * 1.1) * 45, 520 + i * 84]);
row('east_deep', 20, i => [3470 + Math.sin(i * 1.3) * 35, 550 + i * 86]);
row('east_far', 21, i => [3640 + Math.sin(i * 1.1) * 45, 520 + i * 84]);
row('north_deep', 21, i => [-80 + i * 185, 340 + Math.sin(i) * 35]);
row('north_far', 22, i => [-170 + i * 185, 225 + Math.sin(i * 1.1) * 35]);
row('north_horizon', 22, i => [-90 + i * 185, 110 + Math.sin(i * 1.2) * 30]);

export const TOWN_BOUNDARY_PROPS = boundary;
