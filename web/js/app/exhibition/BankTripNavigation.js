export function bankTripBlocksNavigation(scenes, place) {
    if (!scenes.bankTripPending) return false;
    if (place !== 'bank') scenes.bankTripGuard?.remind();
    return true;
}
