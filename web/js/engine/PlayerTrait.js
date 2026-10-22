import { TRAITS_DATA } from '../components/character/PersonalityTestStep.js';

// Older profiles saved a trait title without its stat key.
export function applyPlayerTrait(state, profile) {
    const trait = profile?.trait;
    if (!trait) return;
    const key = trait.key || Object.keys(TRAITS_DATA).find(key => TRAITS_DATA[key].title === trait.title);
    if (!key) return;
    trait.key = key;
    if (state.appliedTrait === key) return;
    if (key in state.baseStats) {
        // Old saves may already have received the bonus; never add it twice.
        const earned = key === 'analysis' ? Math.floor((state.decryptions || 0) / 10) : 0;
        state.baseStats[key] = Math.max(state.baseStats[key], 1 + earned);
    }
    state.appliedTrait = key;
}
