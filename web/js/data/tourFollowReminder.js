export const TOUR_FOLLOW_REMINDER = Object.freeze({ far: 650, near: 320, delay: .7 });

export function updateFollowDistance(state, distance, dt) {
    if (distance <= TOUR_FOLLOW_REMINDER.near) {
        state.called = false; state.farSeconds = 0; return 'near';
    }
    if (state.called) return null;
    state.farSeconds = distance >= TOUR_FOLLOW_REMINDER.far
        ? (state.farSeconds || 0) + Math.max(0, dt) : 0;
    if (state.farSeconds < TOUR_FOLLOW_REMINDER.delay) return null;
    state.called = true; return 'call';
}
