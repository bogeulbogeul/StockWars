using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 개별 주식 종목의 정적 마스터 속성을 정의하는 ScriptableObject 에셋 스키마.
    /// 기획서에 명시된 72개 기본 상장 종목 및 24개 IPO 대기 종목의 기초 밸런스 데이터를 지정합니다.
    /// </summary>
    [CreateAssetMenu(fileName = "NewStockData", menuName = "StockWars/StockData")]
    public class StockDataSO : ScriptableObject
    {
        [Header("Basic Profile Settings")]
        [Tooltip("종목의 고유 시스템 코드 (영문 식별값, 예: CLOUDBERRY)")]
        public string stockId;

        [Tooltip("게임 화면에 노출될 종목의 실제 한글 명칭 (예: 클라우드 베리)")]
        public string companyName;

        [TextArea(3, 6)]
        [Tooltip("기업 정보 분석 찌라시에 노출될 한글 소개 문장")]
        public string description;

        [Tooltip("소속 산업군 섹터")]
        public StockSector sector;

        [Tooltip("주식 투자 위험도 분류")]
        public RiskLevel riskLevel;

        [Header("Economic & Finance Balance Settings")]
        [Tooltip("해당 기업의 총 발행 주식 수")]
        public long totalSupply;

        [Tooltip("시장 전체에 매물로 거래 가능한 유동 주식 수 (통상 발행량의 40%)")]
        public long floatingSupply;

        [Tooltip("데이원 상장가 또는 초기 상장 기준 가격 (Gold)")]
        public long listingPrice;

        [Range(0f, 1f)]
        [Tooltip("정산 시 보유 수량에 비례하여 누적 지급되는 주간 기본 배당률 (0.03 = 3.0%)")]
        public float weeklyDividendRate;

        [Tooltip("주가 변동 엔진 연산 시 사용될 가중치 변동성 스펙 등급")]
        public VolatilityTier volatilityTier;

        [Header("IPO Reserve Pool Settings")]
        [Tooltip("True일 경우 데이원에 상장되지 않고 대기 IPO 풀(24종)에 등록되어 대기합니다.")]
        public bool isIpoCandidate;
    }
}
