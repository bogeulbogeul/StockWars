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

  async request(action, channelId, pose) {
    const started = Date.now();
    const response = await this.fetch(new URL('/api/presence', this.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
      body: JSON.stringify({ action, channelId, pose }), signal: AbortSignal.timeout(action === 'forget' ? 20000 : 5000)
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.error || '서버 연결 실패'), { status: response.status });
    if (data.token && data.token !== this.token) {
      this.token = data.token;
      fs.writeFileSync(this.tokenFile, JSON.stringify({ token: this.token }), { mode: 0o600 });
    }
    if (action === 'forget') return data;
    this.snapshot = { totalCCU: data.totalCCU, capacity: data.capacity, channels: data.channels,
      currentChannelId: data.currentChannelId, playerId: data.playerId, players: data.players, ping: Date.now() - started };
    this.error = null;
    return this.snapshot;
  }

  command(action, channelId, pose) {
    const operation = async () => {
      if (this.localMode) {
        if (action === 'join') this.desiredChannel = 'town-1';
        if (action === 'leave' || action === 'disconnect') this.desiredChannel = null;
        return this.localState();
      }
      if (action === 'leave' || action === 'disconnect') this.desiredChannel = null;
      if (!this.url) return { error: this.error };
      try {
        if (!this.snapshot) {
          await this.request('session');
          if (this.desiredChannel && action === 'heartbeat') await this.request('join', this.desiredChannel);
        }
        let result;
        try { result = await this.request(action, channelId, pose); }
        catch (error) {
          if (error.status !== 401 && !(action === 'position' && error.status === 409 && this.desiredChannel)) throw error;
          await this.request('session');
          if (this.desiredChannel && ['heartbeat', 'position'].includes(action)) await this.request('join', this.desiredChannel);
          result = await this.request(action, channelId, pose);
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
        return { error: this.error, status: error.status || null };
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
      if (this.localMode) return { error: '로컬 개발자 모드에서는 온라인 소셜 기능을 사용할 수 없습니다.' };
      if (!this.url) return { error: '테스트 서버 주소 미설정' };
      try {
        if (!this.snapshot) await this.request('session');
        const send = async () => {
          const response = await this.fetch(new URL('/api/chat', this.url), {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
            body: JSON.stringify({ ...options, action, text }), signal: AbortSignal.timeout(5000)
          });
          const data = await response.json();
          if (!response.ok) throw Object.assign(new Error(response.status === 404
            ? '서버 업데이트가 필요합니다. 잠시 후 다시 시도해 주세요.'
            : data.error || '채팅 연결 실패'), { status: response.status });
          return data;
        };
        try { return await send(); }
        catch (error) {
          if (error.status !== 401) throw error;
          await this.request('session');
          return await send();
        }
      } catch (error) { return { error: error.status ? error.message : '채팅 서버에 연결할 수 없습니다.', retryable: !error.status || error.status >= 500 }; }
    };
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }
  arena(input) {
    const operation = async () => {
      if (this.localMode) return { error: '로컬 개발자 모드에서는 온라인 대결을 사용할 수 없습니다.' };
      if (!this.url) return { error: '온라인 서버 주소가 설정되지 않았습니다.' };
      try {
        if (!this.snapshot) await this.request('session');
        const send = async () => {
          const response = await this.fetch(new URL('/api/arena', this.url), {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
            body: JSON.stringify(input), signal: AbortSignal.timeout(5000)
          });
          const result = await response.json();
          if (!response.ok) throw Object.assign(new Error(result.error || '대결 서버 연결 실패'), { status: response.status });
          return result;
        };
        try { return await send(); } catch (error) { if (error.status !== 401) throw error; await this.request('session'); return await send(); }
      } catch (error) { return { error: error.status ? error.message : '온라인 대결 서버에 연결할 수 없습니다.', retryable: !error.status || error.status >= 500 }; }
    };
    this.queue = this.queue.then(operation, operation); return this.queue;
  }
  async stop({ deleteUser = false } = {}) {
    clearInterval(this.timer);
    if (!deleteUser) return this.command('disconnect');
    // Drain pending writes before deleting, without creating a replacement session.
    await this.queue;
    if (!this.token || !this.url) return { success: true };
    const result = await this.request('forget');
    if (!result.deleted) throw new Error('서버 업데이트가 필요합니다. 유저 기록 삭제를 확인하지 못했습니다.');
    fs.rmSync(this.tokenFile, { force: true });
    this.token = null; this.snapshot = null;
    return { success: true };
  }
  localState() {
    return { snapshot: { local: true, totalCCU: 1, capacity: 1,
      channels: [{ id: 'town-1', name: '로컬 개발자 마을', users: this.desiredChannel ? 1 : 0 }],
      currentChannelId: this.desiredChannel, playerId: 'local-player', players: [], ping: 0 }, error: null };
  }
  setLocalMode(enabled) {
    const operation = async () => {
      if (enabled === !!this.localMode) return this.state();
      if (enabled && this.snapshot && this.url) {
        try { await this.request('disconnect'); } catch { /* Server expires disconnected sessions. */ }
      }
      this.localMode = enabled;
      this.desiredChannel = null;
      this.snapshot = null;
      this.error = null;
      return this.state();
    };
    this.queue = this.queue.then(operation, operation);
    return this.queue;
  }
  state() { return this.localMode ? this.localState() : { snapshot: this.snapshot, error: this.error }; }
}
module.exports = { PresenceClient };
