using System;

namespace StockWars.Core
{
    /// <summary>
    /// 변동성 등급별 틱당 가격 변동 파라미터 서비스 (Volatility Tier Service).
    /// <para>
    /// <see cref="VolatilityTier"/> 열거형(C/B/A/S) 각 등급에 대해
    /// 가우시안 노이즈 표준편차와 틱당 최소/최대 변동폭 제한을 제공합니다.
    /// </para>
    ///
    /// <para><b>등급별 파라미터 요약 (1틱 = 1게임시간 기준)</b></para>
    /// <list type="table">
    ///   <listheader>
    ///     <term>등급</term>
    ///     <description>stdDev(틱당) | 틱당 하한 | 틱당 상한 | 설명</description>
    ///   </listheader>
    ///   <item><term>C (우량)</term><description>0.001 | -0.40% | +0.40% | 대형 우량주, 안정적</description></item>
    ///   <item><term>B (중형)</term><description>0.003 | -1.00% | +1.20% | 중형 성장주, 소폭 우상향</description></item>
    ///   <item><term>A (고위험)</term><description>0.008 | -2.50% | +3.00% | 소형주, 뉴스 민감</description></item>
    ///   <item><term>S (초고위험)</term><description>0.015 | -4.00% | +6.00% | 테마주, 단기 폭등 가능</description></item>
    /// </list>
    /// <para>
    /// ⚠️ 위 수치는 1틱 단위 클램프 범위입니다. 168틱(1주) 누적 효과는 복리 특성상
    /// 단순 곱셈과 다르며, 실제 주가 흐름은 RNG와 시장 압력이 혼합된 결과입니다.
    /// </para>
    ///
    /// <para><b>클램프 설계 원칙</b></para>
    /// <list type="bullet">
    ///   <item>상한을 하한보다 크게 설정 → 장기적 우상향 경향 (주식 시장 리얼리즘)</item>
    ///   <item>클램프는 Gaussian 이상치(6σ+)만 차단하여 분포 형태는 유지</item>
    ///   <item>S 등급은 상한이 특히 높아 단기 폭등 연출 가능</item>
    /// </list>
    ///
    /// <para>
    /// PriceEngine의 인라인 <c>GetVolatilityStdDev()</c>를 대체합니다. (Task 025)
    /// </para>
    /// </summary>
    public static class VolatilityTierService
    {
        // --------------------------------------------------------
        // 1. 등급 파라미터 정의 (내부 구조체)
        // --------------------------------------------------------

        private readonly struct TierParams
        {
            /// <summary>가우시안 노이즈 표준편차 (틱당 비율)</summary>
            public readonly double StdDev;

            /// <summary>틱당 최소 변동률 하한 (음수, 최대 하락 제한)</summary>
            public readonly double MinDelta;

            /// <summary>틱당 최대 변동률 상한 (양수, 최대 상승 제한)</summary>
            public readonly double MaxDelta;

            public TierParams(double stdDev, double minDelta, double maxDelta)
            {
                StdDev   = stdDev;
                MinDelta = minDelta;
                MaxDelta = maxDelta;
            }
        }

        // --------------------------------------------------------
        // 2. 등급별 수치 정의 (밸런스 테이블)
        // --------------------------------------------------------

        /// <summary>
        /// C 등급 — 대형 우량주 (Low Volatility)
        /// stdDev 0.1%: 안정적 분포, 극단치 드묾. 틱당 ±0.4% 제한.
        /// </summary>
        private static readonly TierParams ParamsC = new(0.001, -0.004, 0.004);

        /// <summary>
        /// B 등급 — 중형 성장주 (Mid Volatility)
        /// stdDev 0.3%: 적당한 변동. 상한이 하한보다 20% 큼 (우상향 설계).
        /// </summary>
        private static readonly TierParams ParamsB = new(0.003, -0.010, 0.012);

        /// <summary>
        /// A 등급 — 소형 고위험주 (High Volatility)
        /// stdDev 0.8%: 큰 일일 변동. 상한이 하한보다 20% 큼.
        /// ⚠️ [밸런스 주의] 168틱 누적 시 이론상 원금 대부분 소진 가능.
        /// </summary>
        private static readonly TierParams ParamsA = new(0.008, -0.025, 0.030);

        /// <summary>
        /// S 등급 — 초고위험 테마주 (Extreme Volatility)
        /// stdDev 1.5%: 극단적 변동. 상한이 하한의 1.5배 → 단기 폭등 연출.
        /// ⚠️ [밸런스 주의] 단 몇 틱 만에 상장가의 수 배 도달 또는 거의 0 도달 가능.
        /// </summary>
        private static readonly TierParams ParamsS = new(0.015, -0.040, 0.060);

        // --------------------------------------------------------
        // 3. 공개 API
        // --------------------------------------------------------

        /// <summary>
        /// 해당 등급의 가우시안 노이즈 표준편차(틱당 비율)를 반환합니다.
        /// <see cref="PriceEngine"/>에서 <c>RNG_System.NextGaussian()</c> 호출 시 사용합니다.
        /// </summary>
        public static double GetStdDev(VolatilityTier tier)
        {
            return GetParams(tier).StdDev;
        }

        /// <summary>
        /// deltaRatio를 해당 등급의 틱당 최소/최대 변동폭으로 클램프합니다.
        /// 가우시안 이상치(극단값)로 인한 비현실적 폭등/폭락을 방지합니다.
        /// </summary>
        /// <param name="deltaRatio">클램프할 변동률 (합산 전)</param>
        /// <param name="tier">해당 종목의 변동성 등급</param>
        /// <returns>클램프 적용된 변동률</returns>
        public static double ClampDelta(double deltaRatio, VolatilityTier tier)
        {
            var p = GetParams(tier);
            return Math.Clamp(deltaRatio, p.MinDelta, p.MaxDelta);
        }

        /// <summary>
        /// 해당 등급의 틱당 [최소, 최대] 변동폭 범위를 반환합니다.
        /// UI 게이지 또는 종목 정보창 표시용.
        /// </summary>
        public static (double min, double max) GetDeltaRange(VolatilityTier tier)
        {
            var p = GetParams(tier);
            return (p.MinDelta, p.MaxDelta);
        }

        // --------------------------------------------------------
        // 4. 내부 헬퍼
        // --------------------------------------------------------

        private static TierParams GetParams(VolatilityTier tier)
        {
            return tier switch
            {
                VolatilityTier.C => ParamsC,
                VolatilityTier.B => ParamsB,
                VolatilityTier.A => ParamsA,
                VolatilityTier.S => ParamsS,
                _                => ParamsB  // 알 수 없는 등급: 중형 기준 폴백
            };
        }
    }
}
