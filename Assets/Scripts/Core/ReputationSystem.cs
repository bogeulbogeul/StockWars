using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_03 명성 및 사회적 평판 시스템.
    /// 플레이어의 자산 규모 돌파, 고액 트레이딩 성과, 알바 완료 및 위탁자산 성과에 따라 명성(Renown) 포인트를 누적합니다.
    /// 명성 포인트 및 자산 조건 충족 시 F등급에서 S등급까지의 4단계 사회적 지위 스테이지를 동적으로 상승시키고 전역 이벤트를 송출합니다.
    /// </summary>
    public class ReputationSystem : Singleton<ReputationSystem>
    {
        // 24시간 내 고액 매수 중복 보상 지급을 제한하기 위한 동일 종목 타임스탬프 캐시 (Transient)
        private readonly Dictionary<string, DateTime> _lastHighValueTradeRewardTimes = new Dictionary<string, DateTime>();

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 리액티브 이벤트를 구독하여 명성 포인트 자동 감지
            EventBus.Subscribe<NetWorthUpdatedEvent>(OnNetWorthUpdated);
            EventBus.Subscribe<StockTransactionEvent>(OnStockTransaction);
            EventBus.Subscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<NetWorthUpdatedEvent>(OnNetWorthUpdated);
            EventBus.Unsubscribe<StockTransactionEvent>(OnStockTransaction);
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
        }

        #region Core Status Getters (명성 및 평판 상태 반환)

        /// <summary>현재 누적된 총 명성 포인트 조회</summary>
        public long GetRenownPoints()
        {
            if (WalletManager.Instance == null) return 0;
            return WalletManager.Instance.ActiveSaveData.RenownPoints;
        }

        /// <summary>현재 사회적 평판 등급 (F ~ S) 조회</summary>
        public ReputationGrade GetReputationGrade()
        {
            if (WalletManager.Instance == null) return ReputationGrade.F;
            return WalletManager.Instance.ActiveSaveData.Reputation;
        }

        #endregion

        #region Renown Increment & Grade Progression (명성 포인트 추가 및 등급 업데이트)

        /// <summary>
        /// 명성 포인트를 안전하게 가산하고 등급 승급 조건 도달 여부를 확인합니다.
        /// </summary>
        /// <param name="amount">추가할 명성 포인트 수치</param>
        /// <param name="sourceReason">명성 획득 원천 (디버깅/로그 목적)</param>
        public void AddRenownPoints(long amount, string sourceReason)
        {
            if (WalletManager.Instance == null) return;
            if (amount <= 0) return;

            var saveData = WalletManager.Instance.ActiveSaveData;
            long previousRenown = saveData.RenownPoints;
            saveData.RenownPoints = Math.Clamp(saveData.RenownPoints + amount, 0L, long.MaxValue);

            Debug.Log($"[ReputationSystem] 명성 획득 (+{amount} pt, 사유: '{sourceReason}'): 이전={previousRenown} pt -> 현재={saveData.RenownPoints} pt");

            // 명성 포인트 변동 전역 이벤트 발행
            EventBus.Publish(new RenownPointsChangedEvent
            {
                PreviousRenown = previousRenown,
                NewRenown = saveData.RenownPoints,
                Delta = amount,
                Source = sourceReason
            });

            // 등급 갱신 판정 가동
            UpdateReputationGrade();
        }

        /// <summary>
        /// GDD 4.2 명성 등급 체계에 따라 플레이어 등급을 갱신하고 승격 시 이벤트를 송출합니다.
        /// </summary>
        public void UpdateReputationGrade()
        {
            if (WalletManager.Instance == null) return;
            var saveData = WalletManager.Instance.ActiveSaveData;

            ReputationGrade currentGrade = saveData.Reputation;
            ReputationGrade newGrade = ReputationGrade.F;

            // ── Stage 1 (Apprentice): 레벨 20 달성 시 기본 해금 ───────────────────────
            if (saveData.PlayerLevel >= 20)
            {
                newGrade = ReputationGrade.E;

                long renown = saveData.RenownPoints;
                // 실시간 총 자산 (현금 + 포트폴리오 가치 등)
                long netWorth = NetWorthCore.Instance != null ? NetWorthCore.Instance.GetNetWorth() : saveData.Gold;

                // ── Stage 2 (Whale): 자산 1M G + 명성 1,000점 ──────────────────────
                if (renown >= 1000 && netWorth >= 1000000L)
                {
                    newGrade = ReputationGrade.D;
                }

                // ── Stage 3 (Market Mover): 명성 5,000점 이상 ──────────────────────
                if (renown >= 5000)
                {
                    newGrade = ReputationGrade.C;
                }

                // ── Stage 4 (Legendary Maker): 명성 20,000점 이상 ──────────────────
                if (renown >= 20000)
                {
                    newGrade = ReputationGrade.B;
                }

                // ── [확장 트랙] (Grand Master & Emperor): 명성 5만, 10만점 돌파 ──────
                if (renown >= 50000)
                {
                    newGrade = ReputationGrade.A;
                }
                if (renown >= 100000)
                {
                    newGrade = ReputationGrade.S;
                }
            }

            // 실질적 승격/강등 시점 처리
            if (newGrade != currentGrade)
            {
                saveData.Reputation = newGrade;
                Debug.LogWarning($"[ReputationSystem] 평판 등급 변동 발생! {currentGrade} -> {newGrade} (레벨: {saveData.PlayerLevel}, 명성: {saveData.RenownPoints:N0}pt)");

                EventBus.Publish(new ReputationGradeChangedEvent
                {
                    PreviousGrade = currentGrade,
                    NewGrade = newGrade,
                    TotalRenown = saveData.RenownPoints
                });
            }
        }

        #endregion

        #region Event Handlers (리액티브 수신 및 판정 가동)

        /// <summary>
        /// 순자산(Net Worth) 변동 감지 시, 자산 최초 돌파 임계값(1M, 10M, 100M) 보너스 명성을 일시 지급합니다. (1회 제한)
        /// </summary>
        private void OnNetWorthUpdated(NetWorthUpdatedEvent evt)
        {
            if (WalletManager.Instance == null) return;
            var saveData = WalletManager.Instance.ActiveSaveData;

            long netWorth = evt.NetWorth;

            // ── 1. 1M (백만) 돌파 보너스 명성 (+500 pt) ──────────────────────
            if (netWorth >= 1000000L && !saveData.UnlockedBreakthroughs.Contains("1M"))
            {
                saveData.UnlockedBreakthroughs.Add("1M");
                AddRenownPoints(500, "1M Asset Milestone Breakthrough");
            }

            // ── 2. 10M (천만) 돌파 보너스 명성 (+2,000 pt) ────────────────────
            if (netWorth >= 10000000L && !saveData.UnlockedBreakthroughs.Contains("10M"))
            {
                saveData.UnlockedBreakthroughs.Add("10M");
                AddRenownPoints(2000, "10M Asset Milestone Breakthrough");
            }

            // ── 3. 100M (1억) 돌파 보너스 명성 (+5,000 pt) ─────────────────────
            if (netWorth >= 100000000L && !saveData.UnlockedBreakthroughs.Contains("100M"))
            {
                saveData.UnlockedBreakthroughs.Add("100M");
                AddRenownPoints(5000, "100M Asset Milestone Breakthrough");
            }

            // 자산 변동은 Whale 승급 트리거 조건(Whale: 자산 1M G + 명성 1k)이므로 등급 조건도 소급 검사
            UpdateReputationGrade();
        }

        /// <summary>
        /// 트레이딩 완료 시, 단일 거래 1,000,000G 이상의 고액 투입 여부를 감지해 +50 pt 명성을 지급합니다. (동일종목 24시간 쿨타임)
        /// </summary>
        private void OnStockTransaction(StockTransactionEvent evt)
        {
            // 매수 거래에서 100만G 이상의 규모인 경우에만 명성을 지급
            if (evt.IsBuy && evt.TotalAmount >= 1000000L)
            {
                DateTime now = DateTime.UtcNow;

                if (_lastHighValueTradeRewardTimes.TryGetValue(evt.StockId, out DateTime lastRewardTime))
                {
                    // 24시간 쿨타임 검사
                    if ((now - lastRewardTime).TotalHours < 24.0)
                    {
                        Debug.Log($"[ReputationSystem] 고액 트레이딩 명성 스킵: {evt.StockId} (24시간 보상 쿨타임 대기 중)");
                        return;
                    }
                }

                // 타임스탬프 갱신 및 보상 지급
                _lastHighValueTradeRewardTimes[evt.StockId] = now;
                AddRenownPoints(50, $"High-Value Trading Milestone ({evt.StockId}, Amount: {evt.TotalAmount:N0}G)");
            }
        }

        /// <summary>
        /// 플레이어 레벨 상승 시, Stage 1 (Apprentice, LV 20) 도달을 체크하기 위해 등급 갱신 연산을 동기화합니다.
        /// </summary>
        private void OnPlayerLevelUp(PlayerLevelUpEvent evt)
        {
            UpdateReputationGrade();
        }

        #endregion

        #region External Renown Distribution APIs (기타 보상 경로 전용 인터페이스)

        /// <summary>
        /// GDD 4.1: 아레나 대결 경쟁 승리 시 명성을 지급받기 위한 통로 인터페이스입니다.
        /// </summary>
        /// <param name="isHighStakes">로우 스테이크(+100 pt) / 하이 스테이크(+300 pt)</param>
        public void AwardRenownFromArena(bool isHighStakes)
        {
            long points = isHighStakes ? 300L : 100L;
            AddRenownPoints(points, $"Arena Competitor Victory (HighStakes={isHighStakes})");
        }

        /// <summary>
        /// GDD 4.1: 기관 위탁 자산의 운용 수익 보상 명성을 지급합니다. (주간 순수익 1%당 +10 pt)
        /// </summary>
        /// <param name="netProfitPercent">달성한 순수익 백분율 수치 (예: 5.5% 순수익 = 5.5)</param>
        public void AwardRenownFromWeeklySettlement(double netProfitPercent)
        {
            if (netProfitPercent <= 0.0) return;
            // 1% 당 10 pt
            long points = (long)Math.Floor(netProfitPercent * 10);
            if (points > 0)
            {
                AddRenownPoints(points, $"Weekly Portfolio Management Performance (Profit={netProfitPercent:F2}%)");
            }
        }

        #endregion
    }

    #region Reputation Events (명성 및 평판 전역 이벤트 구조체)

    /// <summary>
    /// 플레이어의 명성 포인트 수치 변동 시 발행됩니다. (UI 게이지 채우기용)
    /// </summary>
    public struct RenownPointsChangedEvent
    {
        public long PreviousRenown;
        public long NewRenown;
        public long Delta;
        public string Source;
    }

    /// <summary>
    /// 플레이어의 사회적 평판 등급이 승격/강등 시 발행됩니다. (Stage 개방 엠블럼 해금 및 특권 적용용)
    /// </summary>
    public struct ReputationGradeChangedEvent
    {
        public ReputationGrade PreviousGrade;
        public ReputationGrade NewGrade;
        public long TotalRenown;
    }

    #endregion
}
