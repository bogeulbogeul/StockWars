using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_12 기업 뉴스 런타임 여진(Drift) 물리 연산 및 틱 수명 차감 소멸 논리를 
    /// 오차범위 없이 정밀 검사하는 유닛 테스트 컴포넌트.
    /// </summary>
    public class NewsImpactApplierTest : MonoBehaviour
    {
        [Header("Test Configuration")]
        [Tooltip("True일 경우 시작 시 뉴스 물리 엔진 검증 테스트를 즉시 자동 구동합니다.")]
        public bool runTestOnStart = true;

        [SerializeField, ReadOnlyDisplay]
        private string testResultStatus = "Not Run";

        private void Start()
        {
            if (runTestOnStart)
            {
                RunApplierTest();
            }
        }

        /// <summary>
        /// 뉴스 영향력 주입, 틱당 0.125% 바이어스 정밀 산정 및 만료 소멸 시퀀스를 테스트합니다.
        /// </summary>
        public void RunApplierTest()
        {
            Debug.Log("[NewsImpactApplierTest] ===== STARTING NEWS IMPACT APPLIER INTEGRITY TEST =====");
            testResultStatus = "Running...";

            try
            {
                var wallet = WalletManager.Instance;
                var applier = NewsImpactApplier.Instance;

                if (wallet == null || wallet.ActiveSaveData == null || applier == null)
                {
                    throw new Exception("Singletons or active save session is not prepared!");
                }

                var activeImpacts = wallet.ActiveSaveData.ActiveNewsImpacts;
                activeImpacts.Clear(); // 테스트 격리성 보장

                // 1. [여진 주입 테스트] 20% 강도의 핵심 뉴스 발행 이벤트 시뮬레이션
                // 기대치: Core뉴스이므로 48틱 동안 지속, 틱당 바이어스 = (0.20 * 0.3) / 48 = 0.00125
                var testEvent = new NewsPublishedEvent
                {
                    StockId = "CLOUDBERRY",
                    CompanyName = "클라우드 베리",
                    Type = NewsType.CorePositive,
                    Headline = "[단독] 클라우드 베리, 신규 독점 계약 돌풍",
                    ImpactPercentage = 20.0f,
                    OldPrice = 100,
                    NewPrice = 120
                };

                // 이벤트 직접 강제 배포
                EventBus.Publish(testEvent);

                // 2. 가산 결과 데이터 정밀 검증
                if (activeImpacts.Count != 1)
                {
                    throw new Exception("NewsImpactInstance was not injected into ActiveNewsImpacts list!");
                }

                var impact = activeImpacts[0];
                Debug.Log($"[NewsImpactApplierTest] [Step 1] Injected Impact details: StockId={impact.StockId}, Type={impact.Type}, RemainingTicks={impact.RemainingTicks}, BiasPerTick={impact.BiasPerTick}");

                if (impact.StockId != "CLOUDBERRY") throw new Exception("Injected StockId is incorrect.");
                if (impact.RemainingTicks != 48) throw new Exception($"Core News must persist for 48 ticks, but got {impact.RemainingTicks}!");
                
                // float 부동소수점 오차 감안 정밀 대조 (0.00125)
                double expectedBias = (0.20 * 0.3) / 48.0;
                if (Math.Abs(impact.BiasPerTick - expectedBias) > 1e-9)
                {
                    throw new Exception($"BiasPerTick computation mismatch. Expected {expectedBias} but got {impact.BiasPerTick}!");
                }

                // 3. PriceEngine API 연동 정밀 검사
                double computedBias = applier.GetNewsBias("CLOUDBERRY");
                if (Math.Abs(computedBias - expectedBias) > 1e-9)
                {
                    throw new Exception($"GetNewsBias query failed. Expected {expectedBias} but got {computedBias}!");
                }

                // 타 종목 쿼리 시 0G 가드 검사
                double otherStockBias = applier.GetNewsBias("STARDUST");
                if (otherStockBias != 0.0)
                {
                    throw new Exception("GetNewsBias returned non-zero value for non-affected stock.");
                }

                // 4. [틱 감쇠 및 수명 소멸 시퀀스 테스트]
                // 47번의 GameTickEvent를 임의 발생시켰을 때 잔여 틱이 1로 잘 감쇠하는지 확인
                for (int i = 0; i < 47; i++)
                {
                    EventBus.Publish(new GameTickEvent { CurrentTime = DateTime.UtcNow });
                }

                if (impact.RemainingTicks != 1)
                {
                    throw new Exception($"RemainingTicks decay failed. Expected 1 but got {impact.RemainingTicks}!");
                }

                if (activeImpacts.Count != 1)
                {
                    throw new Exception("News impact was prematurely cleared before expiration.");
                }

                // 마지막 48번째 틱 발생 시 완벽 청소 소멸 여부 검증
                EventBus.Publish(new GameTickEvent { CurrentTime = DateTime.UtcNow });

                if (activeImpacts.Count != 0)
                {
                    throw new Exception("Expired news impact was not cleared from ActiveNewsImpacts list!");
                }

                double clearedBias = applier.GetNewsBias("CLOUDBERRY");
                if (clearedBias != 0.0)
                {
                    throw new Exception("GetNewsBias still returns values after expiration.");
                }

                testResultStatus = "SUCCESS (48-tick decay formula and clean expiration validated with 100% precision)";
                Debug.Log("[NewsImpactApplierTest] ===== NEWS IMPACT APPLIER INTEGRITY TEST COMPLETED WITH 100% SUCCESS =====");
            }
            catch (Exception ex)
            {
                testResultStatus = "FAILED: " + ex.Message;
                Debug.LogError($"[NewsImpactApplierTest] ===== NEWS IMPACT APPLIER INTEGRITY TEST FAILED =====: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
