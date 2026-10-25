// Fixed wall-clock slots in the device's local timezone, including DST changes.
export const NEWS_HOURS = Object.freeze([9, 12, 15, 18, 21]);

export function nextNewsSlot(after) {
    const day = new Date(after);
    for (const hour of NEWS_HOURS) {
        const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
        if (candidate.getTime() > after) return candidate.getTime();
    }
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, NEWS_HOURS[0]).getTime();
}

export class ScheduledNews {
    constructor(catalog, { now = Date.now(), random = Math.random, saved } = {}) {
        this.catalog = new Map(catalog.map(article => [article.id, article]));
        this.random = random;
        const day = new Date(now);
        const beginning = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() - 1;
        const valid = saved?.version === 1 && Number.isFinite(saved.cursor) && saved.cursor >= 0
            && Array.isArray(saved.entries) && Array.isArray(saved.remaining);
        this.state = valid ? {
            version: 1, cursor: saved.cursor,
            entries: saved.entries.filter(e => this.catalog.has(e.articleId) && Number.isFinite(e.publishedAt)
                && e.publishedAt <= saved.cursor).slice(0, catalog.length),
            remaining: [...new Set(saved.remaining)].filter(id => this.catalog.has(id))
        } : { version: 1, cursor: beginning, entries: [], remaining: [] };
    }

    sync(now) {
        if (!Number.isFinite(now) || now <= this.state.cursor || !this.catalog.size) return false;
        let changed = false;
        for (let slot = nextNewsSlot(this.state.cursor); slot <= now; slot = nextNewsSlot(slot)) {
            if (!this.state.remaining.length) this.state.remaining = [...this.catalog.keys()];
            const index = Math.min(this.state.remaining.length - 1,
                Math.max(0, Math.floor(this.random() * this.state.remaining.length)));
            const [articleId] = this.state.remaining.splice(index, 1);
            this.state.entries.unshift({ articleId, publishedAt: slot });
            this.state.entries.length = Math.min(this.state.entries.length, this.catalog.size);
            changed = true;
        }
        this.state.cursor = now;
        return changed;
    }

    read() {
        return this.state.entries.map(({ articleId, publishedAt }) => ({
            ...this.catalog.get(articleId),
            body: [...this.catalog.get(articleId).body],
            id: `${articleId}@${publishedAt}`, articleId, publishedAt,
            time: new Date(publishedAt).toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
            })
        }));
    }

    snapshot() { return structuredClone(this.state); }
}
