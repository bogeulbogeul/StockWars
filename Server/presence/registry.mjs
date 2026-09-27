import { randomUUID } from 'node:crypto';

// Closed-demo guest sessions, not authenticated accounts. No NPCs are registered.
export class PresenceRegistry {
    constructor({ now = Date.now, timeoutMs = 30000, capacity = 50 } = {}) {
        this.now = now;
        this.timeoutMs = timeoutMs;
        this.capacity = capacity;
        this.sessions = new Map();
    }

    session(token) {
        this.prune();
        if (!this.sessions.has(token)) {
            if (this.sessions.size >= 1000) throw Object.assign(new Error('서버 세션 한도 초과'), { status: 503 });
            token = randomUUID();
            this.sessions.set(token, { seen: this.now(), active: true, channelId: null });
        }
        const session = this.sessions.get(token);
        session.seen = this.now();
        session.active = true;
        return { token, ...this.snapshot(token) };
    }

    update(token, action, channelId) {
        this.prune();
        const session = this.sessions.get(token);
        if (!session) throw Object.assign(new Error('세션을 다시 연결해 주세요.'), { status: 401 });
        if (action === 'join') {
            if (channelId !== 'town-1') throw Object.assign(new Error('존재하지 않는 채널입니다.'), { status: 404 });
            const users = this.snapshot(token).channels[0].users;
            if (session.channelId !== channelId && users >= this.capacity) {
                throw Object.assign(new Error('채널이 가득 찼습니다.'), { status: 409 });
            }
            session.channelId = channelId;
        } else if (action === 'leave' || action === 'disconnect') {
            session.channelId = null;
        } else if (action !== 'heartbeat') {
            throw Object.assign(new Error('잘못된 요청입니다.'), { status: 400 });
        }
        session.active = action !== 'disconnect';
        session.seen = this.now();
        return this.snapshot(token);
    }

    prune() {
        for (const [token, session] of this.sessions) {
            if (this.now() - session.seen >= this.timeoutMs) {
                session.active = false;
                session.channelId = null;
            }
            if (this.now() - session.seen > 86400000) this.sessions.delete(token);
        }
    }

    snapshot(token) {
        this.prune();
        const active = [...this.sessions.values()].filter(s => s.active && this.now() - s.seen < this.timeoutMs);
        const session = this.sessions.get(token);
        return {
            totalCCU: active.length,
            capacity: this.capacity,
            currentChannelId: session?.channelId || null,
            channels: [{ id: 'town-1', name: '타운 1', users: active.filter(s => s.channelId === 'town-1').length }]
        };
    }
}
