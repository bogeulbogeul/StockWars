import fs from 'node:fs';
import assert from 'node:assert/strict';
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const extraUrl = moduleUrl(fs.readFileSync('web/js/data/additionalRumors.js', 'utf8'));
const inventorySource = fs.readFileSync('web/js/data/inventoryData.js', 'utf8').replace('./additionalRumors.js', extraUrl);
const resolvedInventory = inventorySource.replace('./ordinaryRumors.js', moduleUrl(fs.readFileSync('web/js/data/ordinaryRumors.js', 'utf8')))
    .replace('./rumorBalance.js', moduleUrl(fs.readFileSync('web/js/data/rumorBalance.js', 'utf8')));
const { ITEM_CATALOG_DB } = await import(moduleUrl(resolvedInventory));
const { RUMOR_BALANCE } = await import(moduleUrl(fs.readFileSync('web/js/data/rumorBalance.js', 'utf8')));
const { RUMOR_CLUES } = await import(moduleUrl(fs.readFileSync('web/js/data/rumorClues.js', 'utf8')));
const items = ITEM_CATALOG_DB.filter(item => item.category === 'intel' && item.targetStockId);
const headers = ['RumorId', 'StockId', 'StockName', 'Sector', 'Type', 'Rarity', 'BasePrice', 'RarityWeight', 'Timeframe', 'ExpectedChange', 'Level1Text', 'Level2Text', 'Level3Text', 'Level4Text', 'Level5Text', 'RuntimeStatus', 'Source'];
const rows = items.map(item => {
    const clues = item.rumorClues || RUMOR_CLUES[item.targetStockId];
    assert.equal(clues.length, 4);
    assert.ok(clues.every(text => text && !text.includes('[REDACTED]')));
    return [item.id, item.targetStockId, item.targetStockName, item.targetSector,
        /반전/.test(item.targetChange) ? 'Conditional' : /하락|^-/.test(item.targetChange) ? 'Bearish' : 'Bullish', item.rarity,
        item.price, RUMOR_BALANCE[item.rarity].weight, item.targetTimeframe || '', item.targetChange, ...clues, item.intelReport,
        'ImplementedText', item.rumorClues ? (item.id.includes('cloudberry_fire') || item.id.includes('stardust_') || item.id.includes('forestlab_') ? 'web/js/data/additionalRumors.js' : 'web/js/data/ordinaryRumors.js') : 'web/js/data/inventoryData.js;web/js/data/rumorClues.js'];
});
assert.equal(new Set(rows.map(row => row[0])).size, rows.length);
assert.ok(rows.every(row => row.length === headers.length));
const quote = text => '"' + String(text).replaceAll('"', '""') + '"';
fs.mkdirSync('Docs/Data', { recursive: true });
fs.writeFileSync('Docs/Data/Rumors.csv', '\uFEFF' + [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n') + '\r\n');
console.log(`Exported ${rows.length} events, ${rows.length * 5} interpretation texts; unique IDs and complete stages verified.`);
