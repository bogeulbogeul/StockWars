using System;
using System.Collections;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_06: 특정 주기 및 주요 상호작용 후 자동 저장을 조율하고 관리하는 라우터 (Auto Save Router).
    /// <para>
    /// 백그라운드에서 주기적(기본 300초 / 5분)으로 자동 저장을 수행하고, 레벨업, 주식 거래, 스탯 투자, 피로도 소모 등의
    /// 주요 인게임 이벤트 발생 시 실시간으로 저장을 라우팅하여 플레이어 데이터 유실을 완전 방지합니다.
    /// </para>
    /// <para>
    /// 디스크 입출력 병목과 파일 락 충돌을 완전히 피하기 위해 **디바운스(Debounce / 지연 대기)** 아키텍처를 내장하여,
    /// 여러 이벤트가 짧은 간격으로 연속 발생할 경우(예: 스탯 5회 연속 투자, 주식 연타 매수) 디스크 쓰기를 최종 1회로 병합 처리합니다.
    /// </para>
    /// </summary>
    public class AutoSaveRouter : Singleton<AutoSaveRouter>
    {
        [Header("Auto Save Settings")]
        [Tooltip("정기적 자동 저장 간격 (초 단위, 기본 300초 = 5분)")]
        public float periodicSaveInterval = 300f;

        [Tooltip("연속적인 이벤트 발생 시 저장 실행을 지연 대기시킬 디바운스 시간 (초 단위, 기본 3초)")]
        public float debounceDelay = 3.0f;

        /// <summary>
        /// 현재 활성화된 세이브 슬롯 인덱스. 
        /// 씬 선택 화면 또는 게임 시작 시 바인딩되며, 미지정 시 1번 슬롯으로 자동 폴백합니다.
        /// </summary>
        public static int ActiveSlotIndex { get; set; } = 1;

        private float _periodicTimer = 0f;
        private Coroutine _debounceCoroutine;
        private bool _isSavePending = false;

        // --------------------------------------------------------
        // 1. 초기화 및 이벤트 리스너 등록
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            ResetPeriodicTimer();
        }

        private void OnEnable()
        {
            // 주요 상호작용(저장 트리거 지점) 전역 이벤트 구독
            EventBus.Subscribe<PlayerLevelUpEvent>(OnSaveTriggerEvent);
            EventBus.Subscribe<StockTransactionEvent>(OnSaveTriggerEvent);
            EventBus.Subscribe<StatAllocatedEvent>(OnSaveTriggerEvent);
            EventBus.Subscribe<StatResetEvent>(OnSaveTriggerEvent);
            EventBus.Subscribe<DailyJobConsumedEvent>(OnSaveTriggerEvent);
            EventBus.Subscribe<DailyJobsResetEvent>(OnSaveTriggerEvent);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnSaveTriggerEvent);
            EventBus.Unsubscribe<StockTransactionEvent>(OnSaveTriggerEvent);
            EventBus.Unsubscribe<StatAllocatedEvent>(OnSaveTriggerEvent);
            EventBus.Unsubscribe<StatResetEvent>(OnSaveTriggerEvent);
            EventBus.Unsubscribe<DailyJobConsumedEvent>(OnSaveTriggerEvent);
            EventBus.Unsubscribe<DailyJobsResetEvent>(OnSaveTriggerEvent);
        }

        // --------------------------------------------------------
        // 2. 주기적 자동 저장 타이머 루프 (Update)
        // --------------------------------------------------------

        private void Update()
        {
            // 활성 세이브 데이터가 준비되지 않은 부트스트랩/타이틀 단계에서는 타이머를 작동하지 않습니다.
            if (!IsSaveDataReady()) return;

            _periodicTimer += Time.deltaTime;

            if (_periodicTimer >= periodicSaveInterval)
            {
                Debug.Log($"[AutoSaveRouter] 정기 자동 저장 주기 도달 ({periodicSaveInterval}초 경과). 자동 저장을 즉시 요청합니다.");
                TriggerInstantSave();
                ResetPeriodicTimer();
            }
        }

        private void ResetPeriodicTimer()
        {
            _periodicTimer = 0f;
        }

        // --------------------------------------------------------
        // 3. 디바운스(Debounce) 아키텍처 및 라우팅 로직
        // --------------------------------------------------------

        /// <summary>
        /// 인게임 상호작용 이벤트 감청 시 호출되어 세이브 요청을 예약(디바운스)합니다.
        /// </summary>
        private void OnSaveTriggerEvent<T>(T e) where T : struct
        {
            // 데이터 무결성 검증 컨텍스트가 없거나 로드 전이면 패스
            if (!IsSaveDataReady()) return;

            string eventName = typeof(T).Name;
            
            // 기존 진행 중인 지연 대기 코루틴이 있다면 파기하여 디스크 입출력 연속 충돌 방지
            if (_debounceCoroutine != null)
            {
                StopCoroutine(_debounceCoroutine);
            }

            _isSavePending = true;
            _debounceCoroutine = StartCoroutine(CoDebouncedSave(eventName));
        }

        /// <summary>
        /// 연속적인 쓰기 요청을 일정 지연 시간 동안 모아서 한 번에 물리 파일로 병합 저장하는 코루틴입니다.
        /// </summary>
        private IEnumerator CoDebouncedSave(string triggeredByEvent)
        {
            yield return new WaitForSeconds(debounceDelay);

            if (_isSavePending)
            {
                Debug.Log($"[AutoSaveRouter] 상호작용 이벤트({triggeredByEvent}) 축적으로 인한 자동 저장 대기 시간 만료. 파일 저장을 단행합니다.");
                ExecuteSave();
            }

            _debounceCoroutine = null;
        }

        /// <summary>
        /// 디바운스를 건너뛰고 씬 전환이나 종료 등의 시점에 즉각적인 강제 물리 저장을 단행합니다.
        /// </summary>
        public void TriggerInstantSave()
        {
            if (!IsSaveDataReady()) return;

            if (_debounceCoroutine != null)
            {
                StopCoroutine(_debounceCoroutine);
                _debounceCoroutine = null;
            }

            ExecuteSave();
        }

        // --------------------------------------------------------
        // 4. 세이브 데이터 물리적 추출 및 쓰기 지점
        // --------------------------------------------------------

        private void ExecuteSave()
        {
            _isSavePending = false;

            if (IOManager.Instance == null || WalletManager.Instance == null)
            {
                Debug.LogError("[AutoSaveRouter] IOManager 또는 WalletManager가 활성화되어 있지 않아 자동 저장에 실패했습니다.");
                return;
            }

            try
            {
                var currentSave = WalletManager.Instance.ActiveSaveData;
                
                // 가벼운 자동 세이브 슬롯 표시용 메타데이터 조립
                SaveMetadata metadata = new SaveMetadata
                {
                    AppVersion = Application.version,
                    LastLocation = "Auto Saved Zone",
                    TotalPlayTime = Time.time // 런타임 재생 시간 임시 매핑
                };

                // 물리 디스크 쓰기 실행 (IOManager의 SaveSafetyCheck 2중 안전 장치 연계)
                IOManager.Instance.SaveGame(ActiveSlotIndex, currentSave, metadata);
                
                Debug.Log($"[AutoSaveRouter] 자동 저장 완결! (슬롯: {ActiveSlotIndex})");

                // 정기 저장 타이머 리셋
                ResetPeriodicTimer();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AutoSaveRouter] 자동 저장 도중 심각한 예외 발생: {ex.Message}");

                // [저장 장애 대응 연동] 물리 저장 실패 시 AsyncPatcher에게 메모리 보관 및 백그라운드 재시도 위탁
                if (AsyncPatcher.Instance != null && WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
                {
                    var currentSave = WalletManager.Instance.ActiveSaveData;
                    SaveMetadata metadata = new SaveMetadata
                    {
                        AppVersion = Application.version,
                        LastLocation = "Auto Saved Zone (Failed - Pending Retry)",
                        TotalPlayTime = Time.time
                    };
                    AsyncPatcher.Instance.QueueFailedSave(ActiveSlotIndex, currentSave, metadata, ex.Message);
                }
            }
        }

        private bool IsSaveDataReady()
        {
            if (WalletManager.Instance == null) return false;
            
            // Failsafe 더미 객체가 아닌 실제로 바인딩된 인스턴스가 활성화되어 있는지 교차 확인
            return WalletManager.Instance.ActiveSaveData != null && 
                   WalletManager.Instance.ActiveSaveData.PlayerLevel > 0;
        }
    }
}
