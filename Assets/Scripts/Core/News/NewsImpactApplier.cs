using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_12 [기업 뉴스 시스템] 기업 뉴스 발생 시 실시간 주가 변동 여진(Drift Bias)을 
    /// PriceEngine에 공급하고 틱 단위 수명을 영속적으로 관리하는 뉴스 영향력 물리 연산부.
    /// </summary>
    public class NewsImpactApplier : Singleton<NewsImpactApplier>
    {
        protected override void Awake()
        {
            base.Awake();
            
            // 뉴스 발행 이벤트 및 게임 틱 이벤트를 구독하여 물리 영향력을 적용합니다.
            EventBus.Subscribe<NewsPublishedEvent>(OnNewsPublished);
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<NewsPublishedEvent>(OnNewsPublished);
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        /// <summary>
        /// 뉴스가 발행되었을 때 실시간 여파(Drift) 물리 인스턴스를 세이브 데이터에 주입합니다.
        /// </summary>
        private void OnNewsPublished(NewsPublishedEvent e)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            // 1. 뉴스 중요 등급에 비례한 지속 시간(Ticks) 산정
            // Disaster: 72시간, Core: 48시간, Normal: 24시간
            int durationTicks = e.Type switch
            {
                NewsType.Disaster => 72,
                NewsType.CorePositive or NewsType.CoreNegative => 48,
                NewsType.NormalPositive or NewsType.NormalNegative => 24,
                _ => 24
            };

            // 2. 틱당 반영할 바이어스(BiasPerTick) 산출
            // 뉴스 1회성 충격량(ImpactPercentage)의 30%를 잔여 틱 동안 점진적으로 공급
            // deltaRatio에 직접 반영되므로 백분율(/ 100.0) 스케일링 적용
            double totalImpactRate = e.ImpactPercentage / 100.0;
            double biasPerTick = (totalImpactRate * 0.30) / durationTicks;

            var newImpact = new NewsImpactInstance
            {
                StockId = e.StockId,
                Type = e.Type,
                Headline = e.Headline,
                RemainingTicks = durationTicks,
                BiasPerTick = biasPerTick
            };

            wallet.ActiveSaveData.ActiveNewsImpacts.Add(newImpact);

            Debug.Log($"[NewsImpactApplier] ★ 뉴스 여진(Drift Bias) 주입: {e.StockId} | " +
                      $"지속시간: {durationTicks}틱 | 틱당 변동 가산: +{biasPerTick * 100.0:F4}%");
        }

        /// <summary>
        /// 매 틱마다 잔류 중인 뉴스 영향력의 수명을 깎고 만료 시 안전 청소합니다.
        /// </summary>
        private void OnGameTick(GameTickEvent e)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var activeImpacts = wallet.ActiveSaveData.ActiveNewsImpacts;
            if (activeImpacts == null || activeImpacts.Count == 0) return;

            for (int i = activeImpacts.Count - 1; i >= 0; i--)
            {
                var impact = activeImpacts[i];
                impact.RemainingTicks--;

                if (impact.RemainingTicks <= 0)
                {
                    Debug.Log($"[NewsImpactApplier] 뉴스 여진 만료 소멸: {impact.StockId} - '{impact.Headline}'");
                    activeImpacts.RemoveAt(i);
                }
            }
        }

        /// <summary>
        /// 특정 종목에 결려 있는 모든 활성 뉴스들의 틱당 바이어스 총합을 계산하여 PriceEngine에 전달합니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <returns>PriceEngine의 deltaRatio에 가산할 합산 바이어스</returns>
        public double GetNewsBias(string stockId)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return 0.0;

            var activeImpacts = wallet.ActiveSaveData.ActiveNewsImpacts;
            if (activeImpacts == null || activeImpacts.Count == 0) return 0.0;

            double totalBias = 0.0;
            foreach (var impact in activeImpacts)
            {
                if (impact.StockId.Equals(stockId, StringComparison.OrdinalIgnoreCase))
                {
                    totalBias += impact.BiasPerTick;
                }
            }

            return totalBias;
        }
    }
}
