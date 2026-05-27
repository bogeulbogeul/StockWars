using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_03 플레이어 실시간 순자산(Net Worth) 계산 코어 엔진.
    /// 플레이어의 가용 현금(Gold), 보유 중인 포트폴리오 평가액, 정산 대기 중인 미지급 배당금 등을
    /// 실시간 합산하여 현재 순자산을 계산하고, 금융적 변동 이벤트 발생 시 리액티브하게
    /// 전역 순자산 갱신 이벤트(NetWorthUpdatedEvent)를 발행합니다.
    /// </summary>
    public class NetWorthCore : Singleton<NetWorthCore>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 순자산 변동에 영향을 주는 모든 코어 이벤트 구독
            EventBus.Subscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Subscribe<DividendsChangedEvent>(OnDividendsChanged);
            EventBus.Subscribe<DividendsClaimedEvent>(OnDividendsClaimed);
            EventBus.Subscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
            EventBus.Subscribe<StockSplitEvent>(OnStockSplit);
            EventBus.Subscribe<StockDelistedEvent>(OnStockDelisted);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Unsubscribe<DividendsChangedEvent>(OnDividendsChanged);
            EventBus.Unsubscribe<DividendsClaimedEvent>(OnDividendsClaimed);
            EventBus.Unsubscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
            EventBus.Unsubscribe<StockSplitEvent>(OnStockSplit);
            EventBus.Unsubscribe<StockDelistedEvent>(OnStockDelisted);
        }

        #region Event Handlers (리액티브 트리거)

        private void OnCashChanged(CashChangedEvent e) => RecalculateAndPublish();
        private void OnDividendsChanged(DividendsChangedEvent e) => RecalculateAndPublish();
        private void OnDividendsClaimed(DividendsClaimedEvent e) => RecalculateAndPublish();
        private void OnStockPriceUpdated(StockPriceUpdatedEvent e) => RecalculateAndPublish();
        private void OnStockSplit(StockSplitEvent e) => RecalculateAndPublish();
        private void OnStockDelisted(StockDelistedEvent e) => RecalculateAndPublish();

        #endregion

        #region Core Calculation APIs (순자산 산출 연산부)

        /// <summary>
        /// 플레이어의 실시간 총 순자산(Net Worth)을 계산하여 반환합니다.
        /// 공식: 가용 현금 + 포트폴리오 가치 + 미지급 배당금 + 기타 금융 자산 (이자 등)
        /// </summary>
        public long GetNetWorth()
        {
            long cash = GetCash();
            long portfolioValue = GetPortfolioValue();
            long dividends = GetAccumulatedDividends();
            long interest = GetAccumulatedInterest(); // 긍정 자산 성향의 누적이자 포함

            // 오버플로우 안전 클램핑 적용 합산
            long sum = 0;
            sum = Math.Clamp(sum + cash, 0L, long.MaxValue);
            sum = Math.Clamp(sum + portfolioValue, 0L, long.MaxValue);
            sum = Math.Clamp(sum + dividends, 0L, long.MaxValue);
            sum = Math.Clamp(sum + interest, 0L, long.MaxValue);

            return sum;
        }

        /// <summary>
        /// 플레이어가 현재 보유 중인 모든 상장 주식의 시장 평가 가치(Portfolio Value)를 실시간 계산합니다.
        /// </summary>
        public long GetPortfolioValue()
        {
            if (WalletManager.Instance == null || MarketManager.Instance == null) return 0;

            var wallet = WalletManager.Instance;
            var market = MarketManager.Instance;

            var saveData = wallet.ActiveSaveData;
            if (saveData == null || saveData.Portfolio == null) return 0;

            long totalValue = 0;

            foreach (var kvp in saveData.Portfolio)
            {
                var holding = kvp.Value;
                if (holding.Quantity <= 0) continue;

                var stock = market.GetStock(holding.StockId);
                // 시장에 상장(IsListed = true)되어 실시간 거래가 가능한 주식만 가치 합산에 반영
                if (stock != null && stock.IsListed)
                {
                    long stockValue = holding.Quantity * stock.CurrentPrice;
                    totalValue = Math.Clamp(totalValue + stockValue, 0L, long.MaxValue);
                }
            }

            return totalValue;
        }

        /// <summary>
        /// 지갑 매니저로부터 플레이어의 가용 현금 잔고를 안전하게 조회합니다.
        /// </summary>
        public long GetCash()
        {
            return WalletManager.Instance != null ? WalletManager.Instance.GetCash() : 0;
        }

        /// <summary>
        /// 지갑 매니저로부터 플레이어의 누적 미지급 배당금을 안전하게 조회합니다.
        /// </summary>
        public long GetAccumulatedDividends()
        {
            return WalletManager.Instance != null ? WalletManager.Instance.GetAccumulatedDividends() : 0;
        }

        /// <summary>
        /// 지갑 매니저로부터 플레이어의 누적 이자 잔고를 안전하게 조회합니다.
        /// </summary>
        public long GetAccumulatedInterest()
        {
            return WalletManager.Instance != null ? WalletManager.Instance.GetAccumulatedInterest() : 0;
        }

        /// <summary>
        /// 금융 수치가 바뀔 때마다 순자산을 소급 합산하여 UI 및 상위 모듈용 전역 이벤트를 송출합니다.
        /// </summary>
        public void RecalculateAndPublish()
        {
            long cash = GetCash();
            long portfolioValue = GetPortfolioValue();
            long dividends = GetAccumulatedDividends();
            long interest = GetAccumulatedInterest();
            long totalNetWorth = GetNetWorth();

            EventBus.Publish(new NetWorthUpdatedEvent
            {
                NetWorth = totalNetWorth,
                Cash = cash,
                PortfolioValue = portfolioValue,
                AccumulatedDividends = dividends,
                AccumulatedInterest = interest
            });
        }

        #endregion
    }

    #region Net Worth Events (순자산 전역 이벤트 구조체)

    /// <summary>
    /// 플레이어의 실시간 순자산 수치나 세부 금융 정보가 변동되었을 때 발행되는 이벤트.
    /// 상단 HUD 자산 표시 창, 랭킹 스코어 패널, 파산 조건 검사 모듈 등에서 즉각 수신합니다.
    /// </summary>
    public struct NetWorthUpdatedEvent
    {
        /// <summary>최종 합산된 실시간 총 순자산 (Gold)</summary>
        public long NetWorth;

        /// <summary>플레이어 소유 가용 현금 잔고 (Gold)</summary>
        public long Cash;

        /// <summary>보유 포트폴리오 실시간 평가 가치 (Gold)</summary>
        public long PortfolioValue;

        /// <summary>정산 대기 중인 누적 미지급 배당금 (Gold)</summary>
        public long AccumulatedDividends;

        /// <summary>지갑 내 누적 이자액 (Gold)</summary>
        public long AccumulatedInterest;
    }

    #endregion
}
