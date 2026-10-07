import http from 'node:http';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { PresenceRegistry } from './registry.mjs';
import { OnlineArena } from './arena.mjs';
import { configuredPlayerStore } from './player-store.mjs';

export function createPresenceServer({ registry = new PresenceRegistry(), durable = null } = {}) {
    const arena = new OnlineArena(registry);
    const server = http.createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const reply = async (status, body) => { if (durable && status < 400 && req.method === 'POST') await durable.flush(registry); res.writeHead(status); res.end(JSON.stringify(body)); };
        if (req.method === 'GET' && req.url === '/health') return reply(200, { status: 'ok', dataEpoch: 'alpha-reset-20261006-v1', giftsDailyLimit: 3, onlineArena: true, arenaRoomCleanup: true, guestDeletion: true, socialFeatures: 2, seatingSync: true, durableStorage: durable ? 'supabase' : 'local' });
        if (req.method !== 'POST' || !['/api/presence', '/api/chat','/api/arena'].includes(req.url)) return reply(404, { error: 'Not found' });
        try {
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 4096) return reply(413, { error: 'Request too large' });
            }
            const input = JSON.parse(body);
            if (!input || typeof input.action !== 'string') return reply(400, { error: 'Invalid request' });
            const token = req.headers.authorization?.replace(/^Bearer /, '');
            if (req.url === '/api/arena') return await reply(200, arena.handle(token, input));
            if (req.url === '/api/chat') return await reply(200, registry.chat(token, input.action, input.text, input));
            if (input.action === 'forget') {
                // The bearer token can remove only its own guest record.
                const result = registry.forget(token);
                for (const [id, room] of arena.rooms) {
                    room.members.delete(token);
                    if (room.invited) room.invited.delete?.(token);
                    if (!room.members.size) arena.rooms.delete(id);
                    else if (room.owner === token) room.owner = room.members.keys().next().value;
                }
                for (const [id, room] of arena.completed) {
                    room.snapshots.delete(token);
                    room.acknowledged.delete(token);
                    if (!room.snapshots.size) arena.completed.delete(id);
                }
                return await reply(200, result);
            }
            const result = input.action === 'session'
                ? registry.session(token)
                : registry.update(token, input.action, input.channelId, input.pose);
            await reply(200, result);
        } catch (error) {
            reply(error.status || (error instanceof SyntaxError ? 400 : 500), {
                error: error.status ? error.message : '요청을 처리하지 못했습니다.'
            });
        }
    });
    const cleanup = setInterval(() => { arena.sweep(); if(durable)durable.flush(registry).catch(error=>console.error('Arena storage flush failed',error.message)); }, 1000);
    cleanup.unref();server.on('close',()=>clearInterval(cleanup));
    return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const registry = new PresenceRegistry({ nameFile: process.env.STOCKWARS_NAME_FILE || fileURLToPath(new URL('./data/player-names-alpha-reset-v1.json', import.meta.url)) });
    const durable = configuredPlayerStore();
    if (!durable && process.env.STOCKWARS_REQUIRE_DURABLE === 'true') throw new Error('친구 기록 보존을 위해 무료 저장소를 먼저 연결해야 합니다.');
    if (durable) await durable.restore(registry);
    const server = createPresenceServer({ registry, durable });
    const port = Number(process.env.PORT || 8080);
    server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Presence server listening on ${port}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
