import test from 'node:test';
import assert from 'node:assert/strict';
import { atStoreEntrance, otherStoreTripEntrance } from '../js/app/exhibition/StoreDestinationGuard.js';
import { TOWN_MODEL_BUILDINGS } from '../js/data/townModelBuildings.js';

test('direct shop entry accepts the full door interaction approach without requiring the board', () => {
    const store = TOWN_MODEL_BUILDINGS.find(b => b.id === 'vivian_store');
    const charPosX = store.x + (store.entranceOffsetX || 0);
    assert(atStoreEntrance({ charPosX, charPosY: store.y + 150 }));
    assert(!atStoreEntrance({ charPosX, charPosY: store.y + 170 }));
});

test('shop trip reminder recognizes every other entrance including offset doors', () => {
    for (const b of TOWN_MODEL_BUILDINGS) {
        const near = otherStoreTripEntrance({ charPosX: b.x + (b.entranceOffsetX || 0), charPosY: b.y + 70 });
        assert.equal(near?.id, b.id === 'vivian_store' ? undefined : b.id);
    }
});
test('walking past a building or being far away does not count as trying its entrance', () => {
    const buildings = [{ id: 'home', x: 300, y: 500, entranceOffsetX: 40 }];
    assert.equal(otherStoreTripEntrance({ charPosX: 430, charPosY: 570 }, buildings), undefined);
    assert.equal(otherStoreTripEntrance({ charPosX: 340, charPosY: 700 }, buildings), undefined);
});

test('Moa return trip recognizes every entrance including the shop', () => {
    for (const b of TOWN_MODEL_BUILDINGS) {
        assert.equal(otherStoreTripEntrance({ charPosX: b.x + (b.entranceOffsetX || 0),
            charPosY: b.y + 70 }, TOWN_MODEL_BUILDINGS, null)?.id, b.id);
    }
});

test('stock trip allows securities and recognizes every other building entrance', () => {
    for (const b of TOWN_MODEL_BUILDINGS) {
        assert.equal(otherStoreTripEntrance({ charPosX: b.x + (b.entranceOffsetX || 0),
            charPosY: b.y + 70 }, TOWN_MODEL_BUILDINGS, 'cipher_securities')?.id,
        b.id === 'cipher_securities' ? undefined : b.id);
    }
});

test('bank trip allows only the bank and recognizes the information office and offset entrances',()=>{
 for(const b of TOWN_MODEL_BUILDINGS)assert.equal(otherStoreTripEntrance({charPosX:b.x+(b.entranceOffsetX||0),charPosY:b.y+110},TOWN_MODEL_BUILDINGS,'node_finance')?.id,b.id==='node_finance'?undefined:b.id);
});

test('bank reminder covers the outer edge of the F entry approach',()=>{const b=TOWN_MODEL_BUILDINGS.find(b=>b.id==='settlement_information');assert.equal(otherStoreTripEntrance({charPosX:b.x,charPosY:b.y+160},TOWN_MODEL_BUILDINGS,'node_finance')?.id,b.id);});
