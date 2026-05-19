using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace StockWars.Core
{
    /// <summary>
    /// 마스터 저장 데이터 스키마 (DTO)
    /// </summary>
    [Serializable]
    public class SaveDataDTO
    {
        // 0. 버전 정보 (마이그레이션용)
        public string AppVersion { get; set; } = "1.0.0";

        // 1. 기본 정보 (계좌 및 자산)
        public long Gold { get; set; } = GlobalConstants.INITIAL_SEED_MONEY;
        
        // 2. 포트폴리오 (보유 주식)
        // Key: StockId, Value: Holdings
        public Dictionary<string, StockHoldingsDTO> Portfolio { get; set; } = new Dictionary<string, StockHoldingsDTO>();
        
        // 3. 수배 상태
        public WantedStatus WantedStatus { get; set; } = WantedStatus.Normal;
        
        // 4. 플레이어 스탯 (CORE_GDD_06 이중 스탯 시스템)
        public UserStats Stats { get; set; } = new UserStats();
        
        // 5. 기타 상태 (레벨, 명성 등)
        public int PlayerLevel { get; set; } = 1;
        public int AvailableStatPoints { get; set; } // 투자 가능한 스탯 포인트
        public long CumulativeTradingVolume { get; set; } // 누적 거래액 (레벨업 조건)
        public ReputationGrade Reputation { get; set; } = ReputationGrade.F;
    }

    /// <summary>
    /// 보유 주식 정보
    /// </summary>
    [Serializable]
    public class StockHoldingsDTO
    {
        public string StockId { get; set; }
        public int Quantity { get; set; }
        public double AveragePurchasePrice { get; set; }
    }

    /// <summary>
    /// CORE_GDD_06 이중 스탯 시스템
    /// </summary>
    [Serializable]
    public struct UserStats
    {
        // Base Blocks: 캐릭터 레벨업으로 획득 (최대 5)
        public int BaseAnalysisLv;   // 분석력
        public int BaseNegotiationLv; // 협상력
        public int BaseTradingLv;     // 운용력
        public int BaseRecoveryLv;    // 회복력

        // Bonus Fragments: 서적 정독, 가구 세트, 세미나 등으로 무제한 누적
        public float BonusAnalysisVal;
        public float BonusNegotiationVal;
        public float BonusTradingVal;
        public float BonusRecoveryVal;
    }
}
