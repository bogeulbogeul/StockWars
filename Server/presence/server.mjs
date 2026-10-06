import http from 'node:http';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { PresenceRegistry } from './registry.mjs';

export function createPresenceServer({ registry = new PresenceRegistry() } = {}) {
    const arenaRooms=new Map();
    return http.createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const reply = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
        if (req.method === 'GET' && req.url === '/health') return reply(200, { status: 'ok', dataEpoch: 'alpha-reset-20261006-v1' });
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
            if(req.url==='/api/arena'){
                const session=registry.sessions.get(token);
                if(!session)return reply(401,{error:'세션을 다시 연결해 주세요.'});
                session.seen=registry.now();
                for(const [id,room] of arenaRooms)if(registry.now()-room.updated>120000)arenaRooms.delete(id);
                if(input.action==='publish'){
                    const r=input.room;
                    if(!r||typeof r.id!=='string'||typeof r.name!=='string'||!r.name.trim()||r.name.length>40||![3,5,10].includes(r.minutes)||![10000,100000,1000000].includes(r.cash)||!Number.isSafeInteger(r.stake)||!(r.stake===0||(r.stake>=r.cash*.01&&r.stake<=r.cash*.1&&r.stake%100===0)))return reply(400,{error:'잘못된 방 설정입니다.'});
                    const previous=arenaRooms.get(r.id);if(previous&&previous.owner!==token)return reply(403,{error:'방 권한이 없습니다.'});
                    if(!previous&&arenaRooms.size>=200)return reply(409,{error:'방이 가득 찼습니다.'});
                    arenaRooms.set(r.id,{id:r.id,name:r.name,minutes:r.minutes,cash:r.cash,stake:r.stake,passwordHash:r.passwordHash||null,owner:token,host:`플레이어 ${session.playerId}`,updated:registry.now()});
                }else if(input.action==='remove'){
                    if(arenaRooms.get(input.id)?.owner===token)arenaRooms.delete(input.id);
                }else if(input.action==='join'){
                    const room=arenaRooms.get(input.id);if(!room)return reply(404,{error:'방이 종료되었습니다.'});
                    if(room.passwordHash&&room.passwordHash!==input.passwordHash)return reply(403,{error:'비밀번호가 일치하지 않습니다.'});
                    return reply(200,{room:{id:room.id,name:room.name,minutes:room.minutes,cash:room.cash,stake:room.stake,host:room.host},waiting:true});
                }else if(input.action==='find'){
                    const query=String(input.query||'').trim().toLowerCase();if(!query)return reply(400,{error:'방 이름이나 코드를 입력해 주세요.'});
                    return reply(200,{rooms:[...arenaRooms.values()].filter(r=>r.passwordHash?r.id.toLowerCase()===query:`${r.id} ${r.name} ${r.host}`.toLowerCase().includes(query)).map(({owner,updated,passwordHash,...room})=>({...room,locked:!!passwordHash}))});
                }else if(input.action!=='list')return reply(400,{error:'잘못된 요청입니다.'});
                return reply(200,{rooms:[...arenaRooms.values()].filter(r=>r.owner!==token&&!r.passwordHash).map(({owner,updated,passwordHash,...room})=>room)});
            }
            if (req.url === '/api/chat') return reply(200, registry.chat(token, input.action, input.text, input));
            const result = input.action === 'session'
                ? registry.session(token)
                : registry.update(token, input.action, input.channelId, input.pose);
            reply(200, result);
        } catch (error) {
            reply(error.status || (error instanceof SyntaxError ? 400 : 500), {
                error: error.status ? error.message : '요청을 처리하지 못했습니다.'
            });
        }
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const oldNameFile = fileURLToPath(new URL('./data/player-names.json', import.meta.url));
    for (const file of [oldNameFile, `${oldNameFile}.social`]) fs.rmSync(file, { force: true });
    const server = createPresenceServer({ registry: new PresenceRegistry({ nameFile: fileURLToPath(new URL('./data/player-names-alpha-reset-v1.json', import.meta.url)) }) });
    const port = Number(process.env.PORT || 8080);
    server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Presence server listening on ${port}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
