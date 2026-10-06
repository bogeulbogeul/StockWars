import { toastManager } from './ToastManager.js';

export class FriendGifts {
    constructor(app) { this.app = app; }
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
        this.receiving = true;
        try {
            engine.state.receivedGiftIds ||= [];
            const ack = [];
            for (const gift of gifts.slice(0, 100)) {
                if (engine.state.receivedGiftIds.includes(gift.id)) { ack.push(gift.id); continue; }
                const item = { ...structuredClone(gift.item), quantity: 1 };
                if (item.category === 'intel') item.id = `gift_${gift.id}`;
                const existing = engine.state.inventory.find(i => i.id === item.id);
                if (existing ? existing.quantity >= 99 : engine.state.inventory.length >= 24) continue;
                if (existing) existing.quantity++; else engine.state.inventory.push(item);
                engine.state.receivedGiftIds.push(gift.id);
                if (this.app.itemGameplay.save() === false) {
                    engine.consume(item.id, 1); engine.state.receivedGiftIds.pop(); break;
                }
                ack.push(gift.id);
                this.app.itemGameplay.sync();
                toastManager.show(`${gift.fromName}님이 보낸 ${item.name} 1개를 받았습니다.`);
            }
            if (ack.length) await window.stockWarsChat.friends('giftAck', undefined, { ids: ack });
        } finally { this.receiving = false; }
    }
}
