namespace StockWars.Core
{
    /// <summary>
    /// 종목 위험도 등급 (Low, Mid, High)
    /// </summary>
    public enum RiskLevel
    {
        Low,
        Mid,
        High
    }

    /// <summary>
    /// 주식 섹터 (종목의 소속 산업군)
    /// </summary>
    public enum StockSector
    {
        IT,             // IT
        Entertainment,  // 엔터테인먼트
        Infrastructure, // 인프라
        Bio,            // 바이오
        Aerospace,      // 항공우주
        Retail,         // 유통
        Energy,         // 에너지
        Finance         // 금융
    }

    /// <summary>
    /// 종목 변동성 등급 (S~C)
    /// </summary>
    public enum VolatilityTier
    {
        C,
        B,
        A,
        S
    }

    /// <summary>
    /// 아이템 및 가구의 희귀도 등급
    /// </summary>
    public enum ItemRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    /// <summary>
    /// NPC의 감정 상태 (표정 애니메이션 및 대사 분기용)
    /// </summary>
    public enum NpcEmotion
    {
        Idle,
        Happy,
        Sad,
        Angry,
        Blush
    }

    /// <summary>
    /// 플레이어의 수배 상태 (적색 수배 및 패널티용)
    /// </summary>
    public enum WantedStatus
    {
        Normal,     // 일반 상태
        Warning,    // 경고 상태 (횡령 등 경미한 범죄)
        RedNotice   // 적색 수배 (계좌 동결 및 NPC 적대화)
    }

    /// <summary>
    /// 사회적 명성 등급 (평판)
    /// </summary>
    public enum ReputationGrade
    {
        F,
        E,
        D,
        C,
        B,
        A,
        S
    }

    /// <summary>
    /// 아바타 꾸미기 파츠 부위
    /// </summary>
    public enum AvatarPart
    {
        Hair,
        Face,
        Top,
        Bottom,
        Set,        // 드레스, 슈트 등 상하의 일체형 한벌옷
        Shoes,
        Accessory
    }

    /// <summary>
    /// CORE_GDD_03 플레이어 4대 능력치 구분
    /// </summary>
    public enum StatType
    {
        Negotiation, // 협상력
        Analysis,    // 분석력
        Management,  // 운용력
        Resilience   // 회복력
    }
}
