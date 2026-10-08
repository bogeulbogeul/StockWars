import test from 'node:test';
import assert from 'node:assert/strict';
import { FriendManager, friendManager } from '../js/engine/FriendManager.js';
import { RankingModal } from '../js/components/RankingModal.js';

test('leaderboard removes fabricated entries, ranks actual zero balances and filters social users', () => {
    const manager=new FriendManager({storage:null});
    assert.deepEqual(manager.getLeaderboard('asset','global'),[]);
    manager.leaderboardRecords=[{name:'실제 친구',netWorth:200,isFriend:true},{name:'다른 유저',netWorth:300},{name:'나',netWorth:100,weeklyReturn:0,isMe:true}];
    const profile={name:'나',netWorth:0,weeklyReturn:null};
    assert.deepEqual(manager.getLeaderboard('asset','global',profile).map(r=>r.netWorth),[300,200,0]);
    assert.equal(manager.getLeaderboard('asset','social',profile).length,2);
    assert.equal(manager.getLeaderboard('return','global',profile)[0].weeklyReturn,0);
    assert.deepEqual(manager.getLeaderboard('style','global',profile),[]);
    assert.equal(manager.getLeaderboard('asset','global',profile).filter(r=>r.name==='나').length,1);
});

test('ranking escapes real user names and renders missing records instead of dummy scores', () => {
    const before=friendManager.leaderboardRecords;
    try {
        friendManager.leaderboardRecords=[{name:'<img src=x>',title:'<script>',netWorth:1234}];
        const modal={callbacks:{getProfile:()=>({})},rankingCategory:'asset',rankingScope:'global',rankingTableContainer:{}};
        RankingModal.prototype.renderRanking.call(modal);
        assert.match(modal.rankingTableContainer.innerHTML,/&lt;img src=x&gt;/);
        assert.match(modal.rankingTableContainer.innerHTML,/1,234 G/);
        modal.rankingCategory='return';
        RankingModal.prototype.renderRanking.call(modal);
        assert.match(modal.rankingTableContainer.innerHTML,/7일 수익률 기록이 아직 없습니다/);
        assert.doesNotMatch(modal.rankingTableContainer.innerHTML,/1250|9900/);
    } finally { friendManager.leaderboardRecords=before; }
});
