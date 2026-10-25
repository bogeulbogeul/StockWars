// Shared baseline rules, independent of character level and legacy personality stats.
export const COMMON_PLAYER_RULES = Object.freeze({ portfolioSlots: 5, maxStamina: 3, laborCost: 1 });
export const RETIRED_ABILITY_ITEMS = new Set(['item_stabilizer', 'item_vitamin_complex']);

export function preserveLegacyAbilities(state, level) {
    if (state.abilityRetirementVersion === 1) return;
    state.legacyAbilities = {
        baseStats: { ...state.baseStats }, appliedTrait: state.appliedTrait ?? null,
        spentLevelPoints: state.spentLevelPoints ?? 0,
        unspentLevelPoints: Math.max(0, level - 1 - (state.spentLevelPoints || 0)),
        stamina: state.stamina, buffs: { ...state.buffs }
    };
    state.abilityRetirementVersion = 1;
}
