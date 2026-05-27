using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine.Scripting;

namespace StockWars.Core
{
    /// <summary>
    /// 마스터 저장 데이터 스키마 (DTO)
    /// </summary>
    [Serializable]
    [Preserve]
    public class SaveDataDTO
    {
        // 0. 버전 정보 (마이그레이션용)
        public string AppVersion { get; set; } = "1.0.0";

        // 1. 기본 정보 (계좌 및 자산)
        public long Gold { get; set; } = GlobalConstants.INITIAL_SEED_MONEY;
        public long AccumulatedDividends { get; set; } = 0; // 미지급 배당금 누적액
        public long AccumulatedInterest { get; set; } = 0;  // 누적 이자 누적액
        
        // 1.1. 활성 부채 목록 (CORE_GDD_04)
        public List<DebtKernel> Debts { get; set; } = new List<DebtKernel>();
        
        // 2. 포트폴리오 (보유 주식)
        // Key: StockId, Value: Holdings
        public Dictionary<string, StockHoldingsDTO> Portfolio { get; set; } = new Dictionary<string, StockHoldingsDTO>();
        
        // 3. 수배 상태
        public WantedStatus WantedStatus { get; set; } = WantedStatus.Normal;
        
        // 4. 플레이어 스탯 (CORE_GDD_06 이중 스탯 시스템)
        public UserStats Stats { get; set; } = new UserStats();
        
        // 5. 기타 상태 (레벨, 명성 등)
        public int PlayerLevel { get; set; } = 1;
        public int OfficeLevel { get; set; } = 1; // 오피스 단계 (LV 1~4) (CORE_GDD_07)
        public long GhostTraderVirtualLedger { get; set; } = 0; // 고스트 트레이더의 누적 주간 가상 원장 잔고 (소각 대응) (CORE_GDD_07)
        public int AvailableStatPoints { get; set; } // 투자 가능한 스탯 포인트
        public long CumulativeTradingVolume { get; set; } // 누적 거래액 (레벨업 조건)
        public ReputationGrade Reputation { get; set; } = ReputationGrade.F;
        public long RenownPoints { get; set; } = 0; // 누적 명성 수치
        public List<string> UnlockedBreakthroughs { get; set; } = new List<string>(); // 달성 완료한 자산 돌파 단계 리스트
        
        // 5.1. 노동(알바) 리셋 상태
        public int DailyJobsUsed { get; set; } = 0; // 당일 사용한 노동 횟수
        public DateTime LastJobResetTimeUtc { get; set; } = DateTime.MinValue; // 마지막 노동 초기화 일시
        
        // 6. 금융 정산 상태
        public DateTime LastProcessedSettlementTime { get; set; }

        // 7. 데모 특전 정보
        public bool IsDemoVeteran { get; set; }
        
        // 7.1. 안나의 무이자 웰컴 기프트 수령 플래그 (CORE_GDD_04)
        public bool IsAnnaWelcomeGiftClaimed { get; set; } = false;

        // 8. 시장 전체 영속 데이터 (96종 대응)
        public Dictionary<string, StockStateDTO> MarketState { get; set; } = new Dictionary<string, StockStateDTO>();

        // 9. RNG 시드 (세션 재현성 보장 — 0이면 신규 시드 자동 할당)
        public int RngGlobalSeed { get; set; } = 0;
    }

    /// <summary>
    /// 개별 주식의 런타임 시장 상태 영속 데이터 DTO
    /// </summary>
    [Serializable]
    [Preserve]
    public class StockStateDTO
    {
        public string StockId { get; set; }
        public long CurrentPrice { get; set; }
        public long AvailableVolume { get; set; }
        public long PeakPrice { get; set; }
        public int SplitCount { get; set; }
        public bool IsListed { get; set; }
        public bool IsIpoReady { get; set; }
        public long DailyHigh { get; set; }
        public long DailyLow { get; set; }
        public List<long> PriceHistory { get; set; } = new List<long>();

        // --- 액면분할 및 상폐 정지 시간 영속 데이터 ---
        public DateTime? BelowOnePercentStartTimeUtc { get; set; }
        public DateTime? TradingHaltEndTimeUtc { get; set; }
        public bool IsLiquidationPeriod { get; set; }
        public DateTime? LiquidationEndTimeUtc { get; set; }
    }

    /// <summary>
    /// 주식 개별 매수 이력 정보 (72시간 배당 판정용)
    /// </summary>
    [Serializable]
    [Preserve]
    public class PurchaseChunkDTO
    {
        public int Quantity { get; set; }
        public DateTime PurchaseTimeUtc { get; set; }
        public double PurchasePrice { get; set; }
    }

    /// <summary>
    /// 보유 주식 정보
    /// </summary>
    [Serializable]
    [Preserve]
    public class StockHoldingsDTO
    {
        public string StockId { get; set; }
        public int Quantity { get; set; }
        public double AveragePurchasePrice { get; set; }
        public List<PurchaseChunkDTO> PurchaseChunks { get; set; } = new List<PurchaseChunkDTO>();
    }

    /// <summary>
    /// CORE_GDD_06 이중 스탯 시스템
    /// </summary>
    [Serializable]
    [Preserve]
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
