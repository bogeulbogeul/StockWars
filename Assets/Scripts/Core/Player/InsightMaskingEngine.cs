using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// [MOD_GDD_04] 찌라시 분석력 레벨에 따른 키워드 마스킹 및 치환 엔진 (186번 태스크).
    /// 플레이어의 분석력 스탯(1~5)에 따라 원문 텍스트의 일정 비율을 █ 문자로 가림 처리합니다.
    /// 가림 우선순위: [종목명] > [변동 방향] > [원인]
    /// 동일한 찌라시에 대해 항상 동일한 마스킹 결과를 보장하기 위해 시드(Seed) 기반 무작위성을 사용합니다.
    /// </summary>
    public static class InsightMaskingEngine
    {
        private const char MASK_CHAR = '█';

        // 데모 버전을 위한 3종목 키워드 매핑 (추후 전체 96종목 확장 시 CSV/SO 연동)
        private static readonly Dictionary<string, HashSet<string>> StockKeywords = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase)
        {
            { "CLOUDBERRY", new HashSet<string> { "클라우드 베리", "파란색 열매", "구름 동네", "베리", "클라우드" } },
            { "STARDUST", new HashSet<string> { "스타더스트", "별가루" } }, // '별' 단음절 오탐지 방지 제거
            { "FORESTLAB", new HashSet<string> { "포레스트 랩", "숲속 연구실", "숲 동네", "포레스트" } }
        };

        // 주가 변동 방향 암시 키워드
        private static readonly HashSet<string> DirectionKeywords = new HashSet<string>
        {
            "대박", "잭팟", "펌핑", "풀매수", "하한가", "폭등", "상폐", "매도", "도망쳐", "끝장", "졸업", "던져", "팔아", "하늘", "뚫는다", "달러로", "긁어모은다", "오른다", "떨어진다" // '사' 단음절 오탐지 방지 제거
        };

        // 주가 변동 원인 암시 키워드
        private static readonly HashSet<string> CauseKeywords = new HashSet<string>
        {
            "수주", "계약", "화재", "불났대", "날아갔어", "박살", "불법 도박", "카지노", "승인", "부작용", "치명적", "위독", "죽었대", "FDA", "공시", "발표", "유출", "해킹"
        };

        /// <summary>
        /// 분석 레벨과 시드 값, 그리고 안나의 신뢰도를 기반으로 텍스트를 마스킹합니다.
        /// </summary>
        /// <param name="rawText">마스킹할 원본 텍스트</param>
        /// <param name="stockId">대상 종목 ID</param>
        /// <param name="analysisLevel">플레이어의 분석 스탯 (1~5)</param>
        /// <param name="seed">고정된 마스킹 결과를 얻기 위한 시드 (보통 찌라시 획득 시각의 Ticks 사용)</param>
        /// <param name="annaTrust">안나의 신뢰도/친밀도 스코어 (M216)</param>
        /// <returns>마스킹 처리된 텍스트</returns>
        public static string ApplyMasking(string rawText, string stockId, int analysisLevel, int seed, int annaTrust)
        {
            if (string.IsNullOrWhiteSpace(rawText)) return rawText;
            if (analysisLevel >= 5) return rawText; // LV5: 0% 마스킹 (완전 해독)

            // 분석력에 따른 목표 마스킹 비율 (단어 기준)
            float targetRatio = analysisLevel switch
            {
                1 => 0.80f, // 80% 가림 (섹터 추론 불가)
                2 => 0.60f, // 60% 가림 (섹터/방향 유추 가능)
                3 => 0.40f, // 40% 가림 (섹터/방향 확정)
                4 => 0.15f, // 15% 가림 (핵심어 1~2개 제외 해독)
                _ => 0.80f
            };

            // M216: 안나의 신뢰도(AnnaTrust)에 따른 마스킹 완화 연동
            // 안나 친밀도 10포인트당 마스킹 가림 비율 5% 영구 완화 (최대 30% 완화)
            float annaBonus = Mathf.Min((annaTrust / 10) * 0.05f, 0.30f);
            targetRatio = Mathf.Max(0f, targetRatio - annaBonus);

            // 시드 기반 System.Random 인스턴스 생성 (동일 시드 = 동일한 마스킹 패턴)
            var rng = new System.Random(seed);

            // 공백 기준으로 단어 청크 분리
            string[] chunks = rawText.Split(new[] { ' ' }, StringSplitOptions.None);
            var chunkTags = new TokenCategory[chunks.Length];

            int totalWords = chunks.Length;
            
            // RoundToInt 대신 CeilToInt를 사용하여 단어가 적은 짧은 문장에서도 최소 1개의 가림을 보장 (LV 4 등급 하한선 보호)
            int wordsToMask = Mathf.CeilToInt(totalWords * targetRatio);

            var stockSet = StockKeywords.TryGetValue(stockId, out var sSet) ? sSet : new HashSet<string>();

            // 1. 카테고리 태깅 (우선순위 역순으로 체크하여 덮어씌움)
            for (int i = 0; i < chunks.Length; i++)
            {
                string chunk = chunks[i];
                chunkTags[i] = TokenCategory.Normal;

                if (ContainsAny(chunk, CauseKeywords)) chunkTags[i] = TokenCategory.Cause;
                if (ContainsAny(chunk, DirectionKeywords)) chunkTags[i] = TokenCategory.Direction;
                if (ContainsAny(chunk, stockSet)) chunkTags[i] = TokenCategory.Stock;
            }

            // 2. 가림 순서 리스트 생성
            // 가림 우선순위: Stock -> Direction -> Cause -> Normal
            var indicesToMask = new List<int>();

            indicesToMask.AddRange(GetShuffledIndices(chunkTags, TokenCategory.Stock, rng));
            indicesToMask.AddRange(GetShuffledIndices(chunkTags, TokenCategory.Direction, rng));
            indicesToMask.AddRange(GetShuffledIndices(chunkTags, TokenCategory.Cause, rng));
            indicesToMask.AddRange(GetShuffledIndices(chunkTags, TokenCategory.Normal, rng));

            // 목표 수량만큼만 추출
            var selectedIndices = new HashSet<int>(indicesToMask.Take(wordsToMask));

            // 3. 재조립 및 마스킹 적용
            for (int i = 0; i < chunks.Length; i++)
            {
                if (selectedIndices.Contains(i))
                {
                    chunks[i] = MaskWord(chunks[i]);
                }
            }

            return string.Join(" ", chunks);
        }

        private static bool ContainsAny(string chunk, HashSet<string> keywords)
        {
            // 간단한 Substring 검색 (한글 조사가 붙어있는 경우를 대비해 Contains 사용)
            foreach (var kw in keywords)
            {
                if (chunk.IndexOf(kw, StringComparison.OrdinalIgnoreCase) >= 0)
                    return true;
            }
            return false;
        }

        private static string MaskWord(string word)
        {
            char[] arr = word.ToCharArray();
            for (int i = 0; i < arr.Length; i++)
            {
                // 문장 부호(.,!? 등)는 보존하고 한글/영문/숫자만 마스킹
                if (char.IsLetterOrDigit(arr[i]))
                {
                    arr[i] = MASK_CHAR;
                }
            }
            return new string(arr);
        }

        private static List<int> GetShuffledIndices(TokenCategory[] tags, TokenCategory targetCat, System.Random rng)
        {
            var list = new List<int>();
            for (int i = 0; i < tags.Length; i++)
            {
                if (tags[i] == targetCat) list.Add(i);
            }

            // Fisher-Yates 셔플 (시드 기반)
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
            return list;
        }

        private enum TokenCategory
        {
            Normal,
            Cause,
            Direction,
            Stock
        }
    }
}
