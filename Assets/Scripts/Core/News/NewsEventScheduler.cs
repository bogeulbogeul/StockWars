using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_12 [기업 뉴스 시스템] 게임 틱 주기별 뉴스 발생 판단 및 확률별 주가 영향력 즉각 주입 코어 스케줄러 매니저.
    /// <para>
    /// 매 6틱(6시간) 주기마다 35% 확률로 임의의 상장 종목 뉴스를 발행하거나, 디버그 강제 트리거를 통해 작동합니다.
    /// </para>
    /// <para>
    /// 발생 확률은 일반(+ 40%), 일반(- 40%), 핵심(+ 9%), 핵심(- 9%), 대형사고(2%) 가중치 룰을 엄격 준수합니다.
    /// </para>
    /// </summary>
    public class NewsEventScheduler : Singleton<NewsEventScheduler>
    {
        protected override void Awake()
        {
            base.Awake();
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        private void OnGameTick(GameTickEvent e)
        {
            int hour = e.CurrentTime.Hour;

            // [6월 고도화] 08:00 ~ 20:00 시간대 제한 및 3시간 정기 틱 주기 판정
            // (08:00, 11:00, 14:00, 17:00, 20:00 시점에만 정량 뉴스 트리거)
            if (hour >= 8 && hour <= 20 && (hour - 8) % 3 == 0)
            {
                TriggerRandomNews();
            }
        }

        /// <summary>
        /// 무작위 상장 종목 중 하나를 선정하여 5대 가중치 확률에 기반한 뉴스 이벤트를 강제 터뜨리고 주가에 전사 반영합니다.
        /// </summary>
        /// <param name="forceDisaster">True일 경우 대형사고(Disaster) 등급을 강제 적용합니다.</param>
        /// <returns>생성된 뉴스 정보 DTO (실패 시 null)</returns>
        public NewsData TriggerRandomNews(bool forceDisaster = false)
        {
            var market = MarketManager.Instance;
            var parser = NewsTemplateParser.Instance;

            if (market == null || parser == null)
            {
                Debug.LogWarning("[NewsEventScheduler] MarketManager 또는 NewsTemplateParser가 활성화되어 있지 않습니다.");
                return null;
            }

            // 1. 현재 거래소에 상장되어 거래 중인 활성 종목 리스트 획득 (대기 풀 종목 차단)
            var listedStocks = market.GetListedStocks();
            if (listedStocks.Count == 0)
            {
                Debug.LogWarning("[NewsEventScheduler] 거래 중인 상장 주식이 존재하지 않아 뉴스를 발생시킬 수 없습니다.");
                return null;
            }

            // [종목 연속 발생 제한 가드 - 6월 고도화]
            // 직전에 뉴스가 터졌던 종목 식별자를 가져와 후보군에서 정교하게 배제
            var wallet = WalletManager.Instance;
            var saveData = wallet?.ActiveSaveData;
            string lastStockId = saveData != null ? saveData.LastNewsStockId : string.Empty;

            var candidateStocks = listedStocks;
            if (listedStocks.Count > 1 && !string.IsNullOrEmpty(lastStockId))
            {
                candidateStocks = listedStocks.Where(s => !s.StockId.Equals(lastStockId, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            // 후보군 중 무작위 1개 종목 초이스
            var selectedStock = candidateStocks[UnityEngine.Random.Range(0, candidateStocks.Count)];
            string stockId = selectedStock.StockId;

            // 선정 완료 후 LastNewsStockId 캐시 락 갱신
            if (saveData != null)
            {
                saveData.LastNewsStockId = stockId;
            }

            // 2. 가중치 룰 주사위 굴리기 (40% / 40% / 9% / 9% / 2%)
            NewsType selectedType = NewsType.NormalPositive;
            if (forceDisaster)
            {
                selectedType = NewsType.Disaster;
            }
            else
            {
                float probabilityRoll = UnityEngine.Random.Range(0f, 100f);
                if (probabilityRoll < 40.0f)
                {
                    selectedType = NewsType.NormalPositive;
                }
                else if (probabilityRoll < 80.0f)
                {
                    selectedType = NewsType.NormalNegative;
                }
                else if (probabilityRoll < 89.0f)
                {
                    selectedType = NewsType.CorePositive;
                }
                else if (probabilityRoll < 98.0f)
                {
                    selectedType = NewsType.CoreNegative;
                }
                else
                {
                    selectedType = NewsType.Disaster;
                }
            }

            // 3. Parser로부터 해당 종목/타입의 템플릿 목록 가져오기
            var templates = parser.GetNewsTemplates(stockId, selectedType);
            if (templates.Count == 0)
            {
                // [Fail-safe] 사용자님이 입력하지 않은 대기 주식이 상장된 예외적인 경우를 위한 동적 폴백 템플릿 생성
                string fallbackHeadline = $"[속보] {selectedStock.Data.companyName}, 새로운 경영 모멘텀 및 사업 전략 발표 추진";
                float fallbackImpact = selectedType switch
                {
                    NewsType.NormalPositive => 3.5f,
                    NewsType.NormalNegative => -3.0f,
                    NewsType.CorePositive => 20.0f,
                    NewsType.CoreNegative => -18.0f,
                    _ => -92.0f
                };

                NewsData fallbackData = new NewsData
                {
                    StockId = stockId,
                    Type = selectedType,
                    Headline = fallbackHeadline,
                    ImpactPercentage = fallbackImpact
                };
                templates.Add(fallbackData);
            }

            // 템플릿 중 하나 초이스
            var chosenTemplate = templates[UnityEngine.Random.Range(0, templates.Count)];

            // 4. 주가 미세 오차 변조 적용 (ImpactPercentage +- 0.5% 오차 편차 반영)
            float variance = UnityEngine.Random.Range(-0.5f, 0.5f);
            float finalImpact = chosenTemplate.ImpactPercentage + variance;

            // 대형사고일 경우 주가 영향력이 -100%를 초과하여 주가가 마이너스가 되지 않도록 엄밀히 한계 가드
            if (chosenTemplate.Type == NewsType.Disaster)
            {
                finalImpact = Math.Max(-99.9f, finalImpact);
            }

            // 5. 런타임 실시간 주가 변동 전사 적용
            long oldPrice = selectedStock.CurrentPrice;
            long newPrice = (long)Math.Round(oldPrice * (1.0 + (finalImpact / 100.0)));
            newPrice = Math.Max(1, newPrice); // 주가 하한 마지노선 1G 강제 보장

            selectedStock.CurrentPrice = newPrice;

            // 최고/최저가 및 ATH 피크 갱신
            if (newPrice > selectedStock.PeakPrice) selectedStock.PeakPrice = newPrice;
            if (newPrice > selectedStock.DailyHigh) selectedStock.DailyHigh = newPrice;
            if (newPrice < selectedStock.DailyLow) selectedStock.DailyLow = newPrice;

            selectedStock.AddPriceToHistory(newPrice);

            Debug.Log($"[NewsEventScheduler] 📢 [NEWS EVENT] {stockId} 터짐! [{selectedType}] " +
                      $"'{chosenTemplate.Headline}' (변동률: {finalImpact:F2}%) - 주가: {oldPrice}G ➡️ {newPrice}G");

            // 6. 전역 배포용 뉴스 발행 이벤트 전파 (UI 및 시뮬레이터 연동)
            EventBus.Publish(new NewsPublishedEvent
            {
                StockId = stockId,
                CompanyName = selectedStock.Data.companyName,
                Type = selectedType,
                Headline = chosenTemplate.Headline,
                ImpactPercentage = finalImpact,
                OldPrice = oldPrice,
                NewPrice = newPrice
            });

            return chosenTemplate;
        }

        #if UNITY_EDITOR || DEVELOPMENT_BUILD || UNITY_INCLUDE_TESTS
        /// <summary>
        /// 유닛 테스트 환경에서 틱 발생 상황 및 시간대 룰을 정밀 제어 모사하기 위한 테스트 헬퍼 API.
        /// </summary>
        public void ProcessTickForTest(DateTime mockTime)
        {
            OnGameTick(new GameTickEvent { CurrentTime = mockTime });
        }
        #endif
    }

    #region Event
    /// <summary>
    /// 전역에 기업 뉴스가 공식 발행되고 실시간 주가에 적용되었음을 알리는 방송 이벤트.
    /// </summary>
    public struct NewsPublishedEvent
    {
        public string StockId;
        public string CompanyName;
        public NewsType Type;
        public string Headline;
        public float ImpactPercentage;
        public long OldPrice;
        public long NewPrice;
    }
    #endregion
}
