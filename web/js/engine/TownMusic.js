// Audio removed from the game. Keep scene hooks compatible with existing callers.
export class TownMusic {
    update() {}
    setTitleActive() {}
}
let music;
export function getTownMusic() { return music ||= new TownMusic(); }
