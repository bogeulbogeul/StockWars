const fs = require('node:fs');

class PresenceClient {
  constructor({ url, tokenFile, fetchImpl = fetch }) {
    Object.assign(this, { url, tokenFile, fetch: fetchImpl });
    this.token = null;
    this.snapshot = null;
    this.error = url ? '서버 연결 중' : '테스트 서버 주소 미설정';
    this.queue = Promise.resolve();
    this.desiredChannel = null;
    try { this.token = JSON.parse(fs.readFileSync(tokenFile, 'utf8')).token; } catch {}
  }

  async request(action, channelId) {
    const started = Date.now();
    const response = await this.fetch(new URL('/api/presence', this.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      body: JSON.stringify({ action, channelId }), signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || '서버 연결 실패'), { status: response.status });
    if (data.token && data.token !== this.token) {
      this.token = data.token;
      fs.writeFileSync(this.tokenFile, JSON.stringify({ token: this.token }), { mode: 0o600 });
    }
    this.snapshot = { totalCCU: data.totalCCU, capacity: data.capacity, channels: data.channels,
      currentChannelId: data.currentChannelId, ping: Date.now() - started };
    this.error = null;
    return this.snapshot;
  }

  command(action, channelId) {
    const operation = async () => {
      if (action === 'leave' || action === 'disconnect') this.desiredChannel = null;
      if (!this.url) return { error: this.error };
      try {
        if (!this.snapshot) {
          await this.request('session');
          if (this.desiredChannel && action === 'heartbeat') await this.request('join', this.desiredChannel);
        }
        let result;
        try { result = await this.request(action, channelId); }
        catch (error) {
          if (error.status !== 401) throw error;
          await this.request('session');
          if (this.desiredChannel && action === 'heartbeat') await this.request('join', this.desiredChannel);
          result = await this.request(action, channelId);
        }
        if (action === 'heartbeat' && this.desiredChannel && result.currentChannelId !== this.desiredChannel) {
          result = await this.request('join', this.desiredChannel);
        } else if (action === 'heartbeat' && !this.desiredChannel && result.currentChannelId) {
          result = await this.request('leave');
        }
        if (action === 'join') this.desiredChannel = channelId;
        if (action === 'leave' || action === 'disconnect') this.desiredChannel = null;
        return { snapshot: result };
      } catch (error) {
        this.snapshot = null;
        this.error = error.status ? error.message : '서버 연결 끊김 · 재연결 중';
        return { error: this.error };
      }
    };
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }

  start() {
    void this.command('heartbeat');
    this.timer = setInterval(() => { void this.command('heartbeat'); }, 10000);
  }
  chat(action, text, options = {}) {
    const operation = async () => {
      if (!this.url) return { error: '테스트 서버 주소 미설정' };
      try {
        if (!this.snapshot) await this.request('session');
        const send = async () => {
          const response = await this.fetch(new URL('/api/chat', this.url), {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
            body: JSON.stringify({ ...options, action, text }), signal: AbortSignal.timeout(5000)
          });
          const data = await response.json();
          if (!response.ok) throw Object.assign(new Error(data.error || '채팅 연결 실패'), { status: response.status });
          return data;
        };
        try { return await send(); }
        catch (error) {
          if (error.status !== 401) throw error;
          await this.request('session');
          return await send();
        }
      } catch (error) { return { error: error.status ? error.message : '채팅 서버에 연결할 수 없습니다.' }; }
    };
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }
  stop() { clearInterval(this.timer); return this.command('disconnect'); }
  state() { return { snapshot: this.snapshot, error: this.error }; }
}
module.exports = { PresenceClient };
