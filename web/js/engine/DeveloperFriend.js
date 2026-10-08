export const DEVELOPER_FRIEND_ID = 'dev_friend_fixture';

// Local developer fixture. Never calls the social server or consumes inventory.
export class DeveloperFriend {
    constructor() { this.reset(); }
    reset() {
        this.status = 'none';
        this.player = { id: DEVELOPER_FRIEND_ID, nickname: '테스트 트레이더', name: '테스트 트레이더', level: 3, trait: '개발자 테스트 친구', location: 'town', facing: 'down' };
        this.messages = [];
        this.gifts = [];
        this.nextGift = 1;
    }
    snapshot() {
        return { friends: this.status === 'friends' ? [this.player] : [], incoming: this.status === 'incoming' ? [this.player] : [], outgoing: this.status === 'outgoing' ? [this.player] : [], gifts: this.gifts, giftsRemaining: 3 };
    }
    command(action) {
        if (action === 'request') this.status = 'outgoing';
        else if (action === 'simulateAccept' && this.status === 'outgoing') this.status = 'friends';
        else if (action === 'simulateIncoming') this.status = 'incoming';
        else if (action === 'accept' && this.status === 'incoming') this.status = 'friends';
        else if (action === 'cancel' || action === 'reject') this.status = 'none';
        else if (action === 'simulateGift' && this.status === 'friends') {
            if (this.gifts.length >= 5) return { success: false };
            this.gifts.push({ id: `dev-gift-${this.nextGift++}`, fromName: this.player.name, preview: true, item: { id: 'item_energy_drink', name: '에너지 드링크', icon: '🥤', category: 'consumable', quantity: 1 } });
        }
        else return { success: false };
        return { success: true, ...this.snapshot() };
    }
    send(text) {
        const clean = String(text).trim();
        if (this.status !== 'friends' || !clean || clean.length > 500) return false;
        this.messages.push({ own: true, text: clean }, { own: false, text: '테스트 메시지를 받았어요! 실제 플레이어에게는 전송되지 않습니다.' });
        this.messages = this.messages.slice(-40);
        return true;
    }
}
