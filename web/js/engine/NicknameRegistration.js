export async function registerNickname(input, bridge) {
    const nickname = String(input || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!nickname || Array.from(nickname).length > 24 || /[\p{Cc}\p{Cf}]/u.test(nickname)) throw new Error('닉네임은 1~24자로 입력해 주세요.');
    // Browser/local previews have no multiplayer bridge. Verify on online town entry.
    if (!bridge?.claimNickname) return { nickname, pending: true };
    let result;
    try { result = await bridge.claimNickname(nickname); }
    catch { return { nickname, pending: true }; }
    if (result?.error) {
        // Older servers reject the new action; connectivity failures are not duplicates.
        if (result.status === 409 || /이미 사용|중복|닉네임은|잘못된 닉네임/.test(result.error)) throw new Error(result.error);
        return { nickname, pending: true };
    }
    return { nickname, pending: false };
}
