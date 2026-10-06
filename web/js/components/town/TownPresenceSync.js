export class TownPresenceSync {
    constructor(stage, bridge) { this.stage = stage; this.bridge = bridge; this.generation = 0; }
    start() {
        this.stop();
        if (!this.bridge?.position) return;
        const generation = this.generation;
        const poll = async () => {
            try {
                const p = this.stage.playerController;
                const result = await this.bridge.position({ x: p.charPosX, y: p.charPosY, facing: p.facing,
                    resting: p.isResting, nickname: this.stage.nickname, ...this.stage.callbacks?.getPlayerSocialProfile?.() });
                if (generation !== this.generation) return;
                this.stage.setRemotePlayers(result.snapshot?.players || []);
            } catch {
                if (generation === this.generation) this.stage.setRemotePlayers([]);
            }
            if (generation === this.generation) this.timer = setTimeout(poll, 200);
        };
        void poll();
    }
    stop() { this.generation++; clearTimeout(this.timer); }
}
