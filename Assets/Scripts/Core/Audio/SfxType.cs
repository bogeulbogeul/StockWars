namespace StockWars.Core
{
    /// <summary>
    /// 게임 내에서 전역적으로 사용하는 효과음(SFX)의 종류를 식별하는 열거형입니다.
    /// </summary>
    public enum SfxType
    {
        // UI 기본음
        UI_Click,           // 버튼 일반 클릭음
        UI_Hover,           // 마우스 오버 시 가벼운 효과음
        UI_PopupOpen,       // 창 열릴 때 효과음
        UI_PopupClose,      // 창 닫힐 때 효과음
        UI_Warning,         // 위험/한도 초과 시 경고음
        UI_Notification,    // 우측 상단 찌라시/뉴스 알림음

        // 노동/알바 관련 (Track 3 연동)
        Job_DeliverySuccess,// 화물 적재 성공음
        Job_DeliveryFail,   // 화물 파손/실패음
        Job_ComboBonus,     // 3콤보 이상 달성음
        Job_Jackpot,        // 황금 기회 잭팟 터졌을 때 효과음

        // 성장/소비 관련
        Stat_LevelUp,       // 플레이어 레벨업음
        Job_Promotion,      // 알바 승급음
        Item_Buy,           // 상점 아이템 구매 완료음
        Item_UseDrink,      // 에너지 드링크 음용/피로도 해소 효과음

        // 주식/금융 관련
        Stock_Buy,          // 주식 매수 체결음
        Stock_Sell,         // 주식 매도 체결음
        Market_Bell         // 증권 거래소 개장 종소리
    }

    /// <summary>
    /// 오디오 채널(AudioMixer Group) 분류를 나타냅니다.
    /// </summary>
    public enum AudioChannel
    {
        Master,
        BGM,
        UI,
        SFX,
        Ambient
    }
}
