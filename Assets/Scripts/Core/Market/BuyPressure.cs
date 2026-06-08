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
    /// </summary>
    public static class BuyPressure
    {
        // --------------------------------------------------------
        // 1. 밸런스 상수
        // --------------------------------------------------------

        /// <summary>GDD 3.1: 완전 고갈 시 주간 최대 매수 압력 (+15%)</summary>
        private const double MAX_WEEKLY_PRESSURE = 0.15;

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
