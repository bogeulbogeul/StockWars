using System;
using UnityEngine;
using UnityEngine.UI;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 [주식 거래 시스템] 원클릭 100% 가용자산 쾌속 매수 토글러 (QuickBuyToggle).
    /// <para>
    /// 이 토글 스위치가 활성화되어 있을 경우, 특정 종목의 매수 버튼을 누를 때 
    /// 수량 입력 다이얼로그 없이 즉각 가용 자산의 100%를 동원해 최대 수량을 매수합니다.
    /// </para>
    /// <para>
    /// **수수료 및 스탯 연동 공식:**
    /// - 기본 매수 수수료율: 0.15% (0.0015)
    /// - 최종 수수료율 = Max(0, 0.0015 - StatCore.Instance.GetTradingFeeDiscount())
    /// - 단일 종목 투자 한도(Buy Cap) 및 포트폴리오 슬롯 한계를 실시간 검산하여 안전 매수 수량을 자동 역산합니다.
    /// </para>
    /// </summary>
    public class QuickBuyToggle : MonoBehaviour
    {
        [Header("UI Component Bindings")]
        [Tooltip("토글 상태를 제어할 유니티 UI Toggle (선택 사항)")]
        public Toggle uiToggle;

        [Tooltip("토글 상태에 따라 색상을 바꿀 이미지 (선택 사항)")]
        public Image indicatorImage;

        [Header("Visual Colors")]
        [Tooltip("활성화 시 하이라이트 색상 (상승 텍스트 색상 계열인 Neon Blue 선호)")]
        public Color activeColor = new Color(0.035f, 0.353f, 0.906f, 1f); // #095ae7ff

        [Tooltip("비활성화 시 색상")]
        public Color inactiveColor = new Color(0.5f, 0.5f, 0.5f, 1f);

        /// <summary>
        /// 런타임 간편 매수 모드 활성화 전역 상태 프로퍼티.
        /// </summary>
        public static bool IsQuickBuyEnabled { get; private set; } = false;

        private void Start()
        {
            // UI Toggle이 등록되어 있다면 상태를 연동하고 리스너 부착
            if (uiToggle != null)
            {
                uiToggle.isOn = IsQuickBuyEnabled;
                uiToggle.onValueChanged.AddListener(SetQuickBuyMode);
            }
            UpdateVisuals();
        }

        private void OnDestroy()
        {
            if (uiToggle != null)
            {
                uiToggle.onValueChanged.RemoveListener(SetQuickBuyMode);
            }
        }

        /// <summary>
        /// 쾌속 매수 모드를 토글(ON/OFF)합니다.
        /// </summary>
        public void ToggleMode()
        {
            SetQuickBuyMode(!IsQuickBuyEnabled);
            if (uiToggle != null)
            {
                uiToggle.isOn = IsQuickBuyEnabled;
            }
        }

        /// <summary>
        /// 쾌속 매수 모드를 설정합니다.
        /// </summary>
        public void SetQuickBuyMode(bool enabled)
        {
            if (IsQuickBuyEnabled == enabled) return;

            IsQuickBuyEnabled = enabled;
            UpdateVisuals();

            // 전역 이벤트 발행
            EventBus.Publish(new QuickBuyModeChangedEvent
            {
                IsEnabled = IsQuickBuyEnabled
            });

            Debug.Log($"[QuickBuyToggle] 100% 간편 쾌속 매수 모드 전환: {(IsQuickBuyEnabled ? "ON" : "OFF")}");
        }

        /// <summary>
        /// 현재 토글 상태에 맞춰 UI 색상 및 비주얼 상태를 업데이트합니다.
        /// </summary>
        private void UpdateVisuals()
        {
            if (indicatorImage != null)
            {
                indicatorImage.color = IsQuickBuyEnabled ? activeColor : inactiveColor;
            }
        }

        /// <summary>
        /// [핵심 비즈니스 로직] 특정 종목에 대해 가용 자산 100% 매수를 역산하여 안전하게 실행합니다.
        /// </summary>
        /// <param name="stockId">매수할 상장 종목 ID</param>
        /// <returns>매수 트랜잭션 성공 여부 (자금 부족, 한도 초과, 거래 정지 등으로 실패 시 false)</returns>
        public static bool ExecuteQuickBuy(string stockId)
        {
            if (string.IsNullOrEmpty(stockId)) return false;

            var wallet = WalletManager.Instance;
            var market = MarketManager.Instance;
            var stats = StatCore.Instance;

            if (wallet == null || market == null)
            {
                Debug.LogError("[QuickBuyToggle] 지갑 혹은 마켓 매니저 인프라가 누락되어 쾌속 매수가 불가능합니다.");
                return false;
            }

            // 1. 거래 대상 주식 조회
            var stock = market.GetStock(stockId.ToUpper());
            if (stock == null)
            {
                Debug.LogWarning($"[QuickBuyToggle] 존재하지 않는 종목 ID입니다: {stockId}");
                return false;
            }

            double currentPrice = stock.CurrentPrice;
            if (currentPrice <= 0)
            {
                Debug.LogWarning($"[QuickBuyToggle] 주가가 0 이하인 비정상 종목입니다: {stockId}");
                return false;
            }

            // 1.1. 거래 정지(Trading Halt) 혹은 정리매매(Liquidation) 상태 사전 검산 (출금/롤백 방어)
            if (stock.IsLiquidationPeriod)
            {
                Debug.LogWarning($"[QuickBuyToggle] 매수 실패 (정리매매 기간): {stock.StockId} (정리매매 기간에는 신규 매수가 전면 금지됩니다.)");
                return false;
            }
            if (stock.TradingHaltEndTimeUtc.HasValue && DateTime.UtcNow < stock.TradingHaltEndTimeUtc.Value)
            {
                Debug.LogWarning($"[QuickBuyToggle] 매수 실패 (거래 정지 상태): {stock.StockId} (해제 예정: {stock.TradingHaltEndTimeUtc.Value:yyyy-MM-dd HH:mm:ss} UTC)");
                return false;
            }

            // 2. 가용 자산 및 수수료율 계산
            long availableCash = wallet.GetCash();
            if (availableCash <= 0)
            {
                Debug.LogWarning($"[QuickBuyToggle] 매수 실패: 가용 자산이 0G 이하입니다. 현재={availableCash}G");
                return false;
            }

            // 기본 수수료율 0.15% - 협상력(Negotiation) 스탯 수수료 감면 연동
            double baseFeeRate = 0.0015;
            double feeDiscount = stats != null ? stats.GetTradingFeeDiscount() : 0.0;
            double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);

            // 주식 1주당 수수료 포함 실질 매입 비용
            double effectiveCostPerShare = currentPrice * (1.0 + finalFeeRate);

            // 3. 자금력 기준 최대 매수 가능 수량 1차 산출
            int maxQuantityByCash = (int)Math.Floor(availableCash / effectiveCostPerShare);
            if (maxQuantityByCash <= 0)
            {
                Debug.LogWarning($"[QuickBuyToggle] 매수 실패: 단 1주도 살 수 없는 잔고입니다. 필요={effectiveCostPerShare:F1}G, 보유={availableCash}G");
                return false;
            }

            // 4. 운용력(Management) 스탯 제약사항 (Buy Cap & Portfolio Slots)에 따른 2차 필터 검산
            int finalQuantity = maxQuantityByCash;

            if (stats != null)
            {
                // A) 포트폴리오 슬롯 제한 검사
                var portfolio = wallet.ActiveSaveData.Portfolio;
                bool isNewHolding = !portfolio.TryGetValue(stock.StockId, out var holding) || holding.Quantity <= 0;
                if (isNewHolding)
                {
                    int maxSlots = stats.GetPortfolioSlots();
                    int activeSlots = 0;
                    foreach (var kvp in portfolio)
                    {
                        if (kvp.Value.Quantity > 0) activeSlots++;
                    }

                    if (activeSlots >= maxSlots)
                    {
                        Debug.LogWarning($"[QuickBuyToggle] 매수 차단: 포트폴리오 보유 허용 한도({maxSlots}종목)를 초과했습니다. 운용력 스탯을 강화하십시오.");
                        return false;
                    }
                }

                // B) 단일 종목 투자 한도(Buy Cap) 검사 및 수량 역산 제한
                long maxBuyCap = stats.GetMaxBuyCapPerStock();
                if (maxBuyCap < long.MaxValue)
                {
                    long currentInvestedValue = holding != null ? (long)Math.Round(holding.Quantity * holding.AveragePurchasePrice) : 0L;
                    long remainingCap = maxBuyCap - currentInvestedValue;
                    if (remainingCap <= 0)
                    {
                        Debug.LogWarning($"[QuickBuyToggle] 매수 차단: 이미 해당 종목의 투자 한도({maxBuyCap:N0}G)를 가득 채웠습니다.");
                        return false;
                    }

                    // 수수료 제외 순수 주가 기준 구매 한도 내 최대 수량
                    int maxQuantityByCap = (int)Math.Floor(remainingCap / currentPrice);
                    finalQuantity = Math.Min(finalQuantity, maxQuantityByCap);
                }
            }

            if (finalQuantity <= 0)
            {
                Debug.LogWarning("[QuickBuyToggle] 매수 실패: 운용 한도 제약으로 인해 매수 가능 수량이 0주입니다.");
                return false;
            }

            // 5. 실질 거래 대금(수수료 포함) 원자적 최종 산정 및 출금
            long pureStockCost = (long)Math.Round(finalQuantity * currentPrice);
            long tradingFee = (long)Math.Round(pureStockCost * finalFeeRate);
            long totalCost = pureStockCost + tradingFee;

            // 최종 정합성 가드링 (소수점 올림 오차 대비 Failsafe 재확인)
            while (totalCost > availableCash && finalQuantity > 0)
            {
                finalQuantity--;
                pureStockCost = (long)Math.Round(finalQuantity * currentPrice);
                tradingFee = (long)Math.Round(pureStockCost * finalFeeRate);
                totalCost = pureStockCost + tradingFee;
            }

            if (finalQuantity <= 0) return false;

            // 6. 지갑 출금 및 포트폴리오 분입 실행 (원자적 분산 처리)
            if (!wallet.SpendCash(totalCost))
            {
                Debug.LogError("[QuickBuyToggle] 잔고 인출 예외 발생으로 매수 거래를 긴급 취소합니다.");
                return false;
            }

            if (!wallet.AddStockHolding(stock.StockId, finalQuantity, currentPrice))
            {
                // 포트폴리오 추가 실패 시 출금 자산 롤백 처리 (무결성 Failsafe)
                wallet.AddCash(totalCost);
                Debug.LogError("[QuickBuyToggle] 포트폴리오 원장 갱신 실패로 자산을 긴급 롤백(입금) 환원했습니다.");
                return false;
            }

            // 쾌속 매수 완료 이벤트 발행 (로거 및 UI 효과 감청)
            EventBus.Publish(new QuickBuyExecutedEvent
            {
                StockId = stock.StockId,
                Quantity = finalQuantity,
                UnitPrice = currentPrice,
                FeePaid = tradingFee,
                TotalCashSpent = totalCost
            });

            Debug.Log($"[QuickBuyToggle] ⚡쾌속 매수 완결: {stock.StockId} {finalQuantity}주 매입 완료 (총액: {totalCost:N0}G, 수수료: {tradingFee:N0}G)");
            return true;
        }
    }

    #region Quick Buy Event Definitions

    /// <summary>
    /// 원클릭 쾌속 매수 모드가 켜지거나 꺼졌을 때 발행되는 이벤트.
    /// </summary>
    public struct QuickBuyModeChangedEvent
    {
        public bool IsEnabled;
    }

    /// <summary>
    /// 쾌속 매수가 완결되어 주문 체결 및 자산 소모가 완료되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct QuickBuyExecutedEvent
    {
        public string StockId;
        public int Quantity;
        public double UnitPrice;
        public long FeePaid;
        public long TotalCashSpent;
    }

    #endregion
}
