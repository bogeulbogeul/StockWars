using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_07: 고스트 트레이더(GhostTrader)가 백그라운드 거래를 통해 남긴 가상 차익을 정기적으로 수거 및 소각하는 거시 경제 소각 엔진 (Ghost Sink Engine).
    /// <para>
    /// 매 틱마다 발생하는 고스트 트레이더의 거래 이벤트를 구독하여 주간 가상 누적 원장 잔고를 연산하고,
    /// 매주 월요일 00:00 UTC 정산 시점에 누적된 가상 수익을 시스템 Void로 완전 소각(Sink) 처리하여 화폐 인플레이션을 억제합니다.
    /// </para>
    /// </summary>
    public class GhostSinkEngine : Singleton<GhostSinkEngine>
    {
        // 고스트 트레이더의 위장 주문 접속 창구 목록 (동일 클래스 판별용 필터)
        private static readonly HashSet<string> GhostBrokerages = new HashSet<string>
        {
            "사이퍼 증권 영업점",
            "개인 모바일 단말기",
            "외부 전용 터미널"
        };

        // --------------------------------------------------------
        // 1. 이벤트 구독 및 초기화
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            
            // 거래 체결 이벤트 및 주간 정산 이벤트 구독
            EventBus.Subscribe<MarketTransactionEvent>(OnMarketTransactionProcessed);
            EventBus.Subscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<MarketTransactionEvent>(OnMarketTransactionProcessed);
            EventBus.Unsubscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        // --------------------------------------------------------
        // 2. 고스트 트레이더 매매 실시간 원장 기록
        // --------------------------------------------------------

        private void OnMarketTransactionProcessed(MarketTransactionEvent e)
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return;
            }

            // 고스트 트레이더의 거래원 위장 이름이 일치하는지 필터링 (유저 거래와 명확히 격리)
            if (!GhostBrokerages.Contains(e.Brokerage))
            {
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            // ── 가상 장부식 수급 연산 ──
            // 봇의 매도 (IsBuy가 false): 시장에 유량을 푸는 대신 돈을 회수하므로 가상 입고 (+)
            // 봇의 매수 (IsBuy가 true): 시장에서 유량을 빨아들이는 대신 돈을 지불하므로 가상 출고 (-)
            long cashFlow = e.Price * e.Quantity;
            
            if (e.IsBuy)
            {
                saveData.GhostTraderVirtualLedger -= cashFlow;
            }
            else
            {
                saveData.GhostTraderVirtualLedger += cashFlow;
            }
        }

        // --------------------------------------------------------
        // 3. 주간 소각 처리 (Weekly Sink & Reset)
        // --------------------------------------------------------

        private void OnWeeklySettlementProcessed(WeeklySettlementEvent e)
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            long previousLedger = saveData.GhostTraderVirtualLedger;

            // 기획 사양: 고스트 트레이더가 벌어들인 양수(+) 차익을 시스템 Void로 환수하여 소각합니다.
            // 음수(-)일 경우는 봇이 유동성을 공급하다가 떠안은 가상 평가손실이므로 0으로 장부를 클린 리셋합니다.
            long burnedProfit = Math.Max(0L, previousLedger);

            Debug.Log($"[GhostSinkEngine] 주간 고스트 소각 주기 작동. 이전 누적 잔고: {previousLedger:N0}G, 회수 및 소각액: {burnedProfit:N0}G");

            // 가상 원장을 깨끗하게 0으로 리셋
            saveData.GhostTraderVirtualLedger = 0;

            // ── 소각 결과 전역 이벤트 알림 송출 (거시지표 UI 뷰 연동) ──
            EventBus.Publish(new GhostSinkProcessedEvent
            {
                BurnedProfitAmount = burnedProfit,
                PreviousLedgerBalance = previousLedger,
                SettlementTime = e.SettlementTime
            });

            // ── 무결성 섀도 재계산 및 즉각 디스크 세이브 ──
            if (DataIntegrity.Instance != null)
            {
                DataIntegrity.Instance.SyncShadows();
            }

            if (AutoSaveRouter.Instance != null)
            {
                AutoSaveRouter.Instance.TriggerInstantSave();
            }

            Debug.Log($"[GhostSinkEngine] 고스트 트레이더 주간 원장 리셋 및 세이브 디스크 영속 완료.");
        }
    }

    // --------------------------------------------------------
    // 4. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 고스트 트레이더의 주간 가상 누적 이윤 소각 및 원장 초기화가 완료되었을 때 발행되는 알림 이벤트 (거시 경제 통계 연동용)
    /// </summary>
    public struct GhostSinkProcessedEvent
    {
        /// <summary>시스템 Void로 흡수 및 영구 소각된 주간 고스트 이윤액 (Gold)</summary>
        public long BurnedProfitAmount;

        /// <summary>소각 직전의 누적 가상 원장 잔고 (Gold, 음수일 수 있음)</summary>
        public long PreviousLedgerBalance;

        /// <summary>소각 처리가 집행 완료된 정산 기준 UTC 시각</summary>
        public DateTime SettlementTime;
    }
}
