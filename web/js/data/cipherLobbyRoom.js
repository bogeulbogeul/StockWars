// Cozy lobby dimensions in the same world units as Somangi (height 100).
export const LOBBY = {
    width: 900, depth: 608, wallHeight: 300, radius: 22,
    spawn: { x: 0, z: 169 }, exitZ: 266, exitHalfWidth: 72,
    desk: { x: 0, z: -65, width: 310, depth: 100, height: 72 },
    agentK: { x: 0, z: -205, bodyHeight: 110, radius: 31 },
    waitingAreas: [-1,1].map(side => ({ side: side < 0 ? 'left' : 'right',
        benchX: side*390, benchZ: 70, benchRotation: -side*Math.PI/2,
        benchHalfWidth: 44, benchHalfDepth: 54, plantX: side*390, plantZ: 220 })),
    doors: [
        { id: 'training', label: '트레이닝룸', subtitle: 'TRAINING', wall: 'left', z: -100, color: 0x547f78 },
        { id: 'competition', label: '경쟁룸', subtitle: 'COMPETITION', wall: 'right', z: -100, color: 0x687c9b }
    ],
    camera: { pitch: 30, fieldOfView: 24, targetY: 105, targetZ: -30,
        fitHeight: 540, framingMargin: 1.12 }
};

export function lobbyCanStand(x, z) {
    const { width, depth, radius, desk } = LOBBY;
    if (Math.abs(x) > width / 2 - radius || Math.abs(z) > depth / 2 - radius) return false;
    for (const area of LOBBY.waitingAreas) {
        if (Math.abs(x-area.benchX) < area.benchHalfWidth+radius
            && Math.abs(z-area.benchZ) < area.benchHalfDepth+radius) return false;
        if (Math.hypot(x-area.plantX,z-area.plantZ) < 28+radius) return false;
    }
    return Math.abs(x - desk.x) >= desk.width / 2 + radius
        || Math.abs(z - desk.z) >= desk.depth / 2 + radius;
}

export function nearbyLobbyDoor(x, z) {
    return LOBBY.doors.find(door => {
        const side = door.wall === 'left' ? -1 : 1;
        return x * side >= LOBBY.width / 2 - 100 && Math.abs(z - door.z) <= 70;
    });
}
