// Korea Standard Time, independent of the device's configured time zone.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const TURN = Math.PI * 2;
const HANDS = [
    { name: 'Clock_Hour', base: Math.atan2(-.064, .043), period: 12 * 60 * 60 },
    { name: 'Clock_Minute', base: Math.atan2(.083, .072), period: 60 * 60 }
];

export function koreaClockSeconds(timestamp = Date.now()) {
    const date = new Date(timestamp + KST_OFFSET_MS);
    return date.getUTCHours() * 3600 + date.getUTCMinutes() * 60
        + date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
}

export class BuildingClock {
    constructor(model) {
        this.hands = HANDS.map(spec => ({ ...spec, object: model.getObjectByName(spec.name) }));
        if (this.hands.some(hand => !hand.object)) throw new Error('Building clock hands are missing');
        this.update();
    }

    update(timestamp = Date.now()) {
        const seconds = koreaClockSeconds(timestamp);
        for (const { object, base, period } of this.hands) {
            // GLB Y-up: the face points +Z; negative Z rotation is clockwise.
            // Subtract the authored hand direction so 00:00 points exactly up.
            object.rotation.set(0, 0, base - TURN * (seconds % period) / period);
        }
    }
}
