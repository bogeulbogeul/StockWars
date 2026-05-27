using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 액면분할 정책 체크 및 실행 엔진.
    /// 주가가 1,000,000 Gold에 달성할 때 즉시 1:10 액면분할을 실행하며, 
    /// 1시간 거래 정지 및 히스토리/포트폴리오 보정 프로토콜을 가동합니다. (최대 3회 제한)
    /// </summary>
    public class SplitChecker : Singleton<SplitChecker>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 실시간 주가 갱신 이벤트 구독
            EventBus.Subscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
        }

        /// <summary>
        /// 주가가 업데이트될 때마다 액면분할 조건 충족 여부를 상시 감시합니다.
        /// </summary>
        private void OnStockPriceUpdated(StockPriceUpdatedEvent e)
        {
            var stock = MarketManager.Instance.GetStock(e.StockId);
            if (stock == null || !stock.IsListed) return;

            // 황제주 분할 조건 판정: 1,000,000G 도달 및 종목당 최대 3회 분할 한도 체크
            if (stock.CurrentPrice >= 1000000 && stock.SplitCount < 3)
            {
                ExecuteStockSplit(stock);
            }
        }

        /// <summary>
        /// 1:10 액면분할 트랜잭션을 원자적으로 실행하고 관련 데이터를 소급 보정합니다.
        /// </summary>
        private void ExecuteStockSplit(StockInstance stock)
        {
            long oldPrice = stock.CurrentPrice;
            stock.SplitCount++; // 누적 분할 횟수 증가

            Debug.LogWarning($"[SplitChecker] ===== 액면분할 트리거 발동: {stock.StockId} (현재가: {oldPrice}G, 누적 {stock.SplitCount}회차) =====");

            // ── 1. 실시간 1시간 거래 정지(Trading Halt) 적용 ─────────────────────────
            // 타임존 및 시간 조작에 대항하기 위해 절대시간 UTC 기준 1시간 만료 처리
            DateTime haltEndTime = DateTime.UtcNow.AddHours(1);
            stock.TradingHaltEndTimeUtc = haltEndTime;

            // ── 2. 주식 현재 수치 보정 (1/10 감량 및 10배 증량) ─────────────────────
            stock.CurrentPrice = Math.Max(1L, stock.CurrentPrice / 10);
            stock.PeakPrice = Math.Max(1L, stock.PeakPrice / 10);
            stock.DailyHigh = Math.Max(1L, stock.DailyHigh / 10);
            stock.DailyLow = Math.Max(1L, stock.DailyLow / 10);
            
            // 유통 주식 수는 10배로 증량
            stock.AvailableVolume = Math.Clamp(stock.AvailableVolume * 10, 0, long.MaxValue);

            // ── 3. 최근 168시간(168틱) 가격 히스토리 1/10 소급 보정 ─────────────────
            // 가격 히스토리를 보정하지 않으면 차트에 절벽(수직 낙하) 모양의 왜곡 현상이 나타납니다.
            var tempHistory = new List<long>();
            foreach (var histPrice in stock.PriceHistory)
            {
                tempHistory.Add(Math.Max(1L, histPrice / 10));
            }
            stock.PriceHistory.Clear();
            stock.PriceHistory.AddRange(tempHistory);

            // ── 4. 플레이어 보유 포트폴리오 및 매수이력(HODL) 10배 보정 ─────────────
            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData != null && saveData.Portfolio != null)
            {
                if (saveData.Portfolio.TryGetValue(stock.StockId, out var holding))
                {
                    long oldQty = holding.Quantity;
                    double oldAvg = holding.AveragePurchasePrice;

                    // 보유 수량은 10배 증가, 평균 매수 단가는 1/10로 감량
                    holding.Quantity *= 10;
                    holding.AveragePurchasePrice /= 10.0;

                    // 개별 보유 이력(PurchaseChunks) 수량 및 평단도 동일하게 1:10 소급 보정
                    if (holding.PurchaseChunks != null)
                    {
                        foreach (var chunk in holding.PurchaseChunks)
                        {
                            chunk.Quantity *= 10;
                            chunk.PurchasePrice /= 10.0;
                        }
                    }

                    Debug.Log($"[SplitChecker] 플레이어 포트폴리오 보정 완료: {stock.StockId} {oldQty}주(평단 {oldAvg:F1}G) -> {holding.Quantity}주(평단 {holding.AveragePurchasePrice:F1}G)");
                }
            }

            Debug.LogWarning($"[SplitChecker] ===== 액면분할 프로세스 완료: {stock.StockId} 새 주가: {stock.CurrentPrice}G, 거래 정지 만료={haltEndTime:yyyy-MM-dd HH:mm:ss} UTC =====");

            // ── 5. 액면분할 발생 전역 이벤트 통지 발행 ────────────────────────────────
            EventBus.Publish(new StockSplitEvent
            {
                StockId = stock.StockId,
                NewSplitCount = stock.SplitCount,
                OldPrice = oldPrice,
                NewPrice = stock.CurrentPrice,
                HaltEndTimeUtc = haltEndTime
            });
        }
    }

    #region Stock Split Events (액면분할 전역 이벤트 구조체)

    /// <summary>
    /// 특정 종목의 1:10 액면분할이 완수되었을 때 발행되는 이벤트.
    /// UI 티커 알림, 뉴스 전광판, 오더 창 비활성화 인터페이스 등에서 구독합니다.
    /// </summary>
    public struct StockSplitEvent
    {
        /// <summary>분할된 주식 종목 ID</summary>
        public string StockId;

        /// <summary>액면분할 후 최종 누적 횟수 (1 ~ 3)</summary>
        public int NewSplitCount;

        /// <summary>분할 직전 가격 (Gold)</summary>
        public long OldPrice;

        /// <summary>분할 직후 가격 (Gold)</summary>
        public long NewPrice;

        /// <summary>거래정지 해제 시간 (UTC)</summary>
        public DateTime HaltEndTimeUtc;
    }

    #endregion
}
