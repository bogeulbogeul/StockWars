using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_12 [기업 뉴스 시스템] 뉴스 등급 유형 열거형.
    /// </summary>
    public enum NewsType
    {
        NormalPositive, // 일반 양재 뉴스 (+2% ~ +5%)
        NormalNegative, // 일반 음재 뉴스 (-2% ~ -5%)
        CorePositive,   // 핵심 양재 뉴스 (+15% ~ +25%)
        CoreNegative,   // 핵심 음재 뉴스 (-15% ~ -25%)
        Disaster        // 대형 사고 파산 위기 뉴스 (-90% ~ -100%)
    }

    /// <summary>
    /// 단일 뉴스 기사 템플릿 정보 DTO.
    /// </summary>
    [Serializable]
    public class NewsData
    {
        public string StockId;            // 종목 코드 (대문자)
        public NewsType Type;             // 뉴스 성격 등급
        public string Headline;          // 기사 헤드라인 제목
        public float ImpactPercentage;    // 주가에 즉시 줄 영향력 수치 (%)
    }

    /// <summary>
    /// MOD_GDD_12 기업 뉴스 템플릿 CSV(News.csv) 안전 파싱 및 실시간 캐싱 관리 로더.
    /// </summary>
    public class NewsTemplateParser : Singleton<NewsTemplateParser>
    {
        private List<NewsData> _masterNewsList = new List<NewsData>();

        // 종목별 -> 타입별 뉴스 템플릿 고속 매핑 캐시 딕셔너리
        private Dictionary<string, Dictionary<NewsType, List<NewsData>>> _newsCache = 
            new Dictionary<string, Dictionary<NewsType, List<NewsData>>>(StringComparer.OrdinalIgnoreCase);

        protected override void Awake()
        {
            base.Awake();
            LoadAndParseNewsCSV();
        }

        /// <summary>
        /// Unity Resources 폴더로부터 News.csv 파일을 안전하게 읽어와 메모리에 완벽 파싱 캐싱합니다.
        /// </summary>
        public void LoadAndParseNewsCSV()
        {
            _masterNewsList.Clear();
            _newsCache.Clear();

            TextAsset csvAsset = Resources.Load<TextAsset>("News");
            if (csvAsset == null)
            {
                Debug.LogError("[NewsTemplateParser] 'Resources/News.csv' 에셋을 찾을 수 없습니다. 뉴스 이벤트를 기동할 수 없습니다!");
                return;
            }

            using (StringReader reader = new StringReader(csvAsset.text))
            {
                string headerLine = reader.ReadLine(); // 헤더 스킵
                if (headerLine == null)
                {
                    Debug.LogWarning("[NewsTemplateParser] News.csv 파일이 텅 비어 있습니다.");
                    return;
                }

                // RFC 4180 준수: 콤마(,) 기준 분할하되, 쌍따옴표 내의 콤마는 건너뛰도록 정교한 Regex 파서 내장
                // 이 룰은 헤드라인 내 콤마가 포함되어 있을 시 파싱이 쪼개지는 대참사를 완벽 방어합니다.
                Regex csvRegex = new Regex(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

                int lineNumber = 1;
                string line;
                while ((line = reader.ReadLine()) != null)
                {
                    lineNumber++;
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    string[] tokens = csvRegex.Split(line);
                    if (tokens.Length < 4)
                    {
                        Debug.LogWarning($"[NewsTemplateParser] News.csv L{lineNumber} 파싱 스킵 - 필드 부족 (열 개수: {tokens.Length})");
                        continue;
                    }

                    try
                    {
                        string stockId = tokens[0].Trim().ToUpper();
                        string typeStr = tokens[1].Trim();
                        string headline = tokens[2].Trim();
                        string impactStr = tokens[3].Trim();

                        // 1. 헤드라인 감싸고 있는 따옴표 가드 안전 제거
                        if (headline.StartsWith("\"") && headline.EndsWith("\""))
                        {
                            headline = headline.Substring(1, headline.Length - 2);
                        }
                        // 내부스페이스 2중 따옴표 "" 가드 복원
                        headline = headline.Replace("\"\"", "\"");

                        // 2. Enum 타입 파싱
                        if (!Enum.TryParse(typeStr, true, out NewsType newsType))
                        {
                            Debug.LogError($"[NewsTemplateParser] News.csv L{lineNumber} 지원하지 않는 뉴스 유형 감지: {typeStr}");
                            continue;
                        }

                        // 3. 임팩트 비율 수치 파싱
                        if (!float.TryParse(impactStr, out float impactPercentage))
                        {
                            Debug.LogError($"[NewsTemplateParser] News.csv L{lineNumber} 유효하지 않은 임팩트 백분율: {impactStr}");
                            continue;
                        }

                        // 4. NewsData DTO 패키징
                        NewsData newsData = new NewsData
                        {
                            StockId = stockId,
                            Type = newsType,
                            Headline = headline,
                            ImpactPercentage = impactPercentage
                        };

                        _masterNewsList.Add(newsData);

                        // 5. 고속 캐시 딕셔너리 빌딩
                        if (!_newsCache.ContainsKey(stockId))
                        {
                            _newsCache[stockId] = new Dictionary<NewsType, List<NewsData>>();
                        }

                        if (!_newsCache[stockId].ContainsKey(newsType))
                        {
                            _newsCache[stockId][newsType] = new List<NewsData>();
                        }

                        _newsCache[stockId][newsType].Add(newsData);
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"[NewsTemplateParser] News.csv L{lineNumber} 파싱 실패 예외: {ex.Message}");
                    }
                }
            }

            Debug.Log($"[NewsTemplateParser] ★ 'News.csv'로부터 총 {_masterNewsList.Count}개의 기업 뉴스 템플릿을 안전하게 파싱 및 캐싱 완수!");
        }

        /// <summary>
        /// 특정 종목에 속한 마스터 뉴스 템플릿 목록 전체를 안전 복사본 리스트로 반환합니다.
        /// </summary>
        public List<NewsData> GetNewsTemplatesForStock(string stockId)
        {
            if (string.IsNullOrEmpty(stockId)) return new List<NewsData>();
            string key = stockId.ToUpper();

            List<NewsData> result = new List<NewsData>();
            if (_newsCache.TryGetValue(key, out var typeMap))
            {
                foreach (var list in typeMap.Values)
                {
                    result.AddRange(list);
                }
            }
            return result;
        }

        /// <summary>
        /// 특정 종목 및 특정 뉴스 성격 등급(Type)에 매칭되는 템플릿 리스트를 실시간으로 빠르게 획득합니다.
        /// </summary>
        public List<NewsData> GetNewsTemplates(string stockId, NewsType type)
        {
            if (string.IsNullOrEmpty(stockId)) return new List<NewsData>();
            string key = stockId.ToUpper();

            if (_newsCache.TryGetValue(key, out var typeMap))
            {
                if (typeMap.TryGetValue(type, out var list))
                {
                    return new List<NewsData>(list); // 복사본 전달
                }
            }
            return new List<NewsData>();
        }

        /// <summary>
        /// 마스터 파일로부터 파싱된 모든 뉴스 템플릿 목록을 반환합니다.
        /// </summary>
        public List<NewsData> GetAllTemplates()
        {
            return new List<NewsData>(_masterNewsList);
        }
    }
}
