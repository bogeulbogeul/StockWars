import { AUTHORED_RUMORS } from '../data/authoredRumors.js';

const events = new Map(AUTHORED_RUMORS.map(event => [event.rumorId, event]));
// Round up to a new stage that retains at least the previously unlocked information.
const stageMap = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
export function migrateRumorStages(state) {
    const seen = new WeakSet();
    const visit = value => {
        if (!value || typeof value !== 'object' || seen.has(value)) return;
        seen.add(value);
        const canonical = events.get(value.rumorId);
        if (canonical && value.rumorSchema === 2 && value.rumorStages?.length === 10) {
            value.rumorTenStageArchive ??= { schema: 2, interpretationLevel: value.interpretationLevel,
                rumorStages: value.rumorStages, intelReport: value.intelReport };
            const oldLevel = Math.min(10, Math.max(1, Math.floor(Number(value.interpretationLevel) || 1)));
            value.interpretationLevel = stageMap[oldLevel];
            value.rumorStages = [...canonical.rumorStages];
            value.intelReport = canonical.rumorStages[4];
            value.rumorSchema = 3;
        }
        for (const [key, child] of Object.entries(value)) {
            if (key !== 'rumorTenStageArchive') visit(child);
        }
    };
    // Includes queued deliveries and gifted/mail holdings; never rewrite quiz or reward history.
    for (const key of ['inventory', 'deliveries', 'mail']) visit(state[key]);
}
