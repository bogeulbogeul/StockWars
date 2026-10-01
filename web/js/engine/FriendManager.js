/**
 * FriendManager.js
 * StockWars GDD MOD_GDD_09 Friend System & Social Loop
 * Manages Friend Data, FP (Friendship Points), Envy Notifications, Energy Gifting, Rumor Sharing, and Social/Global Leaderboards.
 */

export class FriendManager {
    constructor() {
        this.friends = [
            {
                id: 'friend_1',
                name: '골든차트_김팀장',
                avatar: '👔',
                title: '단타의 귀재',
                creditRating: 'Diamond',
                netWorth: 125000000,
                weeklyReturn: 28.4,
                styleScore: 1850,
                isOnline: true,
                fp: 120,
                lastGiftSentDay: null,
                lastRumorSharedDay: null
            },
            {
                id: 'friend_2',
                name: '배당부자_이매니저',
                avatar: '💼',
                title: '존버 연합장',
                creditRating: 'Gold',
                netWorth: 85400000,
                weeklyReturn: 12.1,
                styleScore: 2400,
                isOnline: true,
                fp: 520,
                lastGiftSentDay: null,
                lastRumorSharedDay: null
            },
            {
                id: 'friend_3',
                name: '잭팟헌터_최프로',
                avatar: '🎲',
                title: '불나방',
                creditRating: 'Silver',
                netWorth: 42100000,
                weeklyReturn: 45.8,
                styleScore: 980,
                isOnline: false,
                fp: 45,
                lastGiftSentDay: null,
                lastRumorSharedDay: null
            },
            {
                id: 'friend_4',
                name: '퀀트학자_박박사',
                avatar: '📊',
                title: '차트 도사',
                creditRating: 'Gold',
                netWorth: 67800000,
                weeklyReturn: 8.5,
                styleScore: 1320,
                isOnline: true,
                fp: 1550,
                lastGiftSentDay: null,
                lastRumorSharedDay: null
            },
            {
                id: 'friend_5',
                name: '스타일퀸_클레어',
                avatar: '👠',
                title: '패셔니스타',
                creditRating: 'Diamond',
                netWorth: 110000000,
                weeklyReturn: -3.2,
                styleScore: 3500,
                isOnline: false,
                fp: 300,
                lastGiftSentDay: null,
                lastRumorSharedDay: null
            }
        ];

        this.globalWhales = [
            { id: 'g_1', name: '사이퍼_워렌', avatar: '🏛️', title: '전설의 투자가', creditRating: 'VVIP', netWorth: 980000000, weeklyReturn: 412.5, styleScore: 9900 },
            { id: 'g_2', name: '텐버거_머스크', avatar: '🚀', title: '혁신가', creditRating: 'Diamond', netWorth: 750000000, weeklyReturn: 320.0, styleScore: 8500 },
            { id: 'g_3', name: '여의도_골드만', avatar: '🏦', title: '월가 세력', creditRating: 'Diamond', netWorth: 520000000, weeklyReturn: 195.4, styleScore: 6400 },
            { id: 'g_4', name: '퀀트킹_시몬스', avatar: '🤖', title: '알고리즘 신', creditRating: 'Diamond', netWorth: 340000000, weeklyReturn: 142.1, styleScore: 5200 },
            { id: 'g_5', name: '빅쇼트_버리', avatar: '📉', title: '공매도 대부', creditRating: 'Gold', netWorth: 210000000, weeklyReturn: 88.0, styleScore: 4100 }
        ];

        this.envyNotifications = [
            {
                id: 'envy_1',
                friendId: 'friend_1',
                friendName: '골든차트_김팀장',
                trigger: '주식 상한가 적중',
                message: '친구 골든차트_김팀장님이 [삼성전자]로 +15.0% 상한가 수익을 거두었습니다!',
                icon: '📈',
                reacted: false,
                timestamp: '방금 전'
            },
            {
                id: 'envy_2',
                friendId: 'friend_3',
                friendName: '잭팟헌터_최프로',
                trigger: '도박장 잭팟',
                message: '친구 잭팟헌터_최프로님이 블랙잭 5연승 잭팟을 달성했습니다!',
                icon: '🎰',
                reacted: false,
                timestamp: '10분 전'
            },
            {
                id: 'envy_3',
                friendId: 'friend_5',
                friendName: '스타일퀸_클레어',
                trigger: '명품 의상 획득',
                message: '친구 스타일퀸_클레어님이 [골든 엠파이어] 명품 의상을 풀세트로 모았습니다!',
                icon: '✨',
                reacted: false,
                timestamp: '1시간 전'
            }
        ];

        this.dailyGiftReceivedCount = 0;
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
        if (envy.reacted) return { success: false, message: '이미 반응한 알림입니다.' };

        envy.reacted = true;
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
        const trimmed = name.trim();
        if (!trimmed) return { success: false, message: '닉네임을 입력해주세요.' };
        if (this.friends.some(f => f.name === trimmed)) {
            return { success: false, message: '이미 친구 목록에 등록되어 있습니다.' };
        }

        const newFriend = {
            id: 'friend_' + Date.now(),
            name: trimmed,
            avatar: '👤',
            title: '신규 트레이더',
            creditRating: 'Bronze',
            netWorth: Math.floor(Math.random() * 30000000) + 5000000,
            weeklyReturn: Number((Math.random() * 30 - 10).toFixed(1)),
            styleScore: Math.floor(Math.random() * 500) + 100,
            isOnline: true,
            fp: 0,
            lastGiftSentDay: null,
            lastRumorSharedDay: null
        };

        this.friends.push(newFriend);
        return { success: true, message: `'${trimmed}'님을 친구로 추가했습니다!` };
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
