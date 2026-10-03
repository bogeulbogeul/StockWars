/**
 * FriendManager.js
 * StockWars GDD MOD_GDD_09 Friend System & Social Loop
 * Manages Friend Data, FP (Friendship Points), Envy Notifications, Energy Gifting, Rumor Sharing, and Social/Global Leaderboards.
 */

export class FriendManager {
    constructor({ storage = globalThis.localStorage } = {}) {
        this.storage = storage;
        this.storageKey = 'stockwars.bubble.friends.v1';
        this.friends = [];

        this.restoreFriends();

        this.globalWhales = [
            { id: 'g_1', name: '사이퍼_워렌', avatar: '🏛️', title: '전설의 투자가', creditRating: 'VVIP', netWorth: 980000000, weeklyReturn: 412.5, styleScore: 9900 },
            { id: 'g_2', name: '텐버거_머스크', avatar: '🚀', title: '혁신가', creditRating: 'Diamond', netWorth: 750000000, weeklyReturn: 320.0, styleScore: 8500 },
            { id: 'g_3', name: '여의도_골드만', avatar: '🏦', title: '월가 세력', creditRating: 'Diamond', netWorth: 520000000, weeklyReturn: 195.4, styleScore: 6400 },
            { id: 'g_4', name: '퀀트킹_시몬스', avatar: '🤖', title: '알고리즘 신', creditRating: 'Diamond', netWorth: 340000000, weeklyReturn: 142.1, styleScore: 5200 },
            { id: 'g_5', name: '빅쇼트_버리', avatar: '📉', title: '공매도 대부', creditRating: 'Gold', netWorth: 210000000, weeklyReturn: 88.0, styleScore: 4100 }
        ];

        this.envyNotifications = [];

        this.dailyGiftReceivedCount = 0;
        this.envyNotifications = this.envyNotifications.filter(item => this.friends.some(friend => friend.id === item.friendId));
        try {
            const posts = JSON.parse(this.storage?.getItem('stockwars.bubble.posts.v1') || '[]');
            if (Array.isArray(posts)) this.envyNotifications.unshift(...posts.filter(p => p?.isOwn && typeof p.id === 'string' && typeof p.message === 'string').slice(0, 50));
        } catch {}
        this.maxDailyGifts = 5;
        this.currentDay = 1;
    }

    getFPLevelInfo(fp) {
        if (fp >= 1500) {
            return { level: 4, name: '혈맹 (Blood Alliance)', minFp: 1500, maxFp: 2000, badge: '👑', desc: '찌라시 공유 일 2회 가능' };
        } else if (fp >= 500) {
            return { level: 3, name: '신뢰 (Trust)', minFp: 500, maxFp: 1499, badge: '💎', desc: '특별 칭호 & 추가 소셜 혜택' };
        } else if (fp >= 100) {
            return { level: 2, name: '교류 (Interaction)', minFp: 100, maxFp: 499, badge: '⭐', desc: '찌라시 공유 보너스 확률' };
        } else {
            return { level: 1, name: '면식 (Acquaintance)', minFp: 0, maxFp: 99, badge: '🌱', desc: '에너지 선물 가능' };
        }
    }

    restoreFriends() {
        try {
            const saved = JSON.parse(this.storage?.getItem(this.storageKey) || 'null');
            if (!Array.isArray(saved)) return;
            const seen = new Set(this.friends.map(friend => friend.name));
            for (const friend of saved) {
                if (!friend || typeof friend.id !== 'string' || !friend.id.startsWith('added_') ||
                    typeof friend.name !== 'string' || !friend.name.trim() || friend.name.length > 40 || seen.has(friend.name)) continue;
                this.friends.push({ ...friend, avatar: '👤', title: '추가한 친구', isOnline: false,
                    netWorth: 0, weeklyReturn: 0, styleScore: 0, fp: Number.isFinite(friend.fp) && friend.fp >= 0 ? friend.fp : 0 });
                seen.add(friend.name);
            }
        } catch { /* Storage may be unavailable or contain an invalid older value. */ }
    }

    saveFriends() {
        try { this.storage?.setItem(this.storageKey, JSON.stringify(this.friends.filter(friend => !friend.isTest))); }
        catch { /* Keep the current session usable when storage is unavailable. */ }
    }

    getFriends() {
        return this.friends.map(f => ({
            ...f,
            levelInfo: this.getFPLevelInfo(f.fp)
        }));
    }

    getFriend(id) {
        const friend = this.friends.find(f => f.id === id);
        if (!friend) return null;
        return {
            ...friend,
            levelInfo: this.getFPLevelInfo(friend.fp)
        };
    }

    addFP(friendId, amount) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return 0;
        friend.fp += amount;
        this.saveFriends();
        return friend.fp;
    }

    sendEnergyGift(friendId, currentDay = 1) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return { success: false, message: '존재하지 않는 친구입니다.' };

        if (friend.lastGiftSentDay === currentDay) {
            return { success: false, message: '오늘 이미 이 친구에게 에너지를 선물했습니다.' };
        }

        friend.lastGiftSentDay = currentDay;
        this.addFP(friendId, 10);

        return {
            success: true,
            message: `${friend.name}님에게 에너지를 선물했습니다! (우호도 +10 FP)`,
            fpGained: 10
        };
    }

    shareRumor(friendId, rumorTitle, currentDay = 1) {
        const friend = this.friends.find(f => f.id === friendId);
        if (!friend) return { success: false, message: '존재하지 않는 친구입니다.' };

        const lvlInfo = this.getFPLevelInfo(friend.fp);
        const maxSharePerDay = lvlInfo.level >= 4 ? 2 : 1;

        if (friend.lastRumorSharedDay === currentDay) {
            return { success: false, message: '오늘 이미 이 친구와 찌라시를 공유했습니다.' };
        }

        friend.lastRumorSharedDay = currentDay;
        this.addFP(friendId, 20);

        return {
            success: true,
            message: `${friend.name}님에게 [${rumorTitle}] 찌라시를 공유했습니다! (우호도 +20 FP)`,
            fpGained: 20
        };
    }

    reactToEnvyNotification(envyId, reactionType) {
        const envy = this.envyNotifications.find(e => e.id === envyId);
        if (!envy) return { success: false, message: '알림을 찾을 수 없습니다.' };
        if (envy.isOwn) return { success: false, message: '내 소식에는 반응할 수 없습니다.' };
        if (envy.reacted) return { success: false, message: '이미 반응한 알림입니다.' };

        envy.reacted = true;
        envy.reactionType = reactionType;
        let fpAmount = 0;
        let reactionMsg = '';

        if (reactionType === 'congratulate') { // 🥳
            fpAmount = 5;
            reactionMsg = '🥳 친구의 성공을 축하해주었습니다! (우호도 +5 FP)';
        } else if (reactionType === 'jealous') { // 😒
            fpAmount = 1;
            reactionMsg = '😒 친구의 잭팟을 새침하게 질투했습니다! (우호도 +1 FP)';
        } else { // 😡
            fpAmount = 0;
            reactionMsg = '😡 부러운 마음을 감추지 못하고 분노했습니다!';
        }

        if (fpAmount > 0 && envy.friendId) {
            this.addFP(envy.friendId, fpAmount);
        }

        return {
            success: true,
            message: reactionMsg,
            fpGained: fpAmount
        };
    }

    addFriendByName(name) {
        const trimmed = typeof name === 'string' ? name.trim() : '';
        if (!trimmed) return { success: false, message: '닉네임을 입력해주세요.' };
        if (trimmed.length > 40) return { success: false, message: '닉네임은 40자 이내로 입력해주세요.' };
        if (this.friends.some(f => f.name === trimmed)) {
            return { success: false, message: '이미 친구 목록에 등록되어 있습니다.' };
        }

        const newFriend = {
            id: 'added_' + (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`),
            name: trimmed,
            avatar: '👤',
            title: '추가한 친구',
            creditRating: 'Bronze',
            netWorth: 0,
            weeklyReturn: 0,
            styleScore: 0,
            isOnline: false,
            fp: 0,
            lastGiftSentDay: null,
            lastRumorSharedDay: null
        };

        this.friends.push(newFriend);
        this.saveFriends();
        return { success: true, message: `'${trimmed}'님을 친구로 추가했습니다!` };
    }

    publishAchievement(achievement, name, comment = '') {
        if (!achievement || !Number.isFinite(achievement.profit) || achievement.profit <= 0 || !Number.isFinite(achievement.returnRate)) {
            return { success: false, message: '게시할 수 있는 수익 기록이 없습니다.' };
        }
        const id = `achievement_${achievement.id}`;
        if (this.envyNotifications.some(p => p.id === id)) return { success: false, message: '이미 게시한 성과입니다.' };
        const post = { id, isOwn: true, friendName: name, trigger: '주식 매도 수익 실현', icon: '📈',
            message: `${achievement.stockName} ${achievement.quantity}주 매도로 +${achievement.profit.toLocaleString()}G (+${achievement.returnRate.toFixed(1)}%) 수익을 실현했어요!`,
            comment: String(comment).trim().slice(0, 80), timestamp: new Date().toLocaleString('ko-KR'), achievement: { ...achievement } };
        this.envyNotifications.unshift(post);
        const ownPosts = this.envyNotifications.filter(p => p.isOwn).slice(0, 50);
        try { this.storage?.setItem('stockwars.bubble.posts.v1', JSON.stringify(ownPosts)); } catch {}
        return { success: true, message: '소식에 성과를 게시했습니다.' };
    }

    getLeaderboard(category, scope = 'social', userProfile = {}) {
        const userEntry = {
            id: 'user_me',
            name: userProfile.name || '나 (Player)',
            avatar: '👑',
            title: userProfile.title || '개미 트레이더',
            creditRating: userProfile.creditRating || 'Gold',
            netWorth: userProfile.netWorth || 5000000,
            weeklyReturn: userProfile.weeklyReturn || 18.5,
            styleScore: userProfile.styleScore || 1250,
            isMe: true
        };

        const baseList = scope === 'global' ? [...this.globalWhales, ...this.friends] : [...this.friends];
        const allList = [userEntry, ...baseList];

        if (category === 'asset') {
            allList.sort((a, b) => b.netWorth - a.netWorth);
        } else if (category === 'return') {
            allList.sort((a, b) => b.weeklyReturn - a.weeklyReturn);
        } else if (category === 'style') {
            allList.sort((a, b) => b.styleScore - a.styleScore);
        }

        return allList.map((item, index) => ({
            rank: index + 1,
            ...item
        }));
    }
}

export const friendManager = new FriendManager();
