// First-day story time is independent of the device clock and manual previews.
export function exhibitionSkyTime({ sunset = false, asleep = false } = {}) {
    return asleep ? 'night' : sunset ? 'sunset' : 'day';
}
