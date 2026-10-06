import { randomUUID } from 'node:crypto';

// Closed-demo guest sessions, not authenticated accounts. No NPCs are registered.
export class PresenceRegistry {
    constructor({ now = Date.now, timeoutMs = 30000, capacity = 50 } = {}) {
        this.now = now;
        this.timeoutMs = timeoutMs;
        this.capacity = capacity;
        this.sessions = new Map();
        this.messages = [];
        this.chatRooms = new Map();
        this.news = [];
        this.nextMessageId = 1;
        this.nextPlayerId = 1;
    }

    session(token) {
        this.prune();
        if (!this.sessions.has(token)) {
            if (this.sessions.size >= 1000) throw Object.assign(new Error('서버 세션 한도 초과'), { status: 503 });
            token = randomUUID();
            this.sessions.set(token, { seen: this.now(), active: true, channelId: null, playerId: this.nextPlayerId++ });
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

    chat(token, action, text, options = {}) {
        this.prune();
        const session = this.sessions.get(token);
        if (!session || !session.active) throw Object.assign(new Error('세션을 다시 연결해 주세요.'), { status: 401 });
        const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
        if (action === 'newsPublish') {
            const a = options.achievement;
            if (!a || typeof a.id !== 'string' || typeof a.stockName !== 'string' || a.stockName.length > 100 || !Number.isFinite(a.profit) || a.profit <= 0 || !Number.isFinite(a.returnRate) || !Number.isInteger(a.quantity) || a.quantity <= 0) fail('잘못된 성과 기록입니다.');
            if (this.news.some(p => p.playerId === session.playerId && p.achievementId === a.id)) fail('이미 게시한 성과입니다.');
            this.news.unshift({ id: randomUUID(), achievementId: a.id, playerId: session.playerId, friendName: `플레이어 ${session.playerId}`,
                trigger: '주식 매도 수익 실현', icon: '📈', timestamp: new Date(this.now()).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
                message: `${a.stockName} ${a.quantity}주 매도로 +${Math.round(a.profit).toLocaleString()}G (+${a.returnRate.toFixed(1)}%) 수익을 실현했어요!`,
                comment: typeof options.comment === 'string' ? options.comment.trim().slice(0, 80) : '', reactions: {} });
            this.news = this.news.slice(0, 500);
            return { success: true };
        }
        if (action === 'news' || action === 'newsReact') {
            if (action === 'newsReact') {
                const post = this.news.find(p => p.id === options.postId);
                if (!post || post.playerId === session.playerId || !['congratulate', 'jealous', 'hate'].includes(options.reaction)) fail('반응할 수 없는 소식입니다.');
                if (post.reactions[session.playerId]) fail('이미 반응한 소식입니다.');
                post.reactions[session.playerId] = options.reaction;
            }
            return { playerId: session.playerId, posts: this.news.map(({ reactions, ...post }) => ({ ...post, isOwn: post.playerId === session.playerId,
                reacted: !!reactions[session.playerId], reactionType: reactions[session.playerId], reactionCount: Object.keys(reactions).length })) };
        }
        if (action === 'create') {
            if (typeof options.title !== 'string' || !options.title.trim() || options.title.trim().length > 40) fail('방 이름은 1~40자로 입력해 주세요.');
            if (!Array.isArray(options.members) || options.members.length > 20) fail('참여자는 최대 20명입니다.');
            const members = [...new Set([session.playerId, ...options.members])];
            if (members.some(id => !Number.isInteger(id) || ![...this.sessions.values()].some(s => s.playerId === id))) fail('참여자를 다시 확인해 주세요.');
            if ([...this.chatRooms.values()].filter(room => room.members.includes(session.playerId)).length >= 20) fail('참여 가능한 채팅방은 최대 20개입니다.');
            if (this.chatRooms.size >= 500) fail('서버 채팅방 한도에 도달했습니다.', 503);
            const id = `group_${randomUUID()}`;
            this.chatRooms.set(id, { id, title: options.title.trim(), members, messages: [] });
            return { roomId: id };
        }
        const room = options.roomId ? this.chatRooms.get(options.roomId) : null;
        if (options.roomId && (!room || !room.members.includes(session.playerId))) fail('참여 중인 채팅방이 아닙니다.', 403);
        if (action === 'leaveRoom') {
            if (!room) fail('채팅방을 선택해 주세요.');
            room.members = room.members.filter(id => id !== session.playerId);
            if (!room.members.length) this.chatRooms.delete(room.id);
            return { success: true };
        }
        if (action === 'invite') {
            if (!room || !Array.isArray(options.members) || !options.members.length || options.members.length > 20) fail('추가할 친구를 선택해 주세요.');
            if (options.members.some(id => !Number.isInteger(id) || ![...this.sessions.values()].some(s => s.playerId === id))) fail('참여자를 다시 확인해 주세요.');
            const members = [...new Set([...room.members, ...options.members])];
            if (members.length > 21) fail('친구는 최대 20명까지 추가할 수 있습니다.');
            room.members = members;
            return { members };
        }
        const messages = room ? room.messages : this.messages;
        if (action === 'send') {
            if (typeof text !== 'string' || !text.trim() || text.trim().length > 500) {
                throw Object.assign(new Error('메시지는 1~500자로 입력해 주세요.'), { status: 400 });
            }
            if (session.lastMessageAt !== undefined && this.now() - session.lastMessageAt < 1000) {
                throw Object.assign(new Error('잠시 후 다시 보내주세요.'), { status: 429 });
            }
            session.lastMessageAt = this.now();
            messages.push({ id: this.nextMessageId++, playerId: session.playerId,
                sender: `플레이어 ${session.playerId}`, text: text.trim(), timestamp: this.now() });
            if (messages.length > 100) messages.splice(0, messages.length - 100);
        } else if (action !== 'list') {
            throw Object.assign(new Error('잘못된 요청입니다.'), { status: 400 });
        }
        return { playerId: session.playerId, messages,
            players: [...this.sessions.values()].filter(s => s.active).map(s => ({ id: s.playerId, name: `플레이어 ${s.playerId}` })),
            rooms: [...this.chatRooms.values()].filter(r => r.members.includes(session.playerId)).map(r => ({ id: r.id, title: r.title, count: r.members.length, members: r.members })) };
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
