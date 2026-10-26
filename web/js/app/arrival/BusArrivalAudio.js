// The cutscene keeps its lifecycle hooks without creating audio or loading sounds.
export function createBusArrivalAudio() {
    return { update() {}, dispose() {} };
}
