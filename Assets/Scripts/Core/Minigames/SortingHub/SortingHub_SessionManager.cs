using System;
using UnityEngine;
using StockWars.Core;

namespace StockWars.Minigames.SortingHub
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 상하차 미니게임 노동 세션 라이프사이클 총괄 관리자.
    /// 세션 시작 시점에 알바 횟수를 선제 차감(어뷰징 방지)하고, 일시정지(Pause) 및 중도 포기(Abandon) 시 0G/0EXP 패널티 정산을 엄격하게 처리합니다.
    /// </summary>
    public class SortingHub_SessionManager : Singleton<SortingHub_SessionManager>
    {
        public enum SessionState
        {
            Ready,      // 시작 대기
            Playing,    // 플레이 중
            Paused,     // 일시정지 중
            Finished,   // 성공적 종료 (화물 운송 성공 또는 시간 종료)
            Abandoned   // 중도 포기 (패널티 대상)
        }

        [Header("Session Config")]
        [Tooltip("알바 세션 기본 제한시간 (GDD 명세: 60초)")]
        [SerializeField] private float sessionDuration = 60f;

        private SessionState _currentState = SessionState.Ready;
        private float _remainingTime = 0f;
        private int _deliveredCargoCount = 0;
        private int _maxComboCount = 0;
        private bool _isPassUsed = false;
        private bool _isAutoConsignment = false;

        // 세션 관련 이벤트 콜백
        public Action<SessionState> OnStateChanged;
        public Action<float> OnTimerTick;
        public Action<int> OnCargoDelivered;

        protected override void Awake()
        {
            base.Awake();
        }

        private void Update()
        {
            if (_currentState != SessionState.Playing) return;

            // 게임 시간 흐름 (TimeScaleController의 일시정지 배율에 직접 반응)
            _remainingTime -= Time.deltaTime;
            OnTimerTick?.Invoke(_remainingTime);

            if (_remainingTime <= 0f)
            {
                FinishSession(isBroken: false);
            }
        }

        /// <summary>
        /// 새로운 상하차 알바 세션을 구동합니다.
        /// 진입 시점에 횟수를 즉시 선제 차감하여 비정상 종료(어뷰징)를 철저히 차단합니다.
        /// </summary>
        /// <returns>세션 구동 성공 여부</returns>
        public bool StartSession(bool passUsed = false, bool autoConsignment = false)
        {
            if (_currentState != SessionState.Ready)
            {
                Debug.LogWarning("[SortingHub_SessionManager] 세션이 이미 진행 중이거나 준비 상태가 아닙니다.");
                return false;
            }

            // 1. 알바 횟수 제한 검증
            if (JobLimitSystem.Instance != null && !JobLimitSystem.Instance.CanPerformJob())
            {
                Debug.LogError("[SortingHub_SessionManager] 금일 알바 가능 횟수를 모두 소진하여 시작할 수 없습니다.");
                return false;
            }

            // 2. 어뷰징 방지: 세션 진입과 동시에 일일 횟수 차감 선 집행
            if (JobLimitSystem.Instance != null)
            {
                bool success = JobLimitSystem.Instance.ConsumeJobCount();
                if (!success)
                {
                    Debug.LogError("[SortingHub_SessionManager] 알바 횟수 차감 실패로 세션을 중단합니다.");
                    return false;
                }
            }

            // 3. 상태 리셋 및 활성화
            _isPassUsed = passUsed;
            _isAutoConsignment = autoConsignment;
            _deliveredCargoCount = 0;
            _maxComboCount = 0;
            _remainingTime = sessionDuration;

            SetState(SessionState.Playing);
            Debug.Log("[SortingHub_SessionManager] 알바 세션 시작 (알바 횟수 1회 차감 완료)");
            return true;
        }

        /// <summary>
        /// 게임을 일시정지하거나 재개합니다. (TimeScaleController 연동)
        /// </summary>
        public void TogglePause()
        {
            if (_currentState == SessionState.Playing)
            {
                if (TimeScaleController.Instance != null)
                {
                    TimeScaleController.Instance.Pause();
                }
                SetState(SessionState.Paused);
            }
            else if (_currentState == SessionState.Paused)
            {
                if (TimeScaleController.Instance != null)
                {
                    TimeScaleController.Instance.Resume();
                }
                SetState(SessionState.Playing);
            }
        }

        /// <summary>
        /// 아르바이트 중도 포기를 집행합니다.
        /// 포기 시 0G/0EXP 패널티가 가차없이 부여됩니다.
        /// </summary>
        public void AbandonSession()
        {
            if (_currentState != SessionState.Playing && _currentState != SessionState.Paused)
            {
                Debug.LogWarning("[SortingHub_SessionManager] 현재 플레이 중이 아니므로 포기할 수 없습니다.");
                return;
            }

            // 일시정지 상태에서 포기했을 수 있으므로 시간을 정상화합니다.
            if (_currentState == SessionState.Paused && TimeScaleController.Instance != null)
            {
                TimeScaleController.Instance.Resume();
            }

            SetState(SessionState.Abandoned);
            Debug.LogWarning("[SortingHub_SessionManager] 유저 아르바이트 포기 감지! 패널티를 부여합니다.");

            // 0G / 0EXP / 찌라시 획득 불가능 패널티 지급 (isAbandoned: true)
            if (JobSystemController.Instance != null)
            {
                JobSystemController.Instance.DispatchJobReward(
                    deliveredCount: 0, 
                    maxCombo: 0, 
                    isBroken: true, 
                    isPassUsed: _isPassUsed, 
                    isAutoConsignment: _isAutoConsignment, 
                    isAbandoned: true
                );
            }

            ResetToReady();
        }

        /// <summary>
        /// 화물이 파손되었거나 시간 만료로 세션이 정상 종료되었을 때 호출됩니다.
        /// </summary>
        public void FinishSession(bool isBroken)
        {
            if (_currentState != SessionState.Playing && _currentState != SessionState.Paused) return;

            // 시간 정지 상태 해제
            if (_currentState == SessionState.Paused && TimeScaleController.Instance != null)
            {
                TimeScaleController.Instance.Resume();
            }

            SetState(SessionState.Finished);

            // 최종 수확된 스코어로 정상 보상 정산
            if (JobSystemController.Instance != null)
            {
                JobSystemController.Instance.DispatchJobReward(
                    deliveredCount: _deliveredCargoCount, 
                    maxCombo: _maxComboCount, 
                    isBroken: isBroken, 
                    isPassUsed: _isPassUsed, 
                    isAutoConsignment: _isAutoConsignment, 
                    isAbandoned: false
                );
            }

            ResetToReady();
        }

        /// <summary>
        /// 화물 운송 성공 시 카운트 증가 및 외부 콤보 상태 기록용 API입니다.
        /// </summary>
        public void RegisterCargoDelivery(int currentCombo)
        {
            if (_currentState != SessionState.Playing) return;

            _deliveredCargoCount++;
            _maxComboCount = Mathf.Max(_maxComboCount, currentCombo);
            
            OnCargoDelivered?.Invoke(_deliveredCargoCount);
        }

        private void SetState(SessionState newState)
        {
            _currentState = newState;
            OnStateChanged?.Invoke(_currentState);
        }

        private void ResetToReady()
        {
            _currentState = SessionState.Ready;
        }

        #region Getters
        public SessionState CurrentState => _currentState;
        public float RemainingTime => _remainingTime;
        public int DeliveredCargoCount => _deliveredCargoCount;
        public int MaxComboCount => _maxComboCount;
        #endregion
    }
}
