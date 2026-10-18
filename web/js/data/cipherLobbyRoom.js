// Temporary blockout dimensions in the same world units as Somangi (height 100).
export const LOBBY = {
    width: 1000, depth: 760, wallHeight: 300, radius: 22,
    spawn: { x: 0, z: 245 }, exitZ: 342, exitHalfWidth: 72,
    desk: { x: 0, z: -135, width: 310, depth: 100, height: 72 },
    elevator: { z: 245, depth: 38, halfWidth: 88 },
    waitingAreas: [-1,1].map(side => ({ side: side < 0 ? 'left' : 'right',
        benchX: side*335, benchZ: -322, plantX: side*432, plantZ: -233 })),
    doors: [
        { id: 'training', label: '트레이닝룸', subtitle: 'TRAINING', wall: 'left', z: -100, color: 0x547f78 },
        { id: 'competition', label: '경쟁룸', subtitle: 'COMPETITION', wall: 'right', z: -100, color: 0x687c9b }
    ],
    camera: { pitch: 30, fieldOfView: 35, targetY: 105, targetZ: -25 }
};

export function lobbyCanStand(x, z) {
    const { width, depth, radius, desk } = LOBBY;
    if (Math.abs(x) > width / 2 - radius || Math.abs(z) > depth / 2 - radius) return false;
    if (x > width/2 - LOBBY.elevator.depth - radius
        && Math.abs(z - LOBBY.elevator.z) < LOBBY.elevator.halfWidth + radius) return false;
    for (const area of LOBBY.waitingAreas) {
        if (Math.abs(x-area.benchX) < 84+radius && Math.abs(z-area.benchZ) < 34+radius) return false;
        if (Math.hypot(x-area.plantX,z-area.plantZ) < 26+radius) return false;
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
