using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 실시간 주가 결정 엔진 (Price Engine).
    /// <para>
    /// TickEngine의 <see cref="GameTickEvent"/>를 구독하여 매 틱(1게임시간)마다
    /// 상장된 전 종목의 가격을 아래 공식으로 갱신합니다.
    /// </para>
    ///
    /// <para><b>가격 결정 공식</b></para>
    /// <code>
    /// deltaRatio = (gaussNoise × volatilityStdDev) + trendBias + scarcityPressure
    /// newPrice   = Round(currentPrice × (1 + deltaRatio))
    /// newPrice   = Clamp(newPrice, 1, long.MaxValue)
    /// </code>
    ///
    /// <para><b>의존 모듈 (구현 예정)</b></para>
    /// <list type="bullet">
    ///   <item>Task 024 <c>BuyPressure.cs</c> → scarcityPressure 계산 이관 예정</item>
    ///   <item>Task 025 <c>VolatilityTierService.cs</c> → 티어별 stdDev 상수 이관 예정</item>
    ///   <item>Task 026 <c>TrendEngine.cs</c> → trendBias 공급 예정</item>
    /// </list>
    /// </summary>
    public class PriceEngine : Singleton<PriceEngine>
    {
        // --------------------------------------------------------
        // 1. 초기화 및 이벤트 연결
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        // --------------------------------------------------------
        // 3. 틱 핸들러
        // --------------------------------------------------------

        private void OnGameTick(GameTickEvent e)
        {
            if (MarketManager.Instance == null) return;
            if (RNG_System.Instance == null) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            foreach (var stock in listedStocks)
            {
                UpdateStockPrice(stock);
            }
        }

        // --------------------------------------------------------
        // 4. 핵심 가격 연산
        // --------------------------------------------------------

        /// <summary>
        /// 단일 종목의 가격을 1틱 기준으로 연산 및 갱신합니다.
        /// </summary>
        private void UpdateStockPrice(StockInstance stock)
        {
            if (stock == null || !stock.IsListed) return;

            // ── 거래 정지(Trading Halt) 또는 정리매매(Liquidation) 기간 동안은 가격 고정 및 갱신 스킵 ──
            if (stock.IsLiquidationPeriod || (stock.TradingHaltEndTimeUtc.HasValue && DateTime.UtcNow < stock.TradingHaltEndTimeUtc.Value))
            {
                return;
            }

            // ── 4-1. 변동성 표준편차 (VolatilityTierService — Task 025 완료) ──────────
            double stdDev = VolatilityTierService.GetStdDev(stock.Data.volatilityTier);

            // ── 4-2. 가우시안 노이즈 — 클램프 적용 후 확정 ──────────────────
            // 클램프는 랜덤 성분(노이즈)의 이상치만 차단합니다.
            // scarcityPressure와 trendBias는 GDD가 명시한 결정론적 시장 힘이므로
            // 클램프 영향을 받지 않도록 반드시 클램프 이후에 합산해야 합니다.
            double rawNoise   = RNG_System.Instance.NextGaussian(stock.StockId, 0.0, stdDev);
            double gaussNoise = VolatilityTierService.ClampDelta(rawNoise, stock.Data.volatilityTier);

            // ── 4-3. 희소성/매도 압력 (신디케이트 시너지 자동 포함) ─────────
            // BuyPressure가 IsSyndicateActive() 스텁을 통해 신디케이트 상태를 자체 조회
            // [ROADMAP_02] SyndicateManager 구현 시 BuyPressure.IsSyndicateActive()만 교체하면 됨
            double scarcityPressure = BuyPressure.ComputeWithSyndicate(stock);

            // ── 4-4. 트렌드 바이어스 (TrendEngine — Task 026 완료) ─────────────
            double trendBias = (TrendEngine.Instance != null)
                ? TrendEngine.Instance.GetBias(stock.StockId)
                : 0.0;

            // ── 4-4.5. 미세 노이즈 (PriceNoise — Task 051 완료) ─────────────────
            double microNoise = PriceNoise.GetMicroNoise(stock.StockId, stock.Data.volatilityTier);

            // ── 4-5. 최종 변동률 합산 ─────────────────────────────────────
            // gaussNoise는 이미 클램프 완료. scarcity + trend + microNoise는 항상 반영 보장.
            double deltaRatio = gaussNoise + scarcityPressure + trendBias + microNoise;

            // ── 4-6. 새 가격 적용 ─────────────────────────────────────────
            long newPrice = (long)Math.Round(stock.CurrentPrice * (1.0 + deltaRatio));
            newPrice = Math.Max(1L, newPrice); // 최소 1G 보장 (음수/0 방지)

            // ── 4-7. Delta 계산 (히스토리 추가 전에 이전 가격 참조) ────────
            long prevPrice = (stock.PriceHistory.Count >= 1)
                ? stock.PriceHistory[stock.PriceHistory.Count - 1]
                : stock.Data.listingPrice;
            long delta = newPrice - prevPrice;

            // ── 4-8. 가격 및 히스토리 갱신 ───────────────────────────────
            stock.CurrentPrice = newPrice;
            stock.AddPriceToHistory(newPrice);

            // ── 4-9. ATH(전고점) 갱신 ────────────────────────────────────
            if (newPrice > stock.PeakPrice)
            {
                stock.PeakPrice = newPrice;
            }

            // ── 4-10. 이벤트 발행 (UI 차트 구독용) ──────────────────────
            EventBus.Publish(new StockPriceUpdatedEvent
            {
                StockId  = stock.StockId,
                NewPrice = newPrice,
                Delta    = delta
            });
        }

        // --------------------------------------------------------
        // 5. 인라인 서브 연산 (Task 024, 025 전까지 임시 사용)
        // --------------------------------------------------------

        // Task 025 VolatilityTierService.cs 완료로 인라인 GetVolatilityStdDev() 제거됨.

        // Task 024 BuyPressure.cs 완료로 인라인 ComputeScarcityPressure() 제거됨.
    }

    // --------------------------------------------------------
    // 6. 관련 이벤트 구조체 (EventBus 발행용)
    // --------------------------------------------------------

    /// <summary>
    /// 특정 종목의 가격이 갱신되었을 때 발행되는 이벤트.
    /// UI 차트 렌더러, 포트폴리오 패널 등에서 구독합니다.
    /// </summary>
    public struct StockPriceUpdatedEvent
    {
        /// <summary>갱신된 종목 ID</summary>
        public string StockId;

        /// <summary>갱신된 현재가 (Gold)</summary>
        public long NewPrice;

        /// <summary>직전 틱 대비 가격 변동량 (양수 = 상승, 음수 = 하락)</summary>
        public long Delta;
    }
}
