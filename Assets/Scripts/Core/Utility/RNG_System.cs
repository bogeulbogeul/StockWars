using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 시드 기반 의사 난수 생성기 (Seeded Pseudo-Random Number Generator).
    /// 주가 변동 엔진의 모든 랜덤 연산에 사용되며, 종목별로 독립된 시드를 할당하여
    /// 동일 시드 재현 시 100% 동일한 주가 흐름을 보장합니다.
    ///
    /// <para>설계 원칙:</para>
    /// <list type="bullet">
    ///   <item>각 StockId마다 독립 Random 인스턴스를 보유 → 종목 간 상호 오염 없음</item>
    ///   <item>글로벌 시드(GlobalSeed)와 종목 해시를 XOR 조합 → 종목별 고유 시드 생성</item>
    ///   <item>단위 연산 메서드를 노출하여 PriceEngine, TrendEngine 등이 직접 호출</item>
    /// </list>
    /// </summary>
    public class RNG_System : Singleton<RNG_System>
    {
        // --------------------------------------------------------
        // 1. 글로벌 시드 설정
        // --------------------------------------------------------

        /// <summary>
        /// 서버 또는 게임 세션 전체를 관통하는 마스터 시드.
        /// 0이면 자동으로 현재 시각 기반(DateTime.Now.Ticks)으로 초기화됩니다.
        /// </summary>
        [Header("Seed Configuration")]
        [Tooltip("0 = 자동(시간 기반), 그 외 = 고정 시드 (디버그 재현용)")]
        [SerializeField] private int _globalSeedOverride = 0;

        private int _globalSeed;

        // --------------------------------------------------------
        // 2. 종목별 독립 Random 인스턴스 풀
        // --------------------------------------------------------
        
        /// <summary>
        /// StockId(대문자) → 전용 System.Random 인스턴스 매핑 테이블
        /// </summary>
        private System.Collections.Generic.Dictionary<string, System.Random> _stockRngs
            = new System.Collections.Generic.Dictionary<string, System.Random>();

        // --------------------------------------------------------
        // 3. 초기화
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            InitializeGlobalSeed();
        }

        /// <summary>
        /// 글로벌 시드를 확정합니다.
        /// SerializedField 값이 0이면 현재 시간을 시드로 사용합니다.
        /// </summary>
        private void InitializeGlobalSeed()
        {
            _globalSeed = (_globalSeedOverride != 0)
                ? _globalSeedOverride
                : (int)(DateTime.Now.Ticks & 0x7FFFFFFF);

            Debug.Log($"[RNG_System] Global seed initialized: {_globalSeed}" +
                      (_globalSeedOverride != 0 ? " (FIXED/DEBUG MODE)" : " (TIME-BASED)"));
        }

        /// <summary>
        /// 저장된 시드값으로 복원합니다. (세이브 파일 로드 시 호출)
        /// </summary>
        public void RestoreSeed(int savedSeed)
        {
            _globalSeed = savedSeed;
            _stockRngs.Clear(); // 기존 인스턴스 전부 재생성 필요
            Debug.Log($"[RNG_System] Seed restored from save: {_globalSeed}");
        }

        /// <summary>
        /// 현재 활성 글로벌 시드 반환 (세이브 파일 직렬화용)
        /// </summary>
        public int GetCurrentSeed() => _globalSeed;

        // --------------------------------------------------------
        // 4. 종목별 RNG 인스턴스 접근
        // --------------------------------------------------------

        /// <summary>
        /// 특정 종목 전용 Random 인스턴스를 반환합니다.
        /// 최초 호출 시 해당 종목 전용 시드로 인스턴스를 생성합니다.
        /// </summary>
        /// <param name="stockId">종목 고유 ID (대소문자 무관)</param>
        private System.Random GetRng(string stockId)
        {
            string key = stockId.ToUpper();
            if (!_stockRngs.TryGetValue(key, out var rng))
            {
                // 글로벌 시드 XOR 결정론적 FNV-1a 해시 → 종목 고유 시드
                // (string.GetHashCode()는 IL2CPP/Mono/플랫폼에 따라 달라질 수 있어 사용 금지)
                int stockHash = ComputeFnv1aHash(key);
                int stockSeed = _globalSeed ^ stockHash;
                rng = new System.Random(stockSeed);
                _stockRngs[key] = rng;

                Debug.Log($"[RNG_System] RNG instance created for '{key}' with seed {stockSeed}");
            }
            return rng;
        }

        /// <summary>
        /// FNV-1a (32-bit) 결정론적 해시 — 플랫폼(IL2CPP/Mono)/런타임 버전에 관계없이
        /// 항상 동일한 문자열에 대해 동일한 값을 반환합니다.
        /// </summary>
        private static int ComputeFnv1aHash(string text)
        {
            unchecked
            {
                uint hash = 2166136261u; // FNV offset basis
                foreach (char c in text)
                {
                    hash ^= (uint)c;
                    hash *= 16777619u; // FNV prime
                }
                return (int)hash;
            }
        }

        // --------------------------------------------------------
        // 5. 핵심 랜덤 연산 공개 API
        // --------------------------------------------------------

        /// <summary>
        /// 특정 종목에 대해 [min, max) 범위의 랜덤 double을 반환합니다.
        /// PriceEngine, TrendEngine 등에서 호출합니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <param name="min">최솟값 (포함)</param>
        /// <param name="max">최댓값 (미포함)</param>
        public double NextDouble(string stockId, double min = 0.0, double max = 1.0)
        {
            double raw = GetRng(stockId).NextDouble(); // [0.0, 1.0)
            return min + raw * (max - min);
        }

        /// <summary>
        /// 특정 종목에 대해 [min, max) 범위의 랜덤 int를 반환합니다.
        /// </summary>
        public int NextInt(string stockId, int min, int max)
        {
            return GetRng(stockId).Next(min, max);
        }

        /// <summary>
        /// 특정 종목에 대해 [0.0, 1.0) 범위의 정규화된 랜덤 float을 반환합니다.
        /// </summary>
        public float NextFloat(string stockId)
        {
            return (float)GetRng(stockId).NextDouble();
        }

        /// <summary>
        /// 평균 0, 표준편차 1에 가까운 Box-Muller 변환 정규분포 랜덤값을 반환합니다.
        /// 주가 노이즈 생성 시 자연스러운 분포를 만들기 위해 사용합니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <param name="mean">분포 평균 (기본 0)</param>
        /// <param name="stdDev">표준편차 (기본 1)</param>
        public double NextGaussian(string stockId, double mean = 0.0, double stdDev = 1.0)
        {
            var rng = GetRng(stockId);
            // Box-Muller Transform
            double u1 = 1.0 - rng.NextDouble(); // (0, 1] 보정
            double u2 = 1.0 - rng.NextDouble();
            double z = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
            return mean + z * stdDev;
        }

        /// <summary>
        /// probability(0.0~1.0) 확률로 true를 반환합니다.
        /// (예: 0.05 → 5% 확률 true)
        /// </summary>
        public bool NextChance(string stockId, double probability)
        {
            return GetRng(stockId).NextDouble() < probability;
        }

        // --------------------------------------------------------
        // 6. 글로벌(종목 무관) 범용 난수
        // --------------------------------------------------------

        /// <summary>
        /// 종목에 무관한 시스템 레벨 랜덤값 (블랙스완, IPO 추첨 등에 사용)
        /// </summary>
        private readonly System.Random _systemRng = new System.Random();

        public double NextSystemDouble(double min = 0.0, double max = 1.0)
        {
            return min + _systemRng.NextDouble() * (max - min);
        }

        public int NextSystemInt(int min, int max)
        {
            return _systemRng.Next(min, max);
        }
    }
}
