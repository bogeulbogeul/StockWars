// Only the first-day verification skip may interrupt a manual journey.
export const REVIEW_TRAVEL_CANCELLED = new Error('Review travel skipped');
export function reviewTravelWait(scenes, run) {
    let frame, stopped = false;
    return new Promise((resolve, reject) => {
        const finish = () => { stopped = true; cancelAnimationFrame(frame); scenes.cancelReviewTravel = null; resolve(); };
        scenes.cancelReviewTravel = () => {
            stopped = true; cancelAnimationFrame(frame); scenes.cancelReviewTravel = null; reject(REVIEW_TRAVEL_CANCELLED);
        };
        const tick = now => { if (!stopped) run(now, finish, () => { frame = requestAnimationFrame(tick); }); };
        frame = requestAnimationFrame(tick);
    });
}
