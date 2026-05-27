using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 매수/매도 압력 연산기 (Buy &amp; Sell Pressure Calculator).
    /// <para>
    /// 유통 물량(AvailableVolume)의 고갈/초과 정도를 <b>제곱근(√) 함수</b>로 변환하여
    /// 비선형 가격 압력을 산출합니다.
    /// </para>
    ///
    /// <para><b>압력 공식 — 매수 압력 (고갈 시)</b></para>
    /// <code>
    /// availableRatio = AvailableVolume / FloatingSupply  // (0, 1]
    /// scarcityFactor = 1 - √(availableRatio)             // 비선형 고갈 계수
    /// pressure = scarcityFactor × (0.15 / 168)           // 틱당 희석
    /// </code>
    ///
    /// <para><b>압력 공식 — 매도 압력 (초과 공급 시)</b></para>
    /// <code>
    /// overRatio  = AvailableVolume / FloatingSupply - 1.0 // 초과분 비율
    /// sellFactor = √(Min(overRatio, 1.0))                 // 비선형 매도 계수
    /// pressure   = -(sellFactor × OVERSUPPLY_DAMPENER × PressurePerTick)
    /// </code>
    ///
    /// <para><b>신디케이트 시너지 (GDD 3.2)</b></para>
    /// 동일 신디케이트 공동 작전 선포 시 압력 가중치 × <b>1.5배</b>.
    /// [ROADMAP_02] SyndicateManager 구현 완료 시 <see cref="IsSyndicateActive"/> 교체 예정.
    /// </summary>
    public static class BuyPressure
    {
        // --------------------------------------------------------
        // 1. 밸런스 상수
        // --------------------------------------------------------

        /// <summary>GDD 3.1: 완전 고갈 시 주간 최대 매수 압력 (+15%)</summary>
        private const double MAX_WEEKLY_PRESSURE = 0.15;

        /// <summary>신디케이트 공동 작전 가중치 배율 (GDD 3.2)</summary>
        private const double SYNDICATE_MULTIPLIER = 1.5;

        /// <summary>
        /// 초과 공급(매도 과잉) 시 하락 압력 감쇠 계수.
        /// 매도 압력은 매수 압력보다 약하게 설계 (0.5 = 절반 강도).
        /// ⚠️ [밸런스 주의] 이 값이 너무 크면 대량 매도 시 가격이 급락합니다.
        /// </summary>
        private const double OVERSUPPLY_DAMPENER = 0.5;

        /// <summary>틱당 기준 압력 (168틱 = 1주 희석)</summary>
        private static readonly double PressurePerTick
            = MAX_WEEKLY_PRESSURE / GlobalConstants.HOURS_PER_WEEK;

        // --------------------------------------------------------
        // 2. 핵심 연산 API
        // --------------------------------------------------------

        /// <summary>
        /// 단일 종목의 현재 틱 가격 압력 비율을 반환합니다.
        /// <list type="bullet">
        ///   <item>양수 = 매수 압력 (물량 고갈 → 가격 상승)</item>
        ///   <item>음수 = 매도 압력 (물량 초과 공급 → 가격 하락)</item>
        /// </list>
        /// </summary>
        public static double Compute(StockInstance stock)
        {
            if (stock == null || stock.Data.floatingSupply <= 0) return 0.0;

            double rawRatio = (double)stock.AvailableVolume / stock.Data.floatingSupply;

            // ── [주의 1 해결] 초과 공급 → 매도 하락 압력 ───────────────────
            // 플레이어 대량 매도 등으로 AvailableVolume이 FloatingSupply를 초과한 경우
            if (rawRatio > 1.0)
            {
                double overRatio  = Math.Min(rawRatio - 1.0, 1.0); // 초과분 비율 [0, 1]
                double sellFactor = Math.Sqrt(overRatio);           // 비선형 완화
                return -(sellFactor * OVERSUPPLY_DAMPENER * PressurePerTick);
            }

            // ── 정상 범위 [0, 1]: 매수 압력 ────────────────────────────────
            double availableRatio = Math.Max(0.0, rawRatio);

            // 제곱근 고갈 계수:
            // availableRatio=1.0  → factor=0   (물량 충분, 압력 없음)
            // availableRatio=0.25 → factor=0.5 (75% 소진, FOMO 발동)
            // availableRatio=0.0  → factor=1.0 (완전 고갈, 최대 압력)
            double scarcityFactor = 1.0 - Math.Sqrt(availableRatio);
            return scarcityFactor * PressurePerTick;
        }

        /// <summary>
        /// [주의 2 해결] 신디케이트 공동 작전 상태를 자동 조회하여 압력을 반환합니다.
        /// PriceEngine은 이 메서드 하나만 호출하면 신디케이트 배율이 자동 반영됩니다.
        /// (GDD 3.2: 신디케이트 공동 매수 → 압력 1.5배, 매도 압력에는 미적용)
        /// </summary>
        public static double ComputeWithSyndicate(StockInstance stock)
        {
            double pressure = Compute(stock);
            // 음수(매도 압력) 구간에는 신디케이트 배율 미적용
            if (pressure <= 0.0) return pressure;
            return IsSyndicateActive(stock.StockId) ? pressure * SYNDICATE_MULTIPLIER : pressure;
        }

        /// <summary>
        /// [주의 2 해결 — ROADMAP_02 연동 스텁]
        /// 특정 종목에 신디케이트 공동 작전이 활성화됐는지 조회합니다.
        /// 신디케이트 시스템(ROADMAP_02) 구현 전까지 항상 false 반환.
        /// <br/>
        /// TODO [ROADMAP_02]: SyndicateManager.Instance.IsOperationActive(stockId) 로 교체
        /// </summary>
        public static bool IsSyndicateActive(string stockId)
        {
            // TODO [ROADMAP_02]: SyndicateManager.Instance.IsOperationActive(stockId)
            return false;
        }

        // --------------------------------------------------------
        // 3. 유틸리티 — UI 표시용
        // --------------------------------------------------------

        /// <summary>
        /// [0.0, 1.0] 범위의 정규화된 희소성 강도를 반환합니다.
        /// UI '매수 압력 게이지' 표시용. 초과 공급 시 0.0 반환.
        /// ⚠️ [밸런스 주의] 제곱근 특성상 25% 소진 시 이미 게이지 50%를 표시합니다.
        ///    UI에서 너무 빨리 차오르는 느낌이면 제곱 함수(x²)로 교체 검토.
        /// </summary>
        public static double GetScarcityGauge(StockInstance stock)
        {
            if (stock == null || stock.Data.floatingSupply <= 0) return 0.0;

            double availableRatio = Math.Clamp(
                (double)stock.AvailableVolume / stock.Data.floatingSupply,
                0.0, 1.0);

            return 1.0 - Math.Sqrt(availableRatio); // 0.0(여유) ~ 1.0(고갈)
        }
    }
}
