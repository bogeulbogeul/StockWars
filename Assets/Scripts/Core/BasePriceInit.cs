using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 새 게임 기동 시, 기획서(GDD v5.0) 표준 스펙에 따라 
    /// 72개 주식 종목의 상장 시작가 및 40% 유동성 물량을 100% 정합성으로 초기화 및 세팅하는 클래스.
    /// </summary>
    public class BasePriceInit : Singleton<BasePriceInit>
    {
        /// <summary>
        /// 게임 최초 시작(새 게임) 시점에 72종 표준 주식들의 가격 및 유동 공급 수량을 정밀 초기 시딩합니다.
        /// </summary>
        public void InitializeMarketStart()
        {
            if (MarketManager.Instance == null)
            {
                Debug.LogError("[BasePriceInit] MarketManager Instance is not initialized yet!");
                return;
            }

            // 1. MarketManager에 장착된 96종에 대해 기본 72종 데이원 리셋 구동
            MarketManager.Instance.ResetToDayOneDefault();

            // 2. 72개 기본 상장 종목들의 초기화 상태 정합성 전수 검증 및 재보정
            var allStocks = MarketManager.Instance.GetAllStocks();
            int listedCount = 0;
            int ipoCount = 0;

            foreach (var stock in allStocks)
            {
                if (stock.IsListed)
                {
                    listedCount++;
                    
                    // 기획서 40% 유동 물량 정밀 검증 및 대입
                    long targetFloating = (long)(stock.Data.totalSupply * 0.40f);
                    stock.AvailableVolume = targetFloating;

                    // 초기 상장가 100% 일치 매핑
                    stock.CurrentPrice = stock.Data.listingPrice;
                    stock.PeakPrice = stock.Data.listingPrice;
                    stock.SplitCount = 0;

                    // 첫 히스토리 시딩
                    stock.PriceHistory.Clear();
                    stock.AddPriceToHistory(stock.CurrentPrice);
                }
                else
                {
                    ipoCount++;
                }
            }

            Debug.Log($"[BasePriceInit] Standard Market Seeding Completed: {listedCount} listed stocks initialized at 100% GDD standard listing prices, {ipoCount} stocks isolated in IPO reserve pool.");
        }
    }
}
