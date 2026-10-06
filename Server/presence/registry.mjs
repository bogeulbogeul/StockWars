import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Closed-demo guest sessions, not authenticated accounts. No NPCs are registered.
export class PresenceRegistry {
    constructor({ now = Date.now, timeoutMs = 30000, capacity = 50, nameFile } = {}) {
        this.now = now;
        this.timeoutMs = timeoutMs;
        this.capacity = capacity;
        this.sessions = new Map();
        this.nameFile = nameFile;
        this.names = new Map();
        this.social = { requests: [], friendships: [] };
        if (nameFile && fs.existsSync(`${nameFile}.social`)) this.social = JSON.parse(fs.readFileSync(`${nameFile}.social`, 'utf8'));
        if (nameFile && fs.existsSync(nameFile)) this.names = new Map(JSON.parse(fs.readFileSync(nameFile, 'utf8')));
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
            token = [...this.names.values()].some(entry => entry.token === token) ? token : randomUUID();
            this.sessions.set(token, { seen: this.now(), active: true, channelId: null, playerId: this.nextPlayerId++ });
        }
        const session = this.sessions.get(token);
        session.seen = this.now();
        session.active = true;
        return { token, ...this.snapshot(token) };
    }

    update(token, action, channelId, pose) {
        this.prune();
        const session = this.sessions.get(token);
        if (!session) throw Object.assign(new Error('세션을 다시 연결해 주세요.'), { status: 401 });
        if (action === 'nickname') {
            this.claimNickname(token, pose?.nickname);
        } else if (action === 'join') {
            if (channelId !== 'town-1') throw Object.assign(new Error('존재하지 않는 채널입니다.'), { status: 404 });
            const users = this.snapshot(token).channels[0].users;
            if (session.channelId !== channelId && users >= this.capacity) {
                throw Object.assign(new Error('채널이 가득 찼습니다.'), { status: 409 });
            }
            if (session.channelId !== channelId) session.pose = null;
            session.channelId = channelId;
        } else if (action === 'leave' || action === 'disconnect') {
            session.channelId = null;
            session.pose = null;
        } else if (action === 'position') {
            if (!session.active || !session.channelId) throw Object.assign(new Error('마을에 먼저 입장해 주세요.'), { status: 409 });
            if (!pose || !Number.isFinite(pose.x) || !Number.isFinite(pose.y) || pose.x < 0 || pose.x > 3700 || pose.y < 0 || pose.y > 2600 || !['up', 'down', 'left', 'right'].includes(pose.facing)) {
                throw Object.assign(new Error('잘못된 플레이어 좌표입니다.'), { status: 400 });
            }
            const nickname = this.claimNickname(token, pose.nickname ?? `플레이어 ${session.playerId}`);
            session.pose = { x: pose.x, y: pose.y, facing: pose.facing, resting: pose.resting === true, nickname,
                level: Number.isInteger(pose.level) ? Math.min(20, Math.max(1, pose.level)) : 1,
                trait: typeof pose.trait === 'string' ? pose.trait.slice(0, 40) : '' };
            session.poseAt = this.now();
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
                session.pose = null;
            }
            if (this.now() - session.seen > 86400000) this.sessions.delete(token);
        }
    }

    claimNickname(token, input) {
        const nickname = typeof input === 'string' ? input.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
        if (!nickname || Array.from(nickname).length > 24 || /[\p{Cc}\p{Cf}]/u.test(nickname)) {
            throw Object.assign(new Error('닉네임은 1~24자로 입력해 주세요.'), { status: 400 });
        }
        const key = nickname.replace(/\s/g, '').toLowerCase();
        const existing = this.names.get(key);
        if (existing && existing.token !== token) throw Object.assign(new Error('이미 사용 중인 닉네임입니다. 다른 이름을 입력해 주세요.'), { status: 409 });
        if (existing?.nickname === nickname) return nickname;
        const next = new Map(this.names);
        for (const [oldKey, entry] of next) if (entry.token === token) next.delete(oldKey);
        next.set(key, { token, nickname });
        if (this.nameFile) {
            fs.mkdirSync(path.dirname(this.nameFile), { recursive: true });
            fs.writeFileSync(`${this.nameFile}.tmp`, JSON.stringify([...next]), { mode: 0o600 });
            fs.renameSync(`${this.nameFile}.tmp`, this.nameFile);
        }
        this.names = next;
        return nickname;
    }

    chat(token, action, text, options = {}) {
        this.prune();
        const session = this.sessions.get(token);
        if (!session || !session.active) throw Object.assign(new Error('세션을 다시 연결해 주세요.'), { status: 401 });
        const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
        if (action === 'friends') return this.friends(token, options);
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

    friends(token, { operation = 'list', targetId } = {}) {
        const peers = [...this.sessions.entries()];
        const peer = peers.find(([, s]) => s.playerId === targetId);
        const target = peer?.[0];
        const fail = message => { throw Object.assign(new Error(message), { status: 409 }); };
        const connected = this.social.friendships.find(pair => pair.includes(token) && pair.includes(target));
        if (operation !== 'list') {
            if (!target || target === token) fail('플레이어를 다시 확인해 주세요.');
            if (operation === 'request') {
                if (connected) fail('이미 친구입니다.');
                if (this.social.requests.some(r => [r.from, r.to].includes(token) && [r.from, r.to].includes(target))) fail('이미 진행 중인 친구 요청이 있습니다.');
                if (this.social.requests.filter(r => r.from === token || r.to === target).length >= 50) fail('친구 요청이 너무 많습니다.');
                this.social.requests.push({ from: token, to: target });
            } else if (operation === 'accept' || operation === 'reject') {
                const request = this.social.requests.find(r => r.from === target && r.to === token);
                if (!request) fail('받은 요청이 없습니다.');
                if (operation === 'accept' && !connected) this.social.friendships.push([token, target]);
                this.social.requests = this.social.requests.filter(r => r !== request);
            } else if (operation === 'cancel') {
                this.social.requests = this.social.requests.filter(r => !(r.from === token && r.to === target));
            } else if (operation === 'chat') {
                if (!connected) fail('친구 수락 후 대화할 수 있습니다.');
                const members = [this.sessions.get(token).playerId, peer[1].playerId];
                let room = [...this.chatRooms.values()].find(r => r.direct && r.members.length === 2 && members.every(id => r.members.includes(id)));
                if (!room) {
                    room = { id: `group_${randomUUID()}`, title: '친구 대화', members, messages: [], direct: true };
                    this.chatRooms.set(room.id, room);
                }
                return { roomId: room.id };
            } else fail('잘못된 친구 요청입니다.');
            if (this.nameFile) {
                fs.mkdirSync(path.dirname(this.nameFile), { recursive: true });
                fs.writeFileSync(`${this.nameFile}.social.tmp`, JSON.stringify(this.social), { mode: 0o600 });
                fs.renameSync(`${this.nameFile}.social.tmp`, `${this.nameFile}.social`);
            }
        }
        const describe = owner => {
            const entry = peers.find(([key]) => key === owner);
            const registered = [...this.names.values()].find(n => n.token === owner);
            return { id: entry?.[1].playerId, name: registered?.nickname || `플레이어 ${entry?.[1].playerId || ''}`, online: !!entry?.[1].active };
        };
        return {
            friends: this.social.friendships.filter(pair => pair.includes(token)).map(pair => describe(pair.find(owner => owner !== token))),
            incoming: this.social.requests.filter(r => r.to === token).map(r => describe(r.from)),
            outgoing: this.social.requests.filter(r => r.from === token).map(r => describe(r.to))
        };
    }

    snapshot(token) {
        this.prune();
        const active = [...this.sessions.values()].filter(s => s.active && this.now() - s.seen < this.timeoutMs);
        const session = this.sessions.get(token);
        return {
            totalCCU: active.length,
            capacity: this.capacity,
            currentChannelId: session?.channelId || null,
            playerId: session?.playerId,
            players: session?.channelId ? active.filter(s => s !== session && s.channelId === session.channelId && s.pose && this.now() - s.poseAt < 5000)
                .map(s => ({ ...s.pose, id: s.playerId })) : [],
            channels: [{ id: 'town-1', name: '타운 1', users: active.filter(s => s.channelId === 'town-1').length }]
        };
    }
}
