const assert = require('node:assert/strict');

module.exports = async page => {
    const report = await page.evaluate(async () => {
        const { villagePathRoutes } = await import('/js/data/townLandscapeLayout.js');
        const scene = window.stockWarsApp.townModelScene;
        const controller = scene.town.playerController;
        const blocked = [];
        villagePathRoutes().forEach((route, routeIndex) => {
            for (let i = 0; i < route.length - 1; i++) {
                const p0 = route[Math.max(0, i - 1)], p1 = route[i];
                const p2 = route[i + 1], p3 = route[Math.min(route.length - 1, i + 2)];
                for (let step = 0; step <= 20; step++) {
                    const t = step / 20, t2 = t * t, t3 = t2 * t;
                    const point = [0, 1].map(axis => 0.5 * ((2 * p1[axis])
                        + (-p0[axis] + p2[axis]) * t
                        + (2*p0[axis] - 5*p1[axis] + 4*p2[axis] - p3[axis]) * t2
                        + (-p0[axis] + 3*p1[axis] - 3*p2[axis] + p3[axis]) * t3));
                    if (!controller.canStand(...point)) blocked.push({ route: routeIndex, x: Math.round(point[0]), y: Math.round(point[1]) });
                }
            }
        });
        return { buildingFootprints: scene.collisionFootprints.length, blocked };
    });
    console.log('PATH AUDIT ' + JSON.stringify(report));
    assert.equal(report.blocked.length, 0, 'Walkway centerline intersects a building');
};
