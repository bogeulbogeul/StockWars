import test from 'node:test';
import assert from 'node:assert/strict';
import { registerNickname } from '../js/engine/NicknameRegistration.js';

test('browser and older preload can advance with a pending local nickname', async () => {
    assert.deepEqual(await registerNickname('  황금   개미  '), { nickname: '황금 개미', pending: true });
    assert.equal((await registerNickname('테스트', { join() {} })).pending, true);
});
test('online registration blocks on server errors and connection failures', async () => {
    for (const error of ['잘못된 요청입니다.', '서버 연결 끊김 · 재연결 중', '테스트 서버 주소 미설정']) {
        await assert.rejects(registerNickname('보글보글', { claimNickname: async () => ({ error }) }), { message: error });
    }
    await assert.rejects(registerNickname('보글보글', { claimNickname: async () => { throw new Error('IPC disconnected'); } }), /연결할 수 없습니다/);
    await assert.rejects(registerNickname('보글보글', { claimNickname: async () => ({ error: '사용할 수 없는 이름', status: 409 }) }), /사용할 수 없는/);
});

test('online duplicate nicknames are rejected and valid reservations succeed', async () => {
    await assert.rejects(registerNickname('고래', { claimNickname: async () => ({ error: '이미 사용 중인 닉네임입니다.' }) }), /이미 사용 중/);
    await assert.rejects(registerNickname(' '), /1~10/);
    assert.deepEqual(await registerNickname('고래', { claimNickname: async () => ({ snapshot: { uniqueNicknames: true } }) }), { nickname: '고래', pending: false });
});

test('online registration accepts servers that permit duplicate nicknames', async () => {
    for (const uniqueNicknames of [true, false, undefined]) {
        assert.deepEqual(await registerNickname('고래', { claimNickname: async () => ({ snapshot: { uniqueNicknames } }) }), { nickname: '고래', pending: false });
    }
});

test('local or missing server responses cannot confirm online registration', async () => {
    for (const result of [undefined, {}, { snapshot: { local: true } }]) {
        await assert.rejects(registerNickname('고래', { claimNickname: async () => result }), /온라인 서버/);
    }
});
