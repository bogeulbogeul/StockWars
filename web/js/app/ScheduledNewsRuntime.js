import { CURRENT_NEWS } from '../data/newsCatalog.js';
import { ScheduledNews, nextNewsSlot } from '../engine/ScheduledNews.js';

const instances = new Map();

export function scheduledNewsRuntime(domain = 'standard') {
    if (instances.has(domain)) return instances.get(domain);
    const key = 'stockwars-scheduled-news-v1';
    let saved;
    // The first-day exhibition intentionally starts a fresh session after reload.
    if (domain === 'standard') {
        try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Unavailable storage. */ }
    }
    const feed = new ScheduledNews(CURRENT_NEWS, { saved });
    const listeners = new Set();
    let timer;
    function save() {
        if (domain !== 'standard') return;
        try { localStorage.setItem(key, JSON.stringify(feed.snapshot())); } catch { /* Session still works. */ }
    }
    function refresh() {
        const changed = feed.sync(Date.now());
        if (changed) {
            save();
            for (const listener of listeners) listener();
        }
        return changed;
    }
    function arm() {
        clearTimeout(timer);
        refresh();
        timer = setTimeout(arm, Math.min(60_000, Math.max(50, nextNewsSlot(Date.now()) - Date.now())));
    }
    const runtime = {
        news: () => { refresh(); return feed.read(); },
        subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }
    };
    instances.set(domain, runtime);
    arm();
    globalThis.addEventListener?.('pagehide', save);
    globalThis.document?.addEventListener('visibilitychange', () => {
        if (!document.hidden) arm();
    });
    return runtime;
}
