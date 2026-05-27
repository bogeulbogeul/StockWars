using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    // --------------------------------------------------------
    // 트렌드 방향 열거형
    // --------------------------------------------------------

    /// <summary>현재 종목의 추세 방향</summary>
    public enum TrendDirection
    {
        Uptrend,    // 상승 기조
        Downtrend   // 하락 기조
    }

    // --------------------------------------------------------
    // 종목별 트렌드 상태 (내부 런타임 데이터)
    // --------------------------------------------------------

    /// <summary>
    /// 단일 종목의 현재 추세 상태를 보관하는 런타임 데이터 클래스.
    /// </summary>
    internal class TrendState
    {
        /// <summary>현재 추세 방향</summary>
        public TrendDirection Direction;

        /// <summary>현재 추세가 지속된 틱 수</summary>
        public int TicksInTrend;

        /// <summary>
        /// 추세 강도 [0.0, 1.0].
        /// 추세 전환 직후 RNG로 재결정되며, 높을수록 바이어스가 강합니다.
        /// </summary>
        public double Intensity;
    }

    // --------------------------------------------------------
    // TrendEngine (메인 클래스)
    // --------------------------------------------------------

    /// <summary>
    /// 168시간(7일) 주기 상승/하락 사이클 전환 시스템 (Trend Engine).
    /// <para>
    /// 각 종목은 독립된 <see cref="TrendState"/>를 가지며, 매 틱마다 전환 확률을
    /// 계산하여 자연스러운 주가 사이클을 연출합니다.
    /// </para>
    ///
    /// <para><b>전환 확률 설계</b></para>
    /// <code>
    /// progress        = TicksInTrend / 168           // 사이클 진행률 [0, 1]
    /// switchChance    = progress² × BASE_SWITCH_RATE // 2차 가속: 후반부에 집중
    /// switchChance   *= tierMultiplier               // 고위험 등급일수록 더 자주 전환
    /// </code>
    ///
    /// <para><b>등급별 전환 빈도 배율</b></para>
    /// <list type="table">
    ///   <item><term>C (우량)</term><description>×0.5 — 완만한 사이클, 장기 추세 유지</description></item>
    ///   <item><term>B (중형)</term><description>×0.8 — 표준 사이클</description></item>
    ///   <item><term>A (고위험)</term><description>×1.5 — 잦은 전환, 예측 어려움</description></item>
    ///   <item><term>S (초고위험)</term><description>×2.5 — 매우 잦은 전환, 극단적 변동</description></item>
    /// </list>
    ///
    /// <para><b>바이어스 수치 (틱당, PriceEngine에 합산)</b></para>
    /// <list type="table">
    ///   <item><term>C</term><description>±0.0002 × Intensity</description></item>
    ///   <item><term>B</term><description>±0.0005 × Intensity</description></item>
    ///   <item><term>A</term><description>±0.0010 × Intensity</description></item>
    ///   <item><term>S</term><description>±0.0020 × Intensity</description></item>
    /// </list>
    ///
    /// <para>
    /// TODO [저장 연동]: 현재 트렌드 상태는 세션 재시작 시 초기화됩니다.
    /// 영속성이 필요하다면 <see cref="SaveDataDTO"/>에 TrendStateDict 필드를 추가해야 합니다.
    /// </para>
    /// </summary>
    public class TrendEngine : Singleton<TrendEngine>
    {
        // --------------------------------------------------------
        // 1. 밸런스 상수
        // --------------------------------------------------------

        /// <summary>
        /// 168틱(1주) 사이클 완료 시 틱당 최대 전환 기여 확률.
        /// 이차함수로 누적되므로 실제 최대치는 progress=1.0 시점에만 도달.
        /// ⚠️ [밸런스 주의] 너무 높으면 추세가 너무 자주 뒤집힙니다.
        /// </summary>
        private const double BASE_SWITCH_RATE = 0.12;

        /// <summary>틱당 전환 확률의 절대 상한 (30% 초과 금지)</summary>
        private const double MAX_SWITCH_CHANCE = 0.30;

        /// <summary>트렌드 강도 초기화 최솟값</summary>
        private const double MIN_INTENSITY = 0.3;

        // --------------------------------------------------------
        // 2. 런타임 상태
        // --------------------------------------------------------

        /// <summary>종목 ID → 트렌드 상태 런타임 딕셔너리</summary>
        private readonly Dictionary<string, TrendState> _trends
            = new Dictionary<string, TrendState>();

        // --------------------------------------------------------
        // 3. 초기화 및 이벤트 연결
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
        // 4. 틱 핸들러
        // --------------------------------------------------------

        private void OnGameTick(GameTickEvent e)
        {
            if (MarketManager.Instance == null || RNG_System.Instance == null) return;

            var listed = MarketManager.Instance.GetListedStocks();
            foreach (var stock in listed)
            {
                UpdateTrend(stock);
            }
        }

        // --------------------------------------------------------
        // 5. 트렌드 상태 갱신
        // --------------------------------------------------------

        private void UpdateTrend(StockInstance stock)
        {
            string key = stock.StockId;

            // 최초 접근 시 초기화 (신규 종목 또는 세션 시작 시)
            if (!_trends.TryGetValue(key, out var state))
            {
                state = InitializeTrend(stock);
                _trends[key] = state;
            }

            state.TicksInTrend++;

            // 전환 확률 계산
            double switchChance = ComputeSwitchChance(state.TicksInTrend, stock.Data.volatilityTier);

            // RNG로 전환 여부 결정 (트렌드 전용 키 사용 → 노이즈 RNG와 독립)
            if (RNG_System.Instance.NextChance(key + "_TR", switchChance))
            {
                // 추세 반전
                state.Direction = (state.Direction == TrendDirection.Uptrend)
                    ? TrendDirection.Downtrend
                    : TrendDirection.Uptrend;

                state.TicksInTrend = 0;

                // 새 강도 랜덤 결정 [MIN_INTENSITY, 1.0]
                state.Intensity = RNG_System.Instance.NextDouble(key + "_TR_INT", MIN_INTENSITY, 1.0);

                Debug.Log($"[TrendEngine] {key}: Trend reversed → {state.Direction} (intensity: {state.Intensity:F2})");
            }
        }

        /// <summary>
        /// 종목의 초기 트렌드 상태를 생성합니다.
        /// 시작 방향은 55% 확률로 상승 기조 (시장 우상향 편향 반영).
        /// 시작 틱은 [0, 167] 범위 랜덤 → 모든 종목이 동시에 전환하는 현상 방지.
        /// </summary>
        private TrendState InitializeTrend(StockInstance stock)
        {
            string key = stock.StockId;
            bool isUp = RNG_System.Instance.NextChance(key + "_TR_INIT", 0.55);
            int startTick = RNG_System.Instance.NextInt(key + "_TR_TICK", 0, GlobalConstants.HOURS_PER_WEEK);

            return new TrendState
            {
                Direction    = isUp ? TrendDirection.Uptrend : TrendDirection.Downtrend,
                TicksInTrend = startTick,
                Intensity    = RNG_System.Instance.NextDouble(key + "_TR_INT0", MIN_INTENSITY, 1.0)
            };
        }

        // --------------------------------------------------------
        // 6. 전환 확률 계산
        // --------------------------------------------------------

        /// <summary>
        /// 현재 틱 기준 추세 전환 확률을 반환합니다.
        /// 2차 함수로 증가 → 사이클 후반부에 전환이 집중됩니다.
        /// </summary>
        private static double ComputeSwitchChance(int ticksInTrend, VolatilityTier tier)
        {
            double progress = Math.Min((double)ticksInTrend / GlobalConstants.HOURS_PER_WEEK, 1.0);
            double baseChance = progress * progress * BASE_SWITCH_RATE;

            double multiplier = tier switch
            {
                VolatilityTier.C => 0.5,
                VolatilityTier.B => 0.8,
                VolatilityTier.A => 1.5,
                VolatilityTier.S => 2.5,
                _                => 1.0
            };

            return Math.Min(baseChance * multiplier, MAX_SWITCH_CHANCE);
        }

        // --------------------------------------------------------
        // 7. 공개 API — PriceEngine 연동
        // --------------------------------------------------------

        /// <summary>
        /// 특정 종목의 현재 틱 트렌드 바이어스를 반환합니다.
        /// 양수 = 상승 편향, 음수 = 하락 편향.
        /// PriceEngine의 deltaRatio에 직접 합산됩니다.
        /// </summary>
        public double GetBias(string stockId)
        {
            if (!_trends.TryGetValue(stockId, out var state)) return 0.0;
            if (MarketManager.Instance == null) return 0.0;

            var stock = MarketManager.Instance.GetStock(stockId);
            if (stock == null) return 0.0;

            double magnitude = GetBiasMagnitude(stock.Data.volatilityTier, state.Intensity);
            return (state.Direction == TrendDirection.Uptrend) ? magnitude : -magnitude;
        }

        /// <summary>
        /// 등급 및 강도에 따른 틱당 바이어스 크기를 반환합니다.
        /// ⚠️ [밸런스 주의] 이 값이 크면 추세가 노이즈를 압도하여 주가가 직선으로 움직입니다.
        /// </summary>
        private static double GetBiasMagnitude(VolatilityTier tier, double intensity)
        {
            double baseBias = tier switch
            {
                VolatilityTier.C => 0.0002,
                VolatilityTier.B => 0.0005,
                VolatilityTier.A => 0.0010,
                VolatilityTier.S => 0.0020,
                _                => 0.0005
            };

            return baseBias * intensity;
        }

        // --------------------------------------------------------
        // 8. 유틸리티 — 디버그 및 UI 표시용
        // --------------------------------------------------------

        /// <summary>
        /// 특정 종목의 현재 추세 방향을 반환합니다. UI 표시용.
        /// 상태가 없으면 null 반환.
        /// </summary>
        public TrendDirection? GetDirection(string stockId)
        {
            return _trends.TryGetValue(stockId, out var state) ? state.Direction : (TrendDirection?)null;
        }

        /// <summary>
        /// 특정 종목의 현재 사이클 진행률 [0.0, 1.0]을 반환합니다.
        /// UI '추세 게이지' 표시용.
        /// </summary>
        public double GetCycleProgress(string stockId)
        {
            if (!_trends.TryGetValue(stockId, out var state)) return 0.0;
            return Math.Min((double)state.TicksInTrend / GlobalConstants.HOURS_PER_WEEK, 1.0);
        }
    }
}
