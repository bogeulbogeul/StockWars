import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { PresenceRegistry } from './registry.mjs';

export function createPresenceServer({ registry = new PresenceRegistry() } = {}) {
    return http.createServer(async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const reply = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
        if (req.method === 'GET' && req.url === '/health') return reply(200, { status: 'ok' });
        if (req.method !== 'POST' || !['/api/presence', '/api/chat'].includes(req.url)) return reply(404, { error: 'Not found' });
        try {
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 4096) return reply(413, { error: 'Request too large' });
            }
            const input = JSON.parse(body);
            if (!input || typeof input.action !== 'string') return reply(400, { error: 'Invalid request' });
            const token = req.headers.authorization?.replace(/^Bearer /, '');
            if (req.url === '/api/chat') return reply(200, registry.chat(token, input.action, input.text, input));
            const result = input.action === 'session'
                ? registry.session(token)
                : registry.update(token, input.action, input.channelId);
            reply(200, result);
        } catch (error) {
            reply(error.status || (error instanceof SyntaxError ? 400 : 500), {
                error: error.status ? error.message : '요청을 처리하지 못했습니다.'
            });
        }
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const server = createPresenceServer();
    const port = Number(process.env.PORT || 8080);
    server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Presence server listening on ${port}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
