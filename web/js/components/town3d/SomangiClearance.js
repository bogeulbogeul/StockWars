// Probe legal player-center positions; reuse each scene's existing collision radius.
// Both sides must be close at two stations, so a lone wall/corner is not a passage.
export function updateSomangiClearance(controller, dx, dz, x, z, canStand) {
    if (controller.isResting || controller.busSeated || controller.jumpActive || controller.scriptedWalking || controller.somangiCrabSuspended) {
        if (controller.isResting) controller.somangiCrabManual = false;
        controller.somangiCrabAuto = false;
        controller.somangiCrab = false;
        return;
    }
    const length = Math.hypot(dx, dz);
    if (length) controller.somangiTravelAxis = { x: dx / length, z: dz / length };
    const axis = controller.somangiTravelAxis;
    if (!axis || (!length && !controller.somangiCrabAuto)) {
        controller.somangiCrab = !!controller.somangiCrabManual;
        return;
    }
    const width = controller.somangiCrabAuto ? 44 : 34;
    const nx = -axis.z, nz = axis.x;
    let narrow = 0;
    let currentNarrow = false;
    for (const ahead of [0, 12, 24]) {
        const px = x + axis.x * ahead, pz = z + axis.z * ahead;
        if (canStand(px, pz) && !canStand(px + nx * width, pz + nz * width)
            && !canStand(px - nx * width, pz - nz * width)) {
            narrow++;
            if (ahead === 0) currentNarrow = true;
        }
    }
    controller.somangiCrabAuto = narrow >= 2 || (!!controller.somangiCrabAuto && currentNarrow);
    controller.somangiCrab = !!controller.somangiCrabManual || controller.somangiCrabAuto;
}

export function sidewaysYaw(axis, currentYaw) {
    if (!axis) return currentYaw;
    const travel = Math.atan2(axis.x, axis.z);
    const first = travel + Math.PI / 2, second = travel - Math.PI / 2;
    return Math.cos(first - currentYaw) >= Math.cos(second - currentYaw) ? first : second;
}
