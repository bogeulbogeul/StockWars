using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// News.csv로부터 로드된 3대 시범 종목 뉴스 템플릿의 파싱 무결성과 
    /// RFC 4180 따옴표 콤마 가드 논리 정합성을 검증하는 유닛 테스트 컴포넌트.
    /// </summary>
    public class NewsTemplateParserTest : MonoBehaviour
    {
        [Header("Test Configuration")]
        [Tooltip("True일 경우 시작 시 뉴스 템플릿 파서 검증 테스트를 즉시 자동 구동합니다.")]
        public bool runTestOnStart = true;

        [SerializeField, ReadOnlyDisplay]
        private string testResultStatus = "Not Run";

        private void Start()
        {
            if (runTestOnStart)
            {
                RunParserTest();
            }
        }

        /// <summary>
        /// NewsTemplateParser의 데이터 안전 로딩 및 콤마 파싱 손실 복원 논리를 전수 검증합니다.
        /// </summary>
        public void RunParserTest()
        {
            Debug.Log("[NewsTemplateParserTest] ===== STARTING NEWS TEMPLATE PARSER INTEGRITY TEST =====");
            testResultStatus = "Running...";

            try
            {
                var parser = NewsTemplateParser.Instance;
                if (parser == null)
                {
                    throw new Exception("NewsTemplateParser Instance is not initialized on Singleton!");
                }

                // 1. 강제 CSV 수동 재로딩 및 파싱 수행
                parser.LoadAndParseNewsCSV();

                // 2. 전체 뉴스 템플릿 수량 검증 (시범 3종목 * 5대 등급 = 정확히 15개)
                var allTemplates = parser.GetAllTemplates();
                int totalCount = allTemplates.Count;
                Debug.Log($"[NewsTemplateParserTest] [Step 1] Total parsed news templates count: {totalCount}");
                if (totalCount != 15)
                {
                    throw new Exception($"Expected exactly 15 templates parsed from News.csv, but got {totalCount}!");
                }

                // 3. 콤마 보존 정합성 검증 (헤드라인 내부 콤마 유실 여부 검증)
                // 검증 타겟: CLOUDBERRY의 Disaster 뉴스 "[긴급] 고객 정보 1억 건 무단 유출... 당국, '영업 정지' 및 파산 검토"
                var cbDisasterList = parser.GetNewsTemplates("CLOUDBERRY", NewsType.Disaster);
                if (cbDisasterList.Count != 1)
                {
                    throw new Exception("CLOUDBERRY Disaster news template count is not 1.");
                }

                string cbDisasterHeadline = cbDisasterList[0].Headline;
                float cbDisasterImpact = cbDisasterList[0].ImpactPercentage;
                Debug.Log($"[NewsTemplateParserTest] [Step 2] CLOUDBERRY Disaster Headline: '{cbDisasterHeadline}' (Impact: {cbDisasterImpact}%)");

                if (!cbDisasterHeadline.Contains("당국,"))
                {
                    throw new Exception("Headline inner comma was parsed incorrectly and split! Text was truncated.");
                }

                if (cbDisasterImpact != -95.0f)
                {
                    throw new Exception($"Impact percentage parsing failed. Expected -95.0 but got {cbDisasterImpact}!");
                }

                // 4. 종목별 5종 등급 구색 검증
                string[] targetStocks = { "CLOUDBERRY", "STARDUST", "FORESTLAB" };
                foreach (string stockId in targetStocks)
                {
                    var stockTemplates = parser.GetNewsTemplatesForStock(stockId);
                    Debug.Log($"[NewsTemplateParserTest] [Step 3] '{stockId}' has {stockTemplates.Count} total templates loaded.");
                    if (stockTemplates.Count != 5)
                    {
                        throw new Exception($"Stock '{stockId}' does not have exactly 5 news templates! (Actual: {stockTemplates.Count})");
                    }

                    // 5대 핵심 등급 누락 검사
                    foreach (NewsType type in Enum.GetValues(typeof(NewsType)))
                    {
                        var match = parser.GetNewsTemplates(stockId, type);
                        if (match.Count != 1)
                        {
                            throw new Exception($"Stock '{stockId}' lacks news template for type: '{type}'!");
                        }
                    }
                }

                // 5. 비정상 및 엣지 케이스 조회 가드 검사 (방어 메커니즘 테스트)
                var emptyResult = parser.GetNewsTemplates("UNKNOWN_STOCK", NewsType.NormalPositive);
                if (emptyResult == null || emptyResult.Count != 0)
                {
                    throw new Exception("Unknown stock querying didn't return an empty list gracefully.");
                }

                var nullResult = parser.GetNewsTemplates(null, NewsType.Disaster);
                if (nullResult == null || nullResult.Count != 0)
                {
                    throw new Exception("Null stock querying didn't return an empty list gracefully.");
                }

                testResultStatus = "SUCCESS (15/15 records parsed, CSV comma-escape validated, all 5 categories verified)";
                Debug.Log("[NewsTemplateParserTest] ===== NEWS TEMPLATE PARSER INTEGRITY TEST COMPLETED WITH 100% SUCCESS =====");
            }
            catch (Exception ex)
            {
                testResultStatus = "FAILED: " + ex.Message;
                Debug.LogError($"[NewsTemplateParserTest] ===== NEWS TEMPLATE PARSER INTEGRITY TEST FAILED =====: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
