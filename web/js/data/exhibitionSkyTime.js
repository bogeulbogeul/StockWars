// First-day story time is independent of the device clock and manual previews.
export function hasExhibitionSunset(flags = {}) {
    return !!(flags.sunset || (flags.packing && flags.trade));
}
export function exhibitionSkyTime({ sunset = false, asleep = false } = {}) {
    return asleep ? 'night' : sunset ? 'sunset' : 'day';
}
