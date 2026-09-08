using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_07 & CORE_GDD_06: 
    /// 매주 월요일 00:00(UTC) 금융 정산 틱(WeeklySettlementEvent) 시,
    /// 1. 표준 오피스 기본 임대료 (5,000G)
    /// 2. 주간 금융소득세 (Capital Gains Tax - 주간 실현 순수익 기준 누진세, 가구 지출 50% 경비 공제)
    /// 3. 종합 자산세 (Wealth Tax - 현금 및 주식 총자산 기준 누진세)
    /// 4. 안나의 협상력 스탯 기반 절세(Tax Shield) 감면
    /// 을 원자적으로 계산하고 차감하는 주간 공과금/세무 정산 매니저.
    /// </summary>
    public class OfficeMaintenance : Singleton<OfficeMaintenance>
    {
        public const long STANDARD_OFFICE_RENT = 5000L; // 표준 오피스 주간 기본 임대료

        // --------------------------------------------------------
        // 1. 이벤트 구독 설정
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            EventBus.Subscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        // --------------------------------------------------------
        // 2. 주간 유지비 및 누진 세금 정산 처리
        // --------------------------------------------------------

        private void OnWeeklySettlementProcessed(WeeklySettlementEvent e)
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            // A. 기본 임대료 (5,000G)
            long rent = STANDARD_OFFICE_RENT;

            // B. 주간 금융소득세 계산 (가구 구매 50% 경비 인정)
            long rawWeeklyProfit = saveData.WeeklyRealizedProfit;
            long furnitureExpenseDeduction = (long)(saveData.WeeklyFurnitureSpending * 0.5f);
            long taxableProfit = Math.Max(0, rawWeeklyProfit - furnitureExpenseDeduction);
            long capitalGainsTax = CalculateCapitalGainsTax(taxableProfit);

            // C. 종합 자산세 계산 (현금 + 보유 주식 평가액)
            long totalAssets = CalculateTotalAssets(saveData);
            long wealthTax = CalculateWealthTax(totalAssets);

            long rawTotalTax = capitalGainsTax + wealthTax;

            // D. 파트너 안나의 협상력 기반 절세(Tax Shield) 감면 적용
            int negLv = saveData.Stats.BaseNegotiationLv;
            float shieldRatio = Mathf.Clamp(negLv * 0.03f, 0f, 0.15f); // 협상력 레벨당 3% (최대 15%)
            long taxShieldSavings = (long)Math.Round(rawTotalTax * shieldRatio);
            long finalTax = Math.Max(0, rawTotalTax - taxShieldSavings);

            // E. 최종 청구 총액 산출
            long totalDue = rent + finalTax;

            Debug.Log($"<color=#FFD700>[OfficeMaintenance] 주간 금융 세무 정산 가동:</color>\n" +
                      $" - 기본 임대료: {rent:N0}G\n" +
                      $" - 주간 실현이익: {rawWeeklyProfit:N0}G (가구공제: -{furnitureExpenseDeduction:N0}G -> 과세표준: {taxableProfit:N0}G) -> 소득세: {capitalGainsTax:N0}G\n" +
                      $" - 총 자산규모: {totalAssets:N0}G -> 자산세: {wealthTax:N0}G\n" +
                      $" - 안나 절세 감면: -{taxShieldSavings:N0}G (협상력 Lv.{negLv} -{shieldRatio * 100:F0}%)\n" +
                      $" ═════════════════════════════════════════\n" +
                      $" => 최종 청구액: {totalDue:N0}G (세금: {finalTax:N0}G + 임대료: {rent:N0}G)");

            // F. ── 강제 차감 (Overdraft/Negative Cash Allowed) ──
            long prevCash = saveData.Gold;
            saveData.Gold = Math.Clamp(saveData.Gold - totalDue, long.MinValue, long.MaxValue);

            // G. 정산 후 주간 누적 데이터 초기화
            saveData.WeeklyRealizedProfit = 0;
            saveData.WeeklyFurnitureSpending = 0;

            // H. 지갑 변동 전역 이벤트 전송
            EventBus.Publish(new CashChangedEvent
            {
                PreviousCash = prevCash,
                NewCash = saveData.Gold,
                Delta = -totalDue
            });

            // I. 세무/월세 정산 결과 전역 알림 발행 (UI 고지서 및 안나 반응용)
            EventBus.Publish(new OfficeMaintenanceProcessedEvent
            {
                PlayerLevel = saveData.PlayerLevel,
                RentCharged = rent,
                CapitalGainsTax = capitalGainsTax,
                WealthTax = wealthTax,
                TaxShieldSavings = taxShieldSavings,
                TotalFeeCharged = totalDue,
                NewGoldBalance = saveData.Gold,
                SettlementTime = e.SettlementTime
            });

            // J. 보안 무결성 동기화 및 디스크 즉시 저장
            if (DataIntegrity.Instance != null)
            {
                DataIntegrity.Instance.SyncShadows();
            }

            if (AutoSaveRouter.Instance != null)
            {
                AutoSaveRouter.Instance.TriggerInstantSave();
            }
        }

        // --------------------------------------------------------
        // 3. 세금 계산 헬퍼 함수
        // --------------------------------------------------------

        /// <summary>
        /// 과세 표준 실현 순이익에 따른 누진 금융소득세 계산 (CORE_GDD_07 Section 3.2)
        /// </summary>
        public static long CalculateCapitalGainsTax(long taxableProfit)
        {
            if (taxableProfit <= 10000L) return 0L;                          // 1만G 이하 면세
            if (taxableProfit <= 100000L) return (long)(taxableProfit * 0.05f);     // 1만 ~ 10만G (5%)
            if (taxableProfit <= 1000000L) return (long)(taxableProfit * 0.12f);    // 10만 ~ 100만G (12%)
            return (long)(taxableProfit * 0.20f);                                   // 100만G 초과 (20%)
        }

        /// <summary>
        /// 총 보유 자산에 따른 누진 종합 자산세 계산 (CORE_GDD_07 Section 3.3)
        /// </summary>
        public static long CalculateWealthTax(long totalAssets)
        {
            if (totalAssets < 100000L) return 0L;                            // 10만G 미만 면세
            if (totalAssets <= 1000000L) return (long)(totalAssets * 0.002f);       // 10만 ~ 100만G (0.2%)
            if (totalAssets <= 10000000L) return (long)(totalAssets * 0.005f);      // 100만 ~ 1000만G (0.5%)
            return (long)(totalAssets * 0.010f);                                    // 1000만G 이상 (1.0%)
        }

        /// <summary>
        /// 플레이어의 총 자산 (가용 현금 + 포트폴리오 주식 평가액) 계산
        /// </summary>
        public static long CalculateTotalAssets(SaveDataDTO saveData)
        {
            if (saveData == null) return 0L;

            long total = Math.Max(0, saveData.Gold);

            if (saveData.Portfolio != null && MarketManager.Instance != null)
            {
                foreach (var kvp in saveData.Portfolio)
                {
                    var stock = MarketManager.Instance.GetStock(kvp.Key);
                    double price = stock != null ? stock.CurrentPrice : kvp.Value.AveragePurchasePrice;
                    total += (long)Math.Round(price * kvp.Value.Quantity);
                }
            }

            return total;
        }
    }

    // --------------------------------------------------------
    // 4. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 주간 오피스 임대료 및 누진 세금 정산이 성공적으로 완료되었을 때 발행되는 알림 이벤트 (UI 고지서 연동용)
    /// </summary>
    public struct OfficeMaintenanceProcessedEvent
    {
        public int PlayerLevel;
        public long RentCharged;
        public long CapitalGainsTax;
        public long WealthTax;
        public long TaxShieldSavings;
        public long TotalFeeCharged;
        public long NewGoldBalance;
        public DateTime SettlementTime;
    }
}
