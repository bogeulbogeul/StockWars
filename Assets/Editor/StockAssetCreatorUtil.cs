using UnityEditor;
using UnityEngine;
using StockWars.Core;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// StockDataSO 에셋 생성 스크립트(016~019)에서 공통으로 사용하는 유틸리티.
    /// - OUTPUT_PATH : 에셋 저장 경로 단일 관리
    /// - StockProfile : 에셋 생성용 데이터 구조체
    /// - EnsureFolder : 출력 폴더 보장
    /// - CreateAsset  : 중복 안전 에셋 생성 + 정밀도 안전 floatingSupply 계산
    /// </summary>
    public static class StockAssetCreatorUtil
    {
        // ── 경로 상수 (여기 한 곳만 수정하면 016~019 전체 반영) ──────────────
        public const string OUTPUT_PATH = "Assets/Resources/Stocks";

        /// <summary>
        /// 에셋 저장 폴더가 없으면 생성합니다.
        /// </summary>
        public static void EnsureFolder()
        {
            if (AssetDatabase.IsValidFolder(OUTPUT_PATH)) return;

            if (!AssetDatabase.IsValidFolder("Assets/Resources"))
                AssetDatabase.CreateFolder("Assets", "Resources");

            AssetDatabase.CreateFolder("Assets/Resources", "Stocks");
            Debug.Log($"[StockAssetCreator] 폴더 생성: {OUTPUT_PATH}");
        }

        /// <summary>
        /// StockDataSO 에셋을 생성합니다.
        /// - 이미 존재하는 에셋은 건너뜁니다(덮어쓰지 않음).
        /// - 중복 판단은 AssetDatabase.LoadAssetAtPath 사용(경로 조작 없이 안전).
        /// - floatingSupply는 정수 연산으로 계산하여 float 정밀도 손실을 방지합니다.
        /// </summary>
        /// <param name="p">종목 프로필 데이터</param>
        /// <param name="skipped">건너뜀 카운터 (ref)</param>
        /// <param name="tag">로그 접두사 (예: "[016]")</param>
        /// <returns>신규 생성 시 1, 건너뜀 시 0</returns>
        public static int CreateAsset(StockProfile p, ref int skipped, string tag = "[Stock]")
        {
            string assetPath = $"{OUTPUT_PATH}/{p.stockId}.asset";

            // ✅ Fix ①: AssetDatabase API로 중복 체크 (경로 문자열 조작 없음)
            if (AssetDatabase.LoadAssetAtPath<StockDataSO>(assetPath) != null)
            {
                Debug.LogWarning($"{tag} '{p.stockId}.asset' 이미 존재 → 건너뜀. 덮어쓰려면 기존 파일 삭제 후 재실행하세요.");
                skipped++;
                return 0;
            }

            var so = ScriptableObject.CreateInstance<StockDataSO>();
            so.stockId            = p.stockId;
            so.companyName        = p.companyName;
            so.description        = p.description;
            so.sector             = p.sector;
            so.riskLevel          = p.riskLevel;
            so.totalSupply        = p.totalSupply;
            // ✅ Fix ②: 정수 연산으로 floatingSupply 계산 (float 정밀도 손실 방지)
            so.floatingSupply     = p.totalSupply * 40L / 100L;
            so.listingPrice       = p.listingPrice;
            so.weeklyDividendRate = p.weeklyDividendRate;
            so.volatilityTier     = p.volatilityTier;
            so.isIpoCandidate     = p.isIpoCandidate;

            AssetDatabase.CreateAsset(so, assetPath);
            Debug.Log($"{tag} 생성: {assetPath} ({p.sector} / {p.riskLevel} / {p.volatilityTier})");
            return 1;
        }

        // ── 에셋 생성용 데이터 구조체 (Editor 전용, 016~019 공용) ─────────────
        // ✅ Fix ③④: 중복 구조체 및 중복 상수를 이 파일에 단일화
        public struct StockProfile
        {
            public string         stockId;
            public string         companyName;
            public string         description;
            public StockSector    sector;
            public RiskLevel      riskLevel;
            public long           totalSupply;
            public long           listingPrice;
            public float          weeklyDividendRate;
            public VolatilityTier volatilityTier;
            public bool           isIpoCandidate;
        }
    }
}
