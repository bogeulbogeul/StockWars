using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 상장폐지 감시 및 정리매매 처리 엔진.
    /// 주가가 상장가의 1% 미만으로 떨어지는 즉시 경고를 발생시키며,
    /// 72시간 연속으로 이 상태가 유지되면 1시간 동안의 정리매매(Liquidation Period, 상장가 10% 가격 고정, 신규 매수 금지)를 선포하고,
    /// 정리매매 만료 시 최종 상장폐지 집행 및 플레이어의 보유 주식을 영구 소멸시킵니다.
    /// </summary>
    public class DelistingMonitor : Singleton<DelistingMonitor>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 실시간 게임 1초 틱 이벤트 구독
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        /// <summary>
        /// 매 게임 틱마다 상장된 전 종목의 상태 및 경고 타이머를 실시간 추적 연산합니다.
        /// </summary>
        private void OnGameTick(GameTickEvent e)
        {
            if (MarketManager.Instance == null) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            DateTime now = DateTime.UtcNow;

            foreach (var stock in listedStocks)
            {
                // ── 1. 정리매매(Liquidation Period)가 활성화된 종목 처리 ───────────
                if (stock.IsLiquidationPeriod)
                {
                    if (stock.LiquidationEndTimeUtc.HasValue && now >= stock.LiquidationEndTimeUtc.Value)
                    {
                        // 정리매매 기한 만료 -> 최종 상장폐지 강제 집행
                        ExecuteFinalDelisting(stock);
                    }
                    continue; // 정리매매 진행 중인 경우 하위 일반 모니터링 생략
                }

                // ── 2. 일반 상장 종목의 1% 선 하락 장기 체납 감시 ──────────────────
                long threshold = (long)Math.Max(1.0, stock.Data.listingPrice * 0.01);
                
                if (stock.CurrentPrice < threshold)
                {
                    if (!stock.BelowOnePercentStartTimeUtc.HasValue)
                    {
                        // 1% 선 최초 이탈 발생 -> 경보 시작 시각 바인딩 및 경고 이벤트 전역 발행
                        stock.BelowOnePercentStartTimeUtc = now;
                        Debug.LogWarning($"[DelistingMonitor] 🚨 경보: {stock.StockId} 주가가 상장가의 1% 선({threshold}G) 미만으로 하락했습니다. (현재가: {stock.CurrentPrice}G, 상폐 카운트다운 시작)");

                        EventBus.Publish(new StockDelistingWarningEvent
                        {
                            StockId = stock.StockId,
                            WarningStartTimeUtc = now,
                            ThresholdPrice = threshold,
                            CurrentPrice = stock.CurrentPrice
                        });
                    }
                    else
                    {
                        // 이미 경보 카운트다운 진행 중 -> 72시간 연속 유지 판정
                        double elapsedHours = (now - stock.BelowOnePercentStartTimeUtc.Value).TotalHours;
                        if (elapsedHours >= 72.0)
                        {
                            // 72시간 연속 1% 선 이하 유지 완료 -> 즉시 정리매매 선포
                            TriggerLiquidation(stock);
                        }
                    }
                }
                else
                {
                    // 주가가 1% 선 이상으로 안전하게 회복됨 -> 타이머 해제
                    if (stock.BelowOnePercentStartTimeUtc.HasValue)
                    {
                        Debug.Log($"[DelistingMonitor] ❇️ 해제: {stock.StockId} 주가가 1% 선({threshold}G) 이상으로 정상 회복되었습니다. (현재가: {stock.CurrentPrice}G)");
                        stock.BelowOnePercentStartTimeUtc = null;

                        EventBus.Publish(new StockDelistingWarningClearedEvent
                        {
                            StockId = stock.StockId
                        });
                    }
                }
            }
        }

        /// <summary>
        /// 72시간 체납 종목에 대해 1시간 정리매매 기간을 부여하고 가격을 상장가 10%로 고정시킵니다.
        /// </summary>
        private void TriggerLiquidation(StockInstance stock)
        {
            DateTime now = DateTime.UtcNow;
            DateTime liquidationEndTime = now.AddHours(1);

            stock.IsLiquidationPeriod = true;
            stock.LiquidationEndTimeUtc = liquidationEndTime;
            stock.BelowOnePercentStartTimeUtc = null; // 경고 타이머 초기화

            // 정리매매 정책: 가격을 상장가의 10% 고정가로 강제 조정 및 히스토리 이식
            long oldPrice = stock.CurrentPrice;
            long fixedPrice = (long)Math.Max(1.0, stock.Data.listingPrice * 0.10);
            stock.CurrentPrice = fixedPrice;
            stock.AddPriceToHistory(fixedPrice);

            Debug.LogWarning($"[DelistingMonitor] ⚠️ 정리매매 발령: {stock.StockId} 주식이 72시간 연속 체납으로 인해 정리매매에 돌입합니다. (현재가: {oldPrice}G -> 정리매매 고정가: {fixedPrice}G, 1시간 매도 가능, 신규 매매 차단)");

            EventBus.Publish(new StockLiquidationStartedEvent
            {
                StockId = stock.StockId,
                FixedPrice = fixedPrice,
                LiquidationEndTimeUtc = liquidationEndTime
            });
        }

        /// <summary>
        /// 정리매매 기한이 해제된 주식을 전량 말소하고 플레이어 포트폴리오에서 삭제합니다.
        /// </summary>
        private void ExecuteFinalDelisting(StockInstance stock)
        {
            Debug.LogError($"[DelistingMonitor] 💀 최종 상장폐지 집행: {stock.StockId} 종목이 정리매매 기간 만료로 인해 시장에서 완전히 퇴출됩니다.");

            // 1. 거래 보드에서 퇴출 (상장 해제 및 가변 데이터 청소)
            stock.IsListed = false;
            stock.IsLiquidationPeriod = false;
            stock.LiquidationEndTimeUtc = null;

            // 2. 플레이어 포트폴리오에서 영구 소멸 (HODL 강제 소각)
            var wallet = WalletManager.Instance;
            var saveData = wallet != null ? wallet.ActiveSaveData : null;
            if (saveData != null && saveData.Portfolio != null)
            {
                if (saveData.Portfolio.Remove(stock.StockId))
                {
                    Debug.LogError($"[DelistingMonitor] 상장폐지 처분에 따라 플레이어가 보유 중이던 {stock.StockId} 주식이 한 푼의 정산 없이 전량 강제 소각되었습니다.");
                }
            }

            // 3. 상장폐지 최종 전역 이벤트 발행 (IPO 시스템 및 UI에서 Vacancy 탐지용으로 구독)
            EventBus.Publish(new StockDelistedEvent
            {
                StockId = stock.StockId,
                Sector = stock.Data.sector
            });
        }
    }

    #region Delisting Events (상장폐지 및 정리매매 전역 이벤트 구조체)

    /// <summary>
    /// 주가가 listingPrice의 1% 미만으로 최초 하락하여 상폐 카운트다운 경보가 작동할 때 발행되는 이벤트.
    /// </summary>
    public struct StockDelistingWarningEvent
    {
        public string StockId;
        public DateTime WarningStartTimeUtc;
        public long ThresholdPrice;
        public long CurrentPrice;
    }

    /// <summary>
    /// 주가가 listingPrice의 1% 선을 회복하여 상폐 경보가 공식 해제되었을 때 발행되는 이벤트.
    /// </summary>
    public struct StockDelistingWarningClearedEvent
    {
        public string StockId;
    }

    /// <summary>
    /// 72시간 연속 하락으로 인해 상장폐지가 확정되어 1시간 정리매매 기간에 진입했을 때 발행되는 이벤트.
    /// </summary>
    public struct StockLiquidationStartedEvent
    {
        public string StockId;
        public long FixedPrice;
        public DateTime LiquidationEndTimeUtc;
    }

    /// <summary>
    /// 정리매매가 끝나고 주식이 최종적으로 시장에서 퇴출(말소)되었을 때 발행되는 이벤트.
    /// </summary>
    public struct StockDelistedEvent
    {
        public string StockId;
        public StockSector Sector;
    }

    #endregion
}
