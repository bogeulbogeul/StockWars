using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 시장의 유동성을 공급하고 365일 실시간으로 움직이는 생동감 넘치는 시장을 시뮬레이션하는 시스템 백그라운드 트레이더 봇.
    /// <para>
    /// <b>[세계관 표준 동작 원칙]</b>
    /// <list type="bullet">
    ///   <item><b>무수수료 및 무제약 특성</b>: 고스트 트레이더는 물리적 장소나 디바이스를 가진 유저가 아닌 시스템 코어이므로, 실제 수수료를 지불하거나 공간적 제약을 받지 않고 가용 수량(AvailableVolume)을 직접 제어합니다.</item>
    ///   <item><b>로그상 완벽한 위장(Deception)</b>: 유저가 마켓의 실거래자 로그를 관찰할 때 봇임을 눈치채지 못하도록, 체결 로그(MarketTransactionEvent.Brokerage)에만 주문이 발생한 가공 접속 채널("사이퍼 증권 영업점", "개인 모바일 단말기" 등)을 입혀 위장 송출합니다.</item>
    /// </list>
    /// </para>
    /// </summary>
    public class GhostTrader : Singleton<GhostTrader>
    {
        [Header("Ghost Trader Settings")]
        [Tooltip("고스트 트레이더의 자동 매매 활성화 여부")]
        public bool enableGhostTrading = true;

        [Tooltip("상수 - 시장의 급격한 붕괴를 막기 위한 하방 지지 개시 기준 가격 비율 (상장가의 N% 미만 도달 시)")]
        [Range(0.1f, 0.9f)]
        public float supportTriggerRatio = 0.7f;

        // 거래원 위장을 위한 주문 접속 채널 정보 (단일 시장 서버로 전송되는 접속 장소/매체)
        private static readonly string[] AnonymousBrokers = new[]
        {
            "사이퍼 증권 영업점",
            "개인 모바일 단말기",
            "외부 전용 터미널"
        };

        private void OnEnable()
        {
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        /// <summary>
        /// 1초마다 발생하는 GameTickEvent를 수신하여 각 종목별로 독립적인 확률적 체결 시뮬레이션을 수행합니다.
        /// </summary>
        private void OnGameTick(GameTickEvent e)
        {
            if (!enableGhostTrading || MarketManager.Instance == null || RNG_System.Instance == null) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            foreach (var stock in listedStocks)
            {
                SimulateStockTrade(stock);
            }
        }

        /// <summary>
        /// 단일 종목에 대해 변동성 등급 및 가용 물량, 현재 가격 상태를 고려하여 봇 매매를 수행합니다.
        /// </summary>
        private void SimulateStockTrade(StockInstance stock)
        {
            if (stock == null || !stock.IsListed) return;

            // ── 거래 정지(Trading Halt) 또는 정리매매(Liquidation) 기간 동안은 봇 거래 시뮬레이션 중지 ──
            if (stock.IsLiquidationPeriod || (stock.TradingHaltEndTimeUtc.HasValue && DateTime.UtcNow < stock.TradingHaltEndTimeUtc.Value))
            {
                return;
            }

            string stockId = stock.StockId;
            VolatilityTier tier = stock.Data.volatilityTier;

            // 1. 변동성 등급별 틱당 매매 체결 발생 확률 (S = 40%, A = 30%, B = 20%, C = 10%)
            double tradeChance = tier switch
            {
                VolatilityTier.S => 0.40,
                VolatilityTier.A => 0.30,
                VolatilityTier.B => 0.20,
                VolatilityTier.C => 0.10,
                _ => 0.20
            };

            // 체결 주기에 해당하지 않으면 스킵
            if (!RNG_System.Instance.NextChance(stockId, tradeChance)) return;

            // 2. 매수 vs 매도 결정 모델 (기본 50:50)
            double buyProbability = 0.50;

            // ── [주의 1] 하방 지지(Downward Support) 알고리즘 ───────────────────
            // 현재가가 상장가보다 현저히 떨어진 경우 저가 매수(Buy Back) 확률 증가
            long listingPrice = stock.Data.listingPrice;
            float priceRatio = (float)stock.CurrentPrice / listingPrice;

            if (priceRatio < supportTriggerRatio)
            {
                // 30% 이상 폭락 시 매수 성향 65%로 상향
                buyProbability = 0.65;
            }
            if (priceRatio < 0.50f)
            {
                // 50% 이상 반토막 폭락 시 강력한 하방 지지 매수 성향 80%로 상향
                buyProbability = 0.80;
            }

            // ── [주의 2] 유동성 조율(Liquidity Balancing) 알고리즘 ────────────────
            // 가용 주식 수량(AvailableVolume)의 극단적 쏠림 방지
            long floatSupply = stock.Data.floatingSupply;
            float volumeRatio = (float)stock.AvailableVolume / floatSupply;

            if (volumeRatio < 0.20f)
            {
                // 시장 유통 물량이 20% 미만으로 극단적 고갈 상태 → 플레이어가 주식을 살 수 있게 매도 확률 70%로 전환
                buyProbability = 0.30; // 매도 확률 70%
            }
            else if (volumeRatio > 1.20f)
            {
                // 대량 매도로 인해 시장에 공급 과잉(120% 초과) 상태 → 주가 부양을 위해 매수 확률 70%로 전환
                buyProbability = 0.70;
            }

            // 확률 롤을 굴려 최종 행동 결정
            bool isBuy = RNG_System.Instance.NextChance(stockId, buyProbability);

            // 3. 거래 수량 결정 (유동 주식수의 0.01% ~ 0.20% 사이의 미세 체결량)
            double quantityPercentage = tier switch
            {
                VolatilityTier.S => RNG_System.Instance.NextDouble(stockId, 0.0005, 0.0020),
                VolatilityTier.A => RNG_System.Instance.NextDouble(stockId, 0.0003, 0.0015),
                VolatilityTier.B => RNG_System.Instance.NextDouble(stockId, 0.0002, 0.0010),
                VolatilityTier.C => RNG_System.Instance.NextDouble(stockId, 0.0001, 0.0005),
                _ => RNG_System.Instance.NextDouble(stockId, 0.0002, 0.0010)
            };

            long quantity = Math.Max(1L, (long)(floatSupply * quantityPercentage));

            // 4. 가용 물량(AvailableVolume) 변동 및 이벤트 발행
            if (isBuy)
            {
                // 봇의 매수: 시장 가용 물량이 줄어듭니다.
                stock.AvailableVolume = Math.Max(0L, stock.AvailableVolume - quantity);
            }
            else
            {
                // 봇의 매도: 시장 가용 물량이 늘어납니다 (최대 유통 물량의 200%로 클램프 제한하여 오버플로우 방지)
                stock.AvailableVolume = Math.Min(floatSupply * 2L, stock.AvailableVolume + quantity);
            }

            // 5. 익명성 거래원 정보 무작위 생성
            int brokerIndex = RNG_System.Instance.NextInt(stockId, 0, AnonymousBrokers.Length);
            string brokerage = AnonymousBrokers[brokerIndex];

            // 6. 거래 이벤트 전역 발행 (체결창 및 Ticker UI 구독용)
            EventBus.Publish(new MarketTransactionEvent
            {
                StockId = stockId,
                Timestamp = DateTime.Now,
                Price = stock.CurrentPrice,
                Quantity = quantity,
                IsBuy = isBuy,
                Brokerage = brokerage
            });
        }
    }

    /// <summary>
    /// 고스트 트레이더 혹은 유저가 주식을 체결시킬 때 발행되는 시장 공용 거래 이벤트.
    /// </summary>
    public struct MarketTransactionEvent
    {
        /// <summary>거래가 수행된 종목 ID</summary>
        public string StockId;

        /// <summary>거래 체결 시간 (로컬 기준)</summary>
        public DateTime Timestamp;

        /// <summary>체결 가격 (Gold)</summary>
        public long Price;

        /// <summary>체결 수량 (주)</summary>
        public long Quantity;

        /// <summary>거래 구분 (True = 봇이 매수하여 시장 유동성 고갈시킴, False = 봇이 매도하여 시장에 유동성 방출함)</summary>
        public bool IsBuy;

        /// <summary>숨겨진 거래 창구 명칭 (예: "익명 글로벌 트레이더")</summary>
        public string Brokerage;
    }
}
