// Progress belongs to this running game only. Closing/reloading discards it.
// Historical browser saves are neither read nor deleted.
export function createSessionStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}
