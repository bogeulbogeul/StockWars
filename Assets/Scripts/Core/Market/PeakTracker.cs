using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 전고점(ATH - All Time High) 및 당일 변동폭(최고/최저가)을 실시간으로 추적 및 관리하는 레이어.
    /// EventBus를 통해 가격 변동 및 일차 변경 이벤트를 실시간으로 구독하여 데이터 무결성을 보장합니다.
    /// </summary>
    public class PeakTracker : Singleton<PeakTracker>
    {
        private void OnEnable()
        {
            EventBus.Subscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
            EventBus.Subscribe<GameDayTickEvent>(OnGameDayTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
            EventBus.Unsubscribe<GameDayTickEvent>(OnGameDayTick);
        }

        /// <summary>
        /// 특정 종목의 당일 최고가를 조회합니다.
        /// </summary>
        public long GetDailyHigh(string stockId)
        {
            var stock = MarketManager.Instance?.GetStock(stockId);
            return stock != null ? stock.DailyHigh : 0;
        }

        /// <summary>
        /// 특정 종목의 당일 최저가를 조회합니다.
        /// </summary>
        public long GetDailyLow(string stockId)
        {
            var stock = MarketManager.Instance?.GetStock(stockId);
            return stock != null ? stock.DailyLow : 0;
        }

        /// <summary>
        /// 특정 종목의 전고점(ATH)을 조회합니다.
        /// </summary>
        public long GetATH(string stockId)
        {
            var stock = MarketManager.Instance?.GetStock(stockId);
            return stock != null ? stock.PeakPrice : 0;
        }

        /// <summary>
        /// 실시간 주가 변동 이벤트를 수신하여 전고점 및 당일 최고/최저가를 동적으로 갱신합니다.
        /// </summary>
        private void OnStockPriceUpdated(StockPriceUpdatedEvent e)
        {
            if (MarketManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(e.StockId);
            if (stock == null) return;

            long price = e.NewPrice;

            // 1. ATH(전고점) 실시간 검증 및 갱신
            if (price > stock.PeakPrice)
            {
                stock.PeakPrice = price;
            }

            // 2. 당일 최고가 실시간 갱신
            if (price > stock.DailyHigh)
            {
                stock.DailyHigh = price;
            }

            // 3. 당일 최저가 실시간 갱신
            if (stock.DailyLow == 0 || price < stock.DailyLow)
            {
                stock.DailyLow = price;
            }
        }

        /// <summary>
        /// 자정 틱(GameDayTickEvent) 수신 시 모든 상장 주식의 당일 변동폭을 초기화합니다.
        /// </summary>
        private void OnGameDayTick(GameDayTickEvent e)
        {
            ResetDailyRanges();
        }

        /// <summary>
        /// 모든 상장 주식의 당일 최고/최저가를 현재가 기준으로 리셋합니다.
        /// </summary>
        public void ResetDailyRanges()
        {
            if (MarketManager.Instance == null) return;

            var stocks = MarketManager.Instance.GetListedStocks();
            foreach (var stock in stocks)
            {
                stock.DailyHigh = stock.CurrentPrice;
                stock.DailyLow = stock.CurrentPrice;
            }
            Debug.Log("[PeakTracker] Reset daily highs and lows for all listed stocks to their current prices.");
        }
    }
}
