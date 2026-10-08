import { toastManager } from './ToastManager.js';
import { GiftInbox } from './GiftInbox.js';

export class FriendGifts {
    constructor(app) { this.app = app; this.pending = []; this.announced = new Set(); }
    openInbox() { this.inbox ||= new GiftInbox(this.app, this); this.inbox.open(); }
    eligible(item) { return item.quantity > 0 && !item.isEquipped && item.id !== 'item_lotto_ticket'; }
    open(player) {
        const engine = this.app.itemEngine;
        if (!engine) return;
        this.app.inventoryModal.openGift(player, {
            eligible:item=>this.eligible(item),
            remaining:()=>this.app.playerSocial.state.giftsRemaining??3,
            send:async item=>{
                try { const result=await this.send(player,item.id);toastManager.show(result.message,result.success);
                    if(result.success){this.app.inventoryModal.close();await this.app.playerSocial.refresh();}
                    return result;
                } catch {toastManager.show('선물 전송을 확인하고 있습니다. 잠시 후 다시 확인해 주세요.',false);return {success:false};}
            }
        });
    }
    async send(player, id) {
        if (this.busy || this.app.itemEngine.state.pendingGift) return { success: false, message: '이전 선물 전송을 확인 중입니다.' };
        const engine = this.app.itemEngine;
        const item = engine.state.inventory.find(i => i.id === id && this.eligible(i));
        if (!item) return { success: false, message: '선물할 아이템을 확인해 주세요.' };
        const gift = { giftId: crypto.randomUUID(), targetName: player.name || player.nickname, item: { ...structuredClone(item), quantity: 1 } };
        engine.consume(id, 1); engine.state.pendingGift = gift;
        if (this.app.itemGameplay.save() === false) { this.refund(gift); return { success: false, message: '저장하지 못해 선물을 보내지 않았습니다.' }; }
        this.app.itemGameplay.sync();
        return this.retry();
    }
    refund(gift) {
        const engine = this.app.itemEngine;
        const existing = engine.state.inventory.find(i => i.id === gift.item.id);
        if (existing) existing.quantity++; else engine.state.inventory.push(gift.item);
        delete engine.state.pendingGift;
        this.app.itemGameplay.sync();
    }
    async retry() {
        const engine = this.app.itemEngine;
        const gift = engine?.state.pendingGift;
        if (!gift || this.busy) return { success: false, message: '전송 확인 중입니다.' };
        this.busy = true;
        try {
            const result = await window.stockWarsChat.friends('gift', undefined, gift);
            if (result.error) {
                if (result.retryable !== false) return { success: false, message: '선물 전송을 확인 중입니다. 같은 아이템은 다시 차감되지 않습니다.' };
                this.refund(gift); return { success: false, message: result.error };
            }
            delete engine.state.pendingGift;
            this.app.itemGameplay.sync();
            return { success: true, message: `${gift.item.name} 1개를 선물했습니다. 오늘 ${result.giftsRemaining}개 더 보낼 수 있습니다.` };
        } finally { this.busy = false; }
    }
    async receive(gifts = []) {
        const engine = this.app.itemEngine;
        if (!engine || this.receiving) return;
        const claimed = engine.state.receivedGiftIds || [];
        this.pending = [...new Map(gifts.filter(g => g?.id && g.item && !claimed.includes(g.id)).map(g => [g.id, g])).values()];
        for (const gift of this.pending) {
            if (!this.announced.has(gift.id)) {
                this.announced.add(gift.id);
                toastManager.show(gift.fromName + '님이 선물을 보냈습니다. 버블의 선물함에서 받아 주세요.');
            }
        }
        if (this.inbox?.dialog.open) this.inbox.render();
        // Retry only acknowledgements for gifts already saved locally.
        const ack = gifts.filter(g => claimed.includes(g.id) && !g.preview).map(g => g.id).slice(0, 100);
        if (ack.length) { try { await window.stockWarsChat.friends('giftAck', undefined, { ids: ack }); } catch {} }
    }
    async claim(id) {
        const engine = this.app.itemEngine;
        if (!engine || this.receiving) return { success: false, message: '선물을 받는 중입니다. 잠시 기다려 주세요.' };
        const gift = this.pending.find(g => g.id === id);
        if (!gift) return { success: false, message: '이미 받았거나 찾을 수 없는 선물입니다.' };
        this.receiving = true;
        try {
            if (gift.preview) {
                if (!this.app.isLocalSession) return { success: false, message: '개발자 모드에서만 확인할 수 있어요.' };
                this.app.playerSocial.developerFriend.gifts = this.app.playerSocial.developerFriend.gifts.filter(g => g.id !== id);
                this.pending = this.pending.filter(g => g.id !== id);
                this.app.playerSocial.renderPanel();
                return { success: true, message: '테스트 선물 받기 완료! 실제 아이템은 지급되지 않았어요.' };
            }
            engine.state.receivedGiftIds ||= [];
            if (engine.state.receivedGiftIds.includes(id)) return { success: false, message: '이미 받은 선물입니다.' };
            const item = { ...structuredClone(gift.item), quantity: 1 };
            if (item.category === 'intel') item.id = 'gift_' + gift.id;
            const existing = engine.state.inventory.find(i => i.id === item.id);
            if (existing ? existing.quantity >= 99 : engine.state.inventory.length >= 24) return { success: false, message: '소지품 공간이 부족해요. 자리를 비운 뒤 다시 받아 주세요.' };
            if (existing) existing.quantity++; else engine.state.inventory.push(item);
            engine.state.receivedGiftIds.push(id);
            let saved;
            try { saved = this.app.itemGameplay.save(); } catch { saved = false; }
            if (saved === false) {
                engine.consume(item.id, 1); engine.state.receivedGiftIds.pop();
                return { success: false, message: '저장하지 못했어요. 선물은 보관 중이니 다시 시도해 주세요.' };
            }
            this.pending = this.pending.filter(g => g.id !== id);
            this.app.itemGameplay.sync();
            this.app.playerSocial?.renderPanel();
            try { await window.stockWarsChat.friends('giftAck', undefined, { ids: [id] }); } catch { /* Saved gift IDs prevent duplicate rewards; refresh retries the acknowledgement. */ }
            return { success: true, message: item.name + ' 1개를 받았어요. 소지품에서 확인해 주세요.' };
        } finally { this.receiving = false; }
    }
}
