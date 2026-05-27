using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 게임 내 달력 및 금융 정산 주기를 관리하는 핵심 시스템.
    /// 현실 시간과 게임 내 시간이 1:1로 일치하여 흐르며,
    /// 타임존 변경 이슈를 예방하기 위해 모든 시간 연산 및 세이브 저장은 UTC(협정 세계시)를 기준으로 수행합니다.
    /// 매주 월요일 00:00:00 (UTC)이 될 때 또는 미접속 상태에서 해당 시점을 통과했을 때
    /// EventBus를 통해 원자적 주간 금융 정산(Weekly Financial Tick) 이벤트를 트리거합니다.
    /// </summary>
    public class CalendarSystem : Singleton<CalendarSystem>
    {
        [Header("State Info (Local Time Display)")]
        [SerializeField, ReadOnlyDisplay]
        private string _lastProcessedSettlementDisplay = "None";

        /// <summary>
        /// 현재 게임 속 시간 (UTC 기준)
        /// </summary>
        public DateTime CurrentTimeUtc => DateTime.UtcNow;

        /// <summary>
        /// 현재 게임 속 시간 (로컬 시간 기준 - UI 표시용)
        /// </summary>
        public DateTime CurrentTimeLocal => DateTime.Now;

        /// <summary>
        /// 마지막으로 금융 정산이 성공적으로 완료된 월요일 00:00:00 일시 (UTC 기준)
        /// </summary>
        public DateTime LastProcessedSettlementTime { get; private set; }

        /// <summary>
        /// 다음으로 예정된 금융 정산 일시 (UTC 기준, 마지막 정산일로부터 정확히 7일 뒤 월요일)
        /// </summary>
        public DateTime NextSettlementTime => LastProcessedSettlementTime == DateTime.MinValue 
            ? DateTime.MinValue 
            : LastProcessedSettlementTime.AddDays(7);

        private bool _isInitializing = false;

        protected override void Awake()
        {
            base.Awake();
            
            // 전역 TickEngine의 1초 주기 이벤트를 구독하여 온라인 상태에서의 시간 경과 실시간 감시
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        /// <summary>
        /// 세이브 데이터를 통해 CalendarSystem을 복구하고, 
        /// 오프라인 경과 시간(Delta Time) 동안 발생한 정산을 소급 적용(Batch Processing)합니다.
        /// 모든 계산 및 저장 기준값은 UTC로 복구됩니다.
        /// </summary>
        /// <param name="saveData">불러온 세이브 데이터</param>
        /// <param name="lastSaveTimeUtc">마지막 저장 시점 (UTC)</param>
        public void Initialize(SaveDataDTO saveData, DateTime lastSaveTimeUtc)
        {
            _isInitializing = true;
            
            DateTime nowUtc = DateTime.UtcNow;

            Debug.Log($"[CalendarSystem] Initializing in UTC. Current={nowUtc:yyyy-MM-dd HH:mm:ss} UTC, LastSave={lastSaveTimeUtc:yyyy-MM-dd HH:mm:ss} UTC");

            // 1. 마지막 정산 일시 복구 (반드시 UTC로 동기화)
            if (saveData.LastProcessedSettlementTime == DateTime.MinValue)
            {
                // 새 게임인 경우, 마지막 저장 일시 직전의 월요일 00:00 (UTC)으로 기준점 설정
                LastProcessedSettlementTime = GetPreviousMondayStart(lastSaveTimeUtc);
                Debug.Log($"[CalendarSystem] New game detected. Initializing settlement baseline to: {LastProcessedSettlementTime:yyyy-MM-dd HH:mm:ss} UTC");
            }
            else
            {
                // 이전 저장 시간도 UTC인지 보장
                LastProcessedSettlementTime = saveData.LastProcessedSettlementTime.Kind == DateTimeKind.Utc
                    ? saveData.LastProcessedSettlementTime
                    : DateTime.SpecifyKind(saveData.LastProcessedSettlementTime, DateTimeKind.Utc);
                
                Debug.Log($"[CalendarSystem] Loaded settlement baseline from save: {LastProcessedSettlementTime:yyyy-MM-dd HH:mm:ss} UTC");
            }

            // 2. 오프라인 상태에서 통과한 정산 주기가 있는지 소급(Batch) 연산 수행 (UTC 기준)
            CheckAndProcessSettlement(nowUtc);

            // 3. 변경 사항을 세이브 데이터에 반영 (UTC 보장)
            saveData.LastProcessedSettlementTime = LastProcessedSettlementTime;
            
            UpdateDebugDisplay();
            _isInitializing = false;
        }

        /// <summary>
        /// 실시간 1초 틱마다 호출되며 현재 시간이 정산 예약 시간을 통과했는지 실시간으로 검사합니다.
        /// </summary>
        private void OnGameTick(GameTickEvent e)
        {
            if (_isInitializing) return;
            // TickEngine의 로컬 시간을 UTC로 변환하여 내부 정산 체크 수행 (타임존 프리)
            CheckAndProcessSettlement(e.CurrentTime.ToUniversalTime());
        }

        /// <summary>
        /// 현재 시간 기준으로 예약된 정산 주기(월요일 00:00 UTC)를 통과했는지 검사하고 정산 이벤트를 발행합니다.
        /// 여러 주기가 누적되어 지나간 경우(장기 미접속 등) 연속해서 소급 실행합니다.
        /// </summary>
        public void CheckAndProcessSettlement(DateTime nowUtc)
        {
            if (LastProcessedSettlementTime == DateTime.MinValue)
            {
                return;
            }

            // 들어온 시간이 UTC인지 보장
            DateTime now = nowUtc.Kind == DateTimeKind.Utc ? nowUtc : nowUtc.ToUniversalTime();

            // 방지 로직: 현재 시간보다 정산 시간이 더 미래일 수 없음 (컴퓨터 시간 오류 등 예외 조치)
            if (now < LastProcessedSettlementTime)
            {
                Debug.LogWarning($"[CalendarSystem] System clock regression detected! CurrentTimeUtc({now:yyyy-MM-dd HH:mm:ss}) is earlier than LastProcessedSettlementTimeUtc({LastProcessedSettlementTime:yyyy-MM-dd HH:mm:ss}).");
                return;
            }

            int triggeredCount = 0;
            
            // 현재 시간이 다음 정산 예약 시간을 통과했는가? (UTC 기준)
            while (now >= NextSettlementTime)
            {
                DateTime targetSettlementTimeUtc = NextSettlementTime;
                
                // 마지막 정산 완료 시점 한 단계씩 전진 (UTC 유지)
                LastProcessedSettlementTime = targetSettlementTimeUtc;
                triggeredCount++;

                // 주간 금융 정산 이벤트 전역 발행 (우선순위: 배당 ➡️ 유지비 ➡️ 부채 상환 ➡️ 압류/수배 순)
                // 이벤트 수신부는 SettlementTime을 UTC 기준으로 다룹니다.
                EventBus.Publish(new WeeklySettlementEvent
                {
                    SettlementTime = targetSettlementTimeUtc,
                    IsOfflineBatch = _isInitializing
                });

                Debug.Log($"[CalendarSystem] Weekly financial settlement triggered for: {targetSettlementTimeUtc:yyyy-MM-dd HH:mm:ss} UTC (OfflineBatch={_isInitializing})");
            }

            if (triggeredCount > 0)
            {
                UpdateDebugDisplay();
            }
        }

        /// <summary>
        /// 입력된 일시의 해당 주차 '월요일 00:00:00'을 계산하여 반환합니다. (UTC/Local 입력 Kind 보존)
        /// </summary>
        public static DateTime GetPreviousMondayStart(DateTime dt)
        {
            int diff = (7 + (dt.DayOfWeek - DayOfWeek.Monday)) % 7;
            DateTime previousMonday = dt.AddDays(-1 * diff).Date;
            
            // 원본 dt의 Kind(Utc/Local)를 유지하여 시각 혼동 방지
            return DateTime.SpecifyKind(previousMonday, dt.Kind);
        }

        private void UpdateDebugDisplay()
        {
            // 인스펙터에는 사용자가 보기 편하게 로컬 시간으로 변환하여 노출
            _lastProcessedSettlementDisplay = LastProcessedSettlementTime == DateTime.MinValue 
                ? "None" 
                : LastProcessedSettlementTime.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss");
        }
    }

    /// <summary>
    /// 인스펙터 상에서 읽기 전용 표시를 지원하기 위한 간단한 속성 데코레이터
    /// </summary>
    public class ReadOnlyDisplayAttribute : PropertyAttribute { }

    /// <summary>
    /// 매주 월요일 00:00 기점 정기 금융 정산 이벤트 (UTC 기준)
    /// </summary>
    public struct WeeklySettlementEvent
    {
        /// <summary>정산이 수행된 기준 월요일 00:00 일시 (UTC 기준)</summary>
        public DateTime SettlementTime;
        
        /// <summary>오프라인 경과 시간 동안 누적되어 배치로 빠르게 소급 처리 중인지 여부</summary>
        public bool IsOfflineBatch;
    }
}
