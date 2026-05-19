namespace StockWars.Core
{
    /// <summary>
    /// 게임 내 모든 밸런스 및 설정 기획 상수들을 통합 관리하는 전역 정적 클래스
    /// </summary>
    public static class GlobalConstants
    {
        // ----------------------------------------------------
        // 1. 시간 및 엔진 설정
        // ----------------------------------------------------
        /// <summary>현실 시간 1초당 게임 내 흐르는 시간 (시간 단위, 1.0 = 1시간)</summary>
        public const float GAME_HOURS_PER_REAL_SECOND = 1f;
        
        /// <summary>1주기(일주일)에 해당하는 시간 (168시간 = 7일)</summary>
        public const int HOURS_PER_WEEK = 168;

        // ----------------------------------------------------
        // 2. 초기 자본 및 경제 설정
        // ----------------------------------------------------
        /// <summary>새 게임 시작 시 지급되는 초기 시드 머니</summary>
        public const long INITIAL_SEED_MONEY = 5000L;

        /// <summary>초기 대출 가능 한도</summary>
        public const long INITIAL_LOAN_LIMIT = 10000L;

        // ----------------------------------------------------
        // 3. 유지비 및 대출 이자 (정기 정산)
        // ----------------------------------------------------
        /// <summary>매주 월요일 청구되는 기본 사무실 유지비 (오피스 레벨 1 기준)</summary>
        public const long BASE_OFFICE_MAINTENANCE_FEE = 500L;

        /// <summary>은행 대출의 기본 주간 복리 이자율 (2.0%)</summary>
        public const float BANK_LOAN_INTEREST_RATE = 0.02f;

        /// <summary>전당포 담보 대출의 주간 복리 이자율 (5.0%)</summary>
        public const float PAWN_LOAN_INTEREST_RATE = 0.05f;

        /// <summary>전당포에서 아이템 구입가 대비 쳐주는 담보 대출 비율 (60%)</summary>
        public const float PAWN_LOAN_LTV_RATIO = 0.60f;

        // ----------------------------------------------------
        // 4. 주식 시장 및 공매도 설정
        // ----------------------------------------------------
        /// <summary>상장폐지 기준가 (상장가의 1% 미만 장기 체납 시)</summary>
        public const float DELISTING_THRESHOLD_RATIO = 0.01f;

        /// <summary>액면분할이 트리거되는 주가 (1,000,000 G)</summary>
        public const long STOCK_SPLIT_TRIGGER_PRICE = 1000000L;

        /// <summary>공매도 주문 시 동결되는 증거금 비율 (주문가의 150%)</summary>
        public const float SHORT_SELL_MARGIN_RATIO = 1.50f;

        /// <summary>마진콜(경고)이 발생하는 유지비율 (90%)</summary>
        public const float MARGIN_CALL_WARNING_RATIO = 0.90f;

        /// <summary>강제 청산(반대매매)이 발생하는 유지비율 (100%)</summary>
        public const float MARGIN_CALL_LIQUIDATION_RATIO = 1.00f;

        /// <summary>위탁 자산 인출 시 횡령으로 판정되는 임계값 비율 (5%)</summary>
        public const float EMBEZZLEMENT_THRESHOLD_RATIO = 0.05f;

        // ----------------------------------------------------
        // 5. 알바 및 노동 설정
        // ----------------------------------------------------
        /// <summary>기본 일일 알바 가능 횟수</summary>
        public const int BASE_DAILY_JOB_LIMIT = 3;

        /// <summary>회복력 스탯에 따른 일일 알바 최대 횟수</summary>
        public const int MAX_DAILY_JOB_LIMIT = 5;

        /// <summary>에너지 드링크 사용 시 회복되는 알바 횟수</summary>
        public const int ENERGY_DRINK_RECOVERY_AMOUNT = 2;
        
        /// <summary>에너지 드링크 상점 구매가</summary>
        public const long ENERGY_DRINK_PRICE = 500L;

        // ----------------------------------------------------
        // 6. 레벨 및 성장 설정
        // ----------------------------------------------------
        /// <summary>레벨업 공식에 적용되는 거래액 가중치 (기본 1000)</summary>
        public const long LEVEL_VOLUME_SCALE = 1000L;

        /// <summary>데모 버전 최대 레벨 제한</summary>
        public const int MAX_DEMO_LEVEL = 3;
    }
}
