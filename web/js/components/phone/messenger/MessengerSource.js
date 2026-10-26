// Adapter for the existing desktop social bridge. No demo contacts or fake sends.
export class MessengerSource {
    constructor(enabled) { this.enabled = enabled; }
    get online() { return !!this.enabled?.() && !!globalThis.stockWarsChat?.friends && !!globalThis.stockWarsChat?.room; }
    async call(method, ...args) {
        if (!this.online) throw new Error('친구 추가와 채팅은 서버에 연결된 게임에서 사용할 수 있어요.');
        const result = await globalThis.stockWarsChat[method](...args);
        if (!result || result.error) throw new Error(result?.error || '서버 응답을 확인할 수 없어요.');
        return result;
    }
    friends() { return this.call('friends', 'list'); }
    search(query) { return this.call('friends', 'search', undefined, { query }); }
    friend(action, player) { return this.call('friends', action, player.id, { targetName: player.name }); }
    rooms() { return this.call('list'); }
    messages(roomId) { return this.call('room', 'list', { roomId }); }
    create(title, members) { return this.call('room', 'create', { title, members }); }
    send(roomId, text) { return this.call('room', 'send', { roomId, text }); }
}
