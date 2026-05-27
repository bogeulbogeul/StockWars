using System;
using System.Collections.Generic;

namespace StockWars.Core
{
    /// <summary>
    /// 주간 평탄화 사이사이의 미세한 '노이즈' 가격 변동 연산부 (Price Noise Service).
    /// <para>
    /// CORE_GDD_02 규격에 따라 대형 트렌드나 매수세 등의 결정론적 요인 사이에서
    /// 틱마다 유기적인 잔물결(Micro-fluctuations)을 발생시켜 시장의 생동감을 극대화합니다.
    /// </para>
    /// <para>
    /// 매크로 변동성(VolatilityTierService) 표준편차의 10% 수준의 초미세 표준편차와 클램프 범위를 가집니다.
    /// </para>
    /// </summary>
    public static class PriceNoise
    {
        // --------------------------------------------------------
        // 1. 등급별 미세 노이즈 매개변수 정의 (매크로의 약 10% 수준)
        // --------------------------------------------------------

        private readonly struct MicroNoiseParams
        {
            /// <summary>미세 노이즈용 가우시안 표준편차</summary>
            public readonly double StdDev;

            /// <summary>틱당 미세 노이즈 하한 (음수)</summary>
            public readonly double MinDelta;

            /// <summary>틱당 미세 노이즈 상한 (양수)</summary>
            public readonly double MaxDelta;

            public MicroNoiseParams(double stdDev, double minDelta, double maxDelta)
            {
                StdDev = stdDev;
                MinDelta = minDelta;
                MaxDelta = maxDelta;
            }
        }

        // C 등급 (우량): 매크로 stdDev 0.001 -> 미세 stdDev 0.0001, 클램프 ±0.04%
        private static readonly MicroNoiseParams ParamsC = new(0.0001, -0.0004, 0.0004);

        // B 등급 (중형): 매크로 stdDev 0.003 -> 미세 stdDev 0.0003, 클램프 -0.10% ~ +0.12%
        private static readonly MicroNoiseParams ParamsB = new(0.0003, -0.0010, 0.0012);

        // A 등급 (고위험): 매크로 stdDev 0.008 -> 미세 stdDev 0.0008, 클램프 -0.25% ~ +0.30%
        private static readonly MicroNoiseParams ParamsA = new(0.0008, -0.0025, 0.0030);

        // S 등급 (초고위험): 매크로 stdDev 0.015 -> 미세 stdDev 0.0015, 클램프 -0.40% ~ +0.60%
        private static readonly MicroNoiseParams ParamsS = new(0.0015, -0.0040, 0.0060);

        // --------------------------------------------------------
        // 2. 가비지 방지용 정적 키 캐시 (String Cache)
        // --------------------------------------------------------

        private static readonly Dictionary<string, string> KeyCache = new Dictionary<string, string>();

        // --------------------------------------------------------
        // 3. 공개 API
        // --------------------------------------------------------

        /// <summary>
        /// 종목의 ID와 변동성 등급에 근거하여 틱당 적용될 미세 노이즈 비율을 계산하여 반환합니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <param name="tier">변동성 등급</param>
        /// <returns>최종 합산용 미세 노이즈 변동률 (deltaRatio에 합산)</returns>
        public static double GetMicroNoise(string stockId, VolatilityTier tier)
        {
            if (RNG_System.Instance == null) return 0.0;

            var p = GetParams(tier);

            // 미세 노이즈 전용 RNG 호출 키 가져오기 (캐시를 사용하여 런타임 Alloc 제거)
            string rngKey = GetCachedKey(stockId);

            // 가우시안 미세 노이즈 생성
            double rawNoise = RNG_System.Instance.NextGaussian(rngKey, 0.0, p.StdDev);

            // 미세 범위 내 클램프 적용 후 반환
            return Math.Clamp(rawNoise, p.MinDelta, p.MaxDelta);
        }

        // --------------------------------------------------------
        // 4. 내부 헬퍼
        // --------------------------------------------------------

        private static string GetCachedKey(string stockId)
        {
            if (string.IsNullOrEmpty(stockId)) return string.Empty;

            // 정적 딕셔너리로 키 문자열 캐싱 처리
            if (!KeyCache.TryGetValue(stockId, out var key))
            {
                key = stockId.ToUpper() + "_MICRO_NOISE";
                KeyCache[stockId] = key;
            }
            return key;
        }

        private static MicroNoiseParams GetParams(VolatilityTier tier)
        {
            return tier switch
            {
                VolatilityTier.C => ParamsC,
                VolatilityTier.B => ParamsB,
                VolatilityTier.A => ParamsA,
                VolatilityTier.S => ParamsS,
                _                => ParamsB  // 예외 시 중형 표준 폴백
            };
        }
    }
}
