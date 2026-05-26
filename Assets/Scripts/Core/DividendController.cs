using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 배당금 정책 컨트롤러.
    /// CalendarSystem의 주간 금융 정산 이벤트(WeeklySettlementEvent)를 구독하여,
    /// 매주 월요일 00:00(UTC) 기준 최소 72시간 이상 연속 보유한 주식 물량에 대해 주간 배당금을 정산하고 누적합니다.
    /// </summary>
    public class DividendController : Singleton<DividendController>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 주간 정기 정산 이벤트 구독
            EventBus.Subscribe<WeeklySettlementEvent>(OnWeeklySettlement);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<WeeklySettlementEvent>(OnWeeklySettlement);
        }

        /// <summary>
        /// 매주 월요일 00:00 UTC 정산 트리거 수신 시 배당금 계산을 실행합니다.
        /// </summary>
        private void OnWeeklySettlement(WeeklySettlementEvent e)
        {
            Debug.Log($"[DividendController] 주간 배당금 정산 프로세스 시작. 기준시={e.SettlementTime:yyyy-MM-dd HH:mm:ss} UTC (Offline={e.IsOfflineBatch})");

            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData == null || saveData.Portfolio == null)
            {
                Debug.LogWarning("[DividendController] 정산 대상 세이브 데이터나 포트폴리오가 존재하지 않습니다.");
                return;
            }

            long totalDividendEarned = 0;
            var dividendPerStock = new Dictionary<string, long>();

            foreach (var holding in saveData.Portfolio.Values)
            {
                if (holding.Quantity <= 0) continue;

                // ── 1. 상장된 주식 인스턴스 조회 ──────────────────────────────────
                var stock = MarketManager.Instance.GetStock(holding.StockId);
                if (stock == null)
                {
                    Debug.LogWarning($"[DividendController] 마스터 시장에 존재하지 않는 종목이 포트폴리오에 있습니다: {holding.StockId}");
                    continue;
                }

                // 상장폐지된 주식은 배당금 계산에서 제외
                if (!stock.IsListed) continue;

                // ── 2. 구버전 마이그레이션 Failsafe 보정 ─────────────────────────
                // 구매 상세 이력(PurchaseChunks)이 비어있으나 전체 수량이 있는 경우
                // 72시간 배당 판정을 충족할 수 있도록 정산 시간 기준 4일 전(96시간 전) 구매한 청크로 가상 변환해 이식합니다.
                if ((holding.PurchaseChunks == null || holding.PurchaseChunks.Count == 0) && holding.Quantity > 0)
                {
                    if (holding.PurchaseChunks == null)
                    {
                        holding.PurchaseChunks = new List<PurchaseChunkDTO>();
                    }

                    holding.PurchaseChunks.Add(new PurchaseChunkDTO
                    {
                        Quantity = holding.Quantity,
                        PurchaseTimeUtc = e.SettlementTime.AddDays(-4), // 72시간 연속 보유 자동 충족
                        PurchasePrice = holding.AveragePurchasePrice
                    });
                    
                    Debug.LogWarning($"[DividendController] {holding.StockId} 종목의 상세 매수 내역이 누락되어 하위 호환성 복원 필터(Failsafe 4Days Ago Lot)를 이식했습니다.");
                }

                // ── 3. 72시간 연속 보유 물량 판정 ─────────────────────────────────
                long eligibleQuantity = 0;
                foreach (var chunk in holding.PurchaseChunks)
                {
                    double elapsedHours = (e.SettlementTime - chunk.PurchaseTimeUtc).TotalHours;
                    // 주간 정산 기준 일시 대비 최소 72시간 이전에 매수한 내역만 인정
                    if (elapsedHours >= 72.0)
                    {
                        eligibleQuantity += chunk.Quantity;
                    }
                }

                // ── 4. 개별 종목 배당액 계산 및 반영 ──────────────────────────────
                if (eligibleQuantity > 0)
                {
                    double rate = stock.Data.weeklyDividendRate;
                    if (rate <= 0f) continue; // 배당율이 0% 이하인 종목 패스

                    // 배당금 공식: 보유량 * 현재 주가 * 주간 배당률
                    long dividend = (long)Math.Round(eligibleQuantity * stock.CurrentPrice * rate);

                    if (dividend > 0)
                    {
                        totalDividendEarned += dividend;
                        dividendPerStock[holding.StockId] = dividend;
                        
                        Debug.Log($"[DividendController] {holding.StockId} 정산: 보유={holding.Quantity}주, 대상={eligibleQuantity}주, 가격={stock.CurrentPrice}G, 배당률={rate:P1} -> 수령배당금={dividend}G");
                    }
                }
            }

            // ── 5. 정산액을 지갑 미지급 배당금으로 최종 입금 ──────────────────────
            if (totalDividendEarned > 0)
            {
                WalletManager.Instance.AddDividends(totalDividendEarned);
                Debug.Log($"[DividendController] 주간 정산 총 배당금 합계: {totalDividendEarned}G 누적");
            }
            else
            {
                Debug.Log("[DividendController] 이번 주 정산 조건(72시간 HODL)을 만족하는 배당 대상 물량이 존재하지 않습니다.");
            }

            // ── 6. 정산 결과 전역 통지 발행 ────────────────────────────────────
            EventBus.Publish(new WeeklyDividendsCalculatedEvent
            {
                SettlementTime = e.SettlementTime,
                TotalDividendEarned = totalDividendEarned,
                DividendPerStock = dividendPerStock
            });
        }
    }

    #region Dividend Events (배당 전역 이벤트 구조체)

    /// <summary>
    /// 주간 배당 정산 연산이 완료되었을 때 발행되는 이벤트.
    /// UI 정산 리포트, 메인 HUD 등에서 구독하여 팝업 연출 및 세부 종목별 내역을 표시하는 데 사용됩니다.
    /// </summary>
    public struct WeeklyDividendsCalculatedEvent
    {
        /// <summary>정산이 처리된 기준 UTC 일시</summary>
        public DateTime SettlementTime;

        /// <summary>플레이어가 이번 틱에 벌어들인 총 배당금 합산액 (Gold)</summary>
        public long TotalDividendEarned;

        /// <summary>종목별 획득 배당금 상세 이력 (Key: StockId, Value: Dividend Gold)</summary>
        public Dictionary<string, long> DividendPerStock;
    }

    #endregion
}
