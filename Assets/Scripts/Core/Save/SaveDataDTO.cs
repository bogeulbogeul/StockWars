using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine.Scripting;
using static StockWars.Core.RumorGenerator;

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
        public int DailyJobsUsed { get; set; } = 0;                                   // 당일 사용한 노동 횟수
        public DateTime LastJobResetTimeUtc { get; set; } = DateTime.MinValue;         // 마지막 노동 초기화 일시
        public int TotalJobsCompleted { get; set; } = 0;                               // 누적 알바 완료 횟수 (위탁 효율 해금 조건: 100회)

        // 5.2. 찌라시 인벤토리 (MOD_GDD_04)
        public List<RumorInstance> RumorInventory { get; set; } = new List<RumorInstance>(); // 보유 중인 찌라시 목록
        
        // 5.3. 찌라시 시장 영향(Drift) 엔진용 24시간 활성화 목록 (M200)
        public List<ActiveMarketRumor> ActiveMarketRumors { get; set; } = new List<ActiveMarketRumor>();
        
        // 5.4. 기업 뉴스 시장 영향 엔진용 활성화 목록 (253번)
        private List<NewsImpactInstance> _activeNewsImpacts = new();
        public List<NewsImpactInstance> ActiveNewsImpacts
        {
            get => _activeNewsImpacts ??= new();
            set => _activeNewsImpacts = value;
        }
        
        // 6. 금융 정산 상태
        public DateTime LastProcessedSettlementTime { get; set; }

        // 7. 데모 특전 정보
        public bool IsDemoVeteran { get; set; }
        
        // 7.1. 안나의 무이자 웰컴 기프트 수령 플래그 (CORE_GDD_04)
        public bool IsAnnaWelcomeGiftClaimed { get; set; } = false;

        // 7.1.5. 안나 친밀도 / 신뢰도 스코어 (M216 복원 시스템 연동용)
        public int AnnaTrust { get; set; } = 0;

        // 7.2. 웰컴 스타터팩 수령 플래그 (CORE_GDD_08)
        public bool IsStarterPackClaimed { get; set; } = false;

        // 8. 시장 전체 영속 데이터 (96종 대응)
        public Dictionary<string, StockStateDTO> MarketState { get; set; } = new Dictionary<string, StockStateDTO>();

        // 9. RNG 시드 (세션 재현성 보장 — 0이면 신규 시드 자동 할당)
        public int RngGlobalSeed { get; set; } = 0;

        // 10. 아바타 커스터마이징 정보 (CORE_GDD_08)
        public string Gender { get; set; } = "Male";
        public string SkinTone { get; set; } = "Fair";
        public string HairStyle { get; set; } = "Style1";

        private Dictionary<string, string> _equippedApparel = new();
        
        /// <summary>
        /// 장착된 의상 리스트. Newtonsoft.Json의 enum 키 직렬화 예외 방지를 위해 string 키를 사용합니다.
        /// </summary>
        public Dictionary<string, string> EquippedApparel
        {
            get => _equippedApparel ??= new();
            set => _equippedApparel = value;
        }

        // 10.1. 소유 가구 및 의상 인벤토리 (CORE_GDD_08, MOD_GDD_03)
        private List<string> _ownedFurnitureIds = new();
        public List<string> OwnedFurnitureIds
        {
            get => _ownedFurnitureIds ??= new();
            set => _ownedFurnitureIds = value;
        }

        private List<string> _ownedApparelIds = new();
        public List<string> OwnedApparelIds
        {
            get => _ownedApparelIds ??= new();
            set => _ownedApparelIds = value;
        }

        private List<string> _ownedConsumableIds = new();
        public List<string> OwnedConsumableIds
        {
            get => _ownedConsumableIds ??= new();
            set => _ownedConsumableIds = value;
        }

        // 10.3. 자산 압류 유예 및 통보 상태 (CORE_GDD_04, MOD_GDD_11)
        public DateTime? SeizureGracePeriodExpiryTimeUtc { get; set; } = null;
        public bool IsSeizureWarningMailSent { get; set; } = false;

        // 10.4. 스마트폰 메일 보관함 (MOD_GDD_11)
        private List<MailInstance> _mails = new();
        public List<MailInstance> Mails
        {
            get => _mails ??= new();
            set => _mails = value;
        }

        // 10.2. 전역 거래 일지 세이브 데이터 (CORE_GDD_02, CORE_GDD_08)
        private List<TradeLogEntry> _tradeLogs = new();
        public List<TradeLogEntry> TradeLogs
        {
            get => _tradeLogs ??= new();
            set => _tradeLogs = value;
        }
    }

    /// <summary>
    /// 개별 매수/매도 거래 체결 일지 기록 엔트리 구조체
    /// </summary>
    [Serializable]
    [Preserve]
    public class TradeLogEntry
    {
        public string TimestampUtc { get; set; } = string.Empty;
        public string StockId { get; set; } = string.Empty;
        public string StockName { get; set; } = string.Empty;
        public bool IsBuy { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
        public long Fee { get; set; }
        public long TotalAmount { get; set; }
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

    /// <summary>
    /// 시장에 영향을 미치고 있는 활성화된 찌라시 데이터.
    /// 세이브/로드 시에도 시장 가격(PriceEngine) 유도(Drift) 영향력과 오보 방향을 유지하기 위해 별도 분리 저장.
    /// </summary>
    [Serializable]
    [Preserve]
    public class ActiveMarketRumor
    {
        public string StockId;
        public RumorGenerator.RumorType RumorType;
        public DateTime AcquiredAtUtc;
        public double TargetImpactRate; // e.g. 0.05 to 0.15 (5% ~ 15%)
        public bool IsMisinformation;   // 5% 확률의 오보 여부 (오보 시 가격 반대로 유도)
    }

    /// <summary>
    /// MOD_GDD_12 기업 뉴스 발생에 따른 런타임 실시간 주가 바이어스 영향력 세이브 직렬화 데이터.
    /// </summary>
    [Serializable]
    [Preserve]
    public class NewsImpactInstance
    {
        public string StockId;
        public NewsType Type;
        public string Headline;
        public int RemainingTicks; // 잔여 지속 틱 수 (예: 24 ~ 72틱)
        public double BiasPerTick; // 틱당 deltaRatio에 추가 가산할 영향력
    }
}
