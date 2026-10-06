import fs from 'node:fs';
import path from 'node:path';

export const giftDay = time => new Date(time + 9 * 3600000).toISOString().slice(0, 10);
export function giftState(registry, token) {
    const gifts = registry.social.gifts || [];
    return {
        giftsRemaining: Math.max(0, 3 - gifts.filter(g => g.from === token && g.day === giftDay(registry.now())).length),
        gifts: gifts.filter(g => g.to === token && !g.delivered).map(g => ({ id: g.id, fromName: g.fromName, item: g.item }))
    };
}
function commit(registry, social) {
    if (registry.nameFile) {
        const file = `${registry.nameFile}.social`;
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(`${file}.tmp`, JSON.stringify(social), { mode: 0o600 });
        fs.renameSync(`${file}.tmp`, file);
    }
    registry.social = social;
}
export function handleGift(registry, token, options) {
    const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
    const gifts = registry.social.gifts || [];
    if (options.operation === 'giftAck') {
        if (!Array.isArray(options.ids) || options.ids.length > 100 || options.ids.some(id => typeof id !== 'string')) fail('수령 기록을 확인해 주세요.');
        commit(registry, { ...registry.social, gifts: gifts.map(g => g.to === token && options.ids.includes(g.id) ? { ...g, delivered: true } : g) });
        return { success: true, ...giftState(registry, token) };
    }
    const { giftId, targetName, item } = options;
    if (typeof giftId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(giftId)) fail('선물 요청 번호를 확인해 주세요.');
    const previous = gifts.find(g => g.id === giftId);
    if (previous) {
        if (previous.from !== token) fail('다른 선물 요청입니다.');
        return { success: true, giftId, ...giftState(registry, token) };
    }
    const target = [...registry.names.values()].find(n => n.nickname === targetName)?.token;
    if (!target || target === token || !registry.social.friendships.some(pair => pair.includes(token) && pair.includes(target))) fail('수락한 친구에게만 선물할 수 있습니다.');
    if (!giftState(registry, token).giftsRemaining) fail('찌라시 포함 하루 선물 한도 3개를 모두 사용했습니다.');
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || item.id.length > 100 || item.name.length > 100 || item.quantity !== 1 || item.isEquipped || item.id === 'item_lotto_ticket' || JSON.stringify(item).length > 2500) fail('이 아이템은 선물할 수 없습니다.');
    const clean = JSON.parse(JSON.stringify(item));
    delete clean.isEquipped;
    const sender = [...registry.names.values()].find(n => n.token === token)?.nickname || '친구';
    commit(registry, { ...registry.social, gifts: [...gifts, { id: giftId, from: token, to: target, fromName: sender, day: giftDay(registry.now()), item: clean, delivered: false }] });
    return { success: true, giftId, ...giftState(registry, token) };
}