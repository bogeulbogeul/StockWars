export async function registerNickname(input, bridge) {
    const nickname = String(input || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!nickname || Array.from(nickname).length > 10 || /[\p{Cc}\p{Cf}]/u.test(nickname)) throw new Error('닉네임은 1~10자로 입력해 주세요.');
    // Browser/local previews have no multiplayer bridge. Verify on online town entry.
    if (!bridge?.claimNickname) return { nickname, pending: true };
    let result;
    try { result = await bridge.claimNickname(nickname); }
    catch { throw new Error('닉네임 중복 확인 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'); }
    if (result?.error) {
        throw new Error(result.error);
    }
    if (!result?.snapshot || result.snapshot.local) throw new Error('온라인 서버에서 닉네임을 확인하지 못했습니다. 다시 시도해 주세요.');
    if (result.snapshot.uniqueNicknames !== true) throw new Error('닉네임 중복 방지를 위해 온라인 서버 업데이트가 필요합니다.');
    return { nickname, pending: false };
}
