export const PLAYER_LEVEL_CAP = 20;
export const PLAYER_EXP_BASE = 150;
const CURVE_VERSION = 2;

// The former curve used 100 * level^1.5. Convert earned EXP once so
// existing levels and fractional progress survive the slower curve.
export function initializePlayerGrowth(state) {
    let exp = Number(state.exp);
    if (!Number.isFinite(exp) || exp < 0) exp = 0;
    if (state.playerExpCurveVersion !== CURVE_VERSION) exp *= PLAYER_EXP_BASE / 100;
    state.exp = exp;
    state.playerExpCurveVersion = CURVE_VERSION;
}

export function playerLevelProgress(state) {
    let exp = Number(state.exp);
    if (!Number.isFinite(exp) || exp < 0) exp = 0;
    let level = 1;
    // Avoid a floating-point rounding residue demoting a save at an exact boundary.
    while (level < PLAYER_LEVEL_CAP && exp + 1e-9 >= PLAYER_EXP_BASE * level ** 1.5) {
        exp = Math.max(0, exp - PLAYER_EXP_BASE * level ** 1.5);
        level++;
    }
    return { level, currentExp: exp, maxExp: level < PLAYER_LEVEL_CAP ? PLAYER_EXP_BASE * level ** 1.5 : null };
}
