const fs = require('node:fs');

// The marker survives renderer reloads and the test build's localStorage reset.
class DemoLifecycle {
  constructor({ markerFile, presence }) {
    this.markerFile = markerFile;
    this.presence = presence;
    this.pending = null;
    if (this.status().ended) this.presence.deletionLocked = true;
  }
  status() {
    if (!fs.existsSync(this.markerFile)) return { ended: false };
    try { return { ended: true, complete: JSON.parse(fs.readFileSync(this.markerFile, 'utf8')).complete === true }; }
    catch { return { ended: true, complete: false }; }
  }
  mark() {
    if (!this.status().ended) fs.writeFileSync(this.markerFile, JSON.stringify({ complete: false }), { mode: 0o600 });
    this.presence.deletionLocked = true;
    this.presence.localMode = true;
    clearInterval(this.presence.timer);
    return { success: true };
  }
  discard() {
    if (this.pending) return this.pending;
    this.mark();
    this.pending = (async () => {
      // Repeating forget is safe, including after a lost server acknowledgement.
      await this.presence.stop({ deleteUser: true });
      fs.writeFileSync(this.markerFile, JSON.stringify({ complete: true }), { mode: 0o600 });
      return { success: true };
    })().finally(() => { this.pending = null; });
    return this.pending;
  }
  restart() {
    if (this.pending || !this.status().complete) throw new Error('기록 삭제 완료 후 새로 시작할 수 있습니다.');
    fs.rmSync(this.markerFile, { force: true });
    this.presence.deletionLocked = false;
    this.presence.localMode = true;
    this.presence.desiredChannel = null;
    this.presence.start();
    return { success: true };
  }
}
module.exports = { DemoLifecycle };
