// AI match records use the same result fields as online match history.
export function saveAiArenaHistory(room, players, storage = localStorage, ended = Date.now()) {
    const sorted = [...players].sort((a, b) => Number(!!a.forfeited) - Number(!!b.forfeited) || b.assets - a.assets);
    let rank = 1;
    const results = sorted.map((player, index) => {
        const previous = sorted[index - 1];
        if (previous && (player.assets !== previous.assets || !!player.forfeited !== !!previous.forfeited)) rank = index + 1;
        return { ...player, isOwn: player.name === '나', forfeited: !!player.forfeited, rank };
    });
    const winners = results.filter(player => player.rank === 1 && !player.forfeited);
    const pot = (room.stake || 0) * results.length;
    for (const player of results) player.payout = winners.includes(player) ? Math.floor(pot / winners.length) : 0;
    const key = 'stockwars.arena.aiHistory';
    let history;
    try { history = JSON.parse(storage.getItem(key) || '[]'); } catch { history = []; }
    if (!Array.isArray(history)) history = [];
    const record = { id: room.id, name: room.name, ended, cash: room.cash, stake: room.stake || 0, ai: true, results };
    storage.setItem(key, JSON.stringify([...history, record].slice(-100)));
    return record;
}
