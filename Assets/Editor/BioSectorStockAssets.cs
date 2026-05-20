using UnityEditor;
using UnityEngine;
using StockWars.Core;
using static StockWars.EditorScripts.StockAssetCreatorUtil;

namespace StockWars.EditorScripts
{
    /// <summary>
    /// 바이오 섹터 9종 StockDataSO 에셋 자동 생성기.
    ///   Low  3종: 포레스트 랩, 화이트 메디, 퓨어 사이언스
    ///   Mid  3종: 뉴런 바이오, 진 매트릭스, 셀 이펙트
    ///   High 3종: 라이프 큐어, 바이러스 X, 바이오 싱크
    ///
    /// 사용법: StockWars > Create Stock Assets > Bio Sector 전체 9종
    /// </summary>
    public static class BioSectorStockAssets
    {
        private const string TAG = "[Bio]";

        [MenuItem("StockWars/Create Stock Assets/Bio Sector 전체 9종")]
        public static void Create()
        {
            EnsureFolder();

            int created = 0;
            int skipped = 0;

            // ── Low / VolatilityTier.C ── CMO·진단 우량주 ───────────────────

            // 포레스트 랩: 식물 추출 의약 CMO 안정주
            created += CreateAsset(new StockProfile
            {
                stockId            = "FORESTLAB",
                companyName        = "포레스트 랩",
                description        = "식물 추출물을 활용한 대중적 영양제 및 치료제 생산사. " +
                                     "안정적인 CMO(위탁생산) 수익을 보유한 우량주입니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 800_000L,
                listingPrice       = 650L,
                weeklyDividendRate = 0.025f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 화이트 메디: 국가 지정 백신 위탁 생산 기관
            created += CreateAsset(new StockProfile
            {
                stockId            = "WHITEMEDI",
                companyName        = "화이트 메디",
                description        = "국가 지정 백신 위탁 생산 기관. " +
                                     "전염병 뉴스나 보건 정책 변화에 따라 주가가 견고하게 상승합니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 900_000L,
                listingPrice       = 680L,
                weeklyDividendRate = 0.026f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 퓨어 사이언스: 자가 진단 키트 독점 공급사
            created += CreateAsset(new StockProfile
            {
                stockId            = "PURESCIENCE",
                companyName        = "퓨어 사이언스",
                description        = "자가 진단 키트 및 기초 시약 시장의 독점 공급사. " +
                                     "의료 인프라 확충 소식에 민감하게 반응합니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Low,
                totalSupply        = 1_000_000L,
                listingPrice       = 720L,
                weeklyDividendRate = 0.027f,
                volatilityTier     = VolatilityTier.C,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── Mid / VolatilityTier.B ── 임상 진행 중형 성장주 ─────────────

            // 뉴런 바이오: BCI 칩 임상 진행 기업
            created += CreateAsset(new StockProfile
            {
                stockId            = "NEURONBIO",
                companyName        = "뉴런 바이오",
                description        = "뇌-컴퓨터 인터페이스(BCI) 및 신경계 치료제 연구소. " +
                                     "임상 시험 성공 여부에 따라 주가가 수 배씩 널뛰는 변동성 종목입니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 250_000L,
                listingPrice       = 380L,
                weeklyDividendRate = 0.010f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 진 매트릭스: 유전자 가위 치료 기술 보유사
            created += CreateAsset(new StockProfile
            {
                stockId            = "GENEMATRIX",
                companyName        = "진 매트릭스",
                description        = "개인별 맞춤형 유전자 가위 치료 기술 보유사. " +
                                     "윤리적 규제 이슈와 기술적 돌파구 뉴스 사이에서 주가가 요동칩니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 300_000L,
                listingPrice       = 420L,
                weeklyDividendRate = 0.013f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 셀 이펙트: 줄기세포 치료제 개발사
            created += CreateAsset(new StockProfile
            {
                stockId            = "CELLEFFECT",
                companyName        = "셀 이펙트",
                description        = "손상된 장기를 재생하는 줄기세포 치료제 개발사. " +
                                     "장기적인 연구 결과 발표에 따라 기업 가치가 재평가됩니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.Mid,
                totalSupply        = 350_000L,
                listingPrice       = 450L,
                weeklyDividendRate = 0.014f,
                volatilityTier     = VolatilityTier.B,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // ── High ── 초고위험 신약·인공 장기 테마주 ──────────────────────

            // 라이프 큐어: 희귀병 유전자 편집 초고위험주 — VolatilityTier.A
            created += CreateAsset(new StockProfile
            {
                stockId            = "LIFECURE",
                companyName        = "라이프 큐어",
                description        = "희귀병 유전자 편집 기술 보유사. " +
                                     "성공 시 독점적 이득을 얻으나 실패 시 상장폐지 위기까지 몰리는 초고위험주입니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.High,
                totalSupply        = 100_000L,
                listingPrice       = 120L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 바이러스 X: 변종 바이러스 면역 체계 연구소 — VolatilityTier.A
            created += CreateAsset(new StockProfile
            {
                stockId            = "VIRUSX",
                companyName        = "바이러스 X",
                description        = "변종 바이러스에 대한 실시간 면역 체계 강화 솔루션 연구소. " +
                                     "새로운 질병 발생 시 시장의 관심을 독점하는 테마주입니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.High,
                totalSupply        = 130_000L,
                listingPrice       = 140L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.A,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            // 바이오 싱크: 인공 장기 생체 적합성 연구사 — VolatilityTier.S
            created += CreateAsset(new StockProfile
            {
                stockId            = "BIOSYNC",
                companyName        = "바이오 싱크",
                description        = "인공 장기 및 사이보그 파츠 생체 적합성 연구사. " +
                                     "기술 시연회 성공 여부에 따라 주가가 극단적으로 변합니다.",
                sector             = StockSector.Bio,
                riskLevel          = RiskLevel.High,
                totalSupply        = 110_000L,
                listingPrice       = 110L,
                weeklyDividendRate = 0.000f,
                volatilityTier     = VolatilityTier.S,
                isIpoCandidate     = false
            }, ref skipped, TAG);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string msg = $"바이오 섹터 9종 에셋 생성 결과\n\n✅ 신규 생성: {created}개\n⏭ 이미 존재(건너뜀): {skipped}개\n\n경로: {OUTPUT_PATH}";
            Debug.Log($"{TAG} 완료 — {msg}");
            EditorUtility.DisplayDialog("Bio Sector 에셋 생성 완료", msg, "확인");
        }
    }
}
