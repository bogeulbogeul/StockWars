export function reduceRumorPowderValue(item) {
    const before = Math.max(0, Math.floor(Number(item.price) || 0));
    // Keep the existing 100-leaf intel floor without ever raising a lower saved value.
    const after = Math.min(before, Math.max(100, Math.floor(before * .5)));
    item.price = after;
    return { before, after };
}
