using UnityEngine;
using System.Collections;

namespace StockWars.Core
{
    /// <summary>
    /// 개발용 배속 기능, 일시정지, 및 연출용 타임 스톱(Time Stop) 기능을 총괄하는 매니저.
    /// 시간 배속 변경 시 EventBus를 통해 전역 이벤트를 발행하여 다른 시스템이 시간 흐름에 동조하도록 합니다.
    /// 유니티 물리 연산 최적화를 위해 Time.fixedDeltaTime 또한 배속에 맞추어 실시간으로 정밀 동기화합니다.
    /// </summary>
    public class TimeScaleController : Singleton<TimeScaleController>
    {
        [Header("디버그 및 기본 설정")]
        [SerializeField] private float _defaultTimeScale = 1.0f;
        [SerializeField] private float _maxTimeScale = 10.0f;

        private float _savedTimeScale = 1.0f;
        private bool _isPaused = false;
        private Coroutine _timeStopCoroutine;
        
        // 프로젝트 고유의 초기 물리 업데이트 주기 백업 필드 (예: 기본 0.02s)
        private float _initialFixedDeltaTime;

        /// <summary>
        /// 현재 적용 중인 유니티 Time.timeScale 값입니다.
        /// </summary>
        public float CurrentTimeScale => Time.timeScale;

        /// <summary>
        /// 일시정지(Pause) 상태 여부를 반환합니다.
        /// </summary>
        public bool IsPaused => _isPaused;

        protected override void Awake()
        {
            base.Awake();
            if (Instance != this) return;

            // 프로젝트 시작 시 설정된 고정 물리 주기 백업 (물리 튐 및 끊김 현상 감쇄용)
            _initialFixedDeltaTime = Time.fixedDeltaTime;

            // 기본 타임 스케일 적용
            SetTimeScale(_defaultTimeScale);
        }

        /// <summary>
        /// 시간 배속을 강제 설정합니다. 물리 업데이트 주기(fixedDeltaTime)도 배속 비례로 자동 제어합니다.
        /// </summary>
        /// <param name="targetScale">설정할 배속 값 (0 이상)</param>
        public void SetTimeScale(float targetScale)
        {
            if (targetScale < 0f)
            {
                Debug.LogWarning("[TimeScaleController] 음수 타임 스케일은 지원하지 않습니다. 0f로 대체합니다.");
                targetScale = 0f;
            }

            targetScale = Mathf.Min(targetScale, _maxTimeScale);

            float prevScale = Time.timeScale;
            Time.timeScale = targetScale;

            // 물리 업데이트 주기(fixedDeltaTime) 보정: 배속에 맞춰 물리 업데이트 빈도 조절
            if (targetScale > 0f)
            {
                Time.fixedDeltaTime = _initialFixedDeltaTime * targetScale;
                _savedTimeScale = targetScale;
                _isPaused = false;
            }
            else
            {
                // 시간 정지 상태에서는 나누기 오류 및 오버헤드 방지를 위해 초기 고정 값 유지 (물리 연산 루프는 엔진 단에서 자동 정지됨)
                _isPaused = true;
            }

            // 이벤트 발행
            EventBus.Publish(new TimeScaleChangedEvent
            {
                PreviousScale = prevScale,
                NewScale = targetScale,
                IsPaused = _isPaused
            });

            Debug.Log($"[TimeScaleController] 타임 스케일 변경: {prevScale:F2} -> {targetScale:F2} (FixedDeltaTime: {Time.fixedDeltaTime:F4}s, 일시정지: {_isPaused})");
        }

        /// <summary>
        /// 게임을 일시정지합니다. 현재 속도를 저장하고 timeScale을 0으로 만듭니다.
        /// </summary>
        public void Pause()
        {
            if (_isPaused) return;

            _savedTimeScale = Time.timeScale > 0f ? Time.timeScale : 1.0f;
            _isPaused = true;

            float prevScale = Time.timeScale;
            Time.timeScale = 0f;

            EventBus.Publish(new TimeScaleChangedEvent
            {
                PreviousScale = prevScale,
                NewScale = 0f,
                IsPaused = true
            });

            Debug.Log($"[TimeScaleController] 게임 일시정지 (이전 배속: {_savedTimeScale:F2})");
        }

        /// <summary>
        /// 일시정지를 해제하고 이전 시간 배속 및 물리 주기를 복원합니다.
        /// </summary>
        public void Resume()
        {
            if (!_isPaused) return;

            float targetScale = _savedTimeScale;
            _isPaused = false;

            float prevScale = Time.timeScale;
            Time.timeScale = targetScale;
            Time.fixedDeltaTime = _initialFixedDeltaTime * targetScale;

            EventBus.Publish(new TimeScaleChangedEvent
            {
                PreviousScale = prevScale,
                NewScale = targetScale,
                IsPaused = false
            });

            Debug.Log($"[TimeScaleController] 게임 일시정지 해제 및 배속 복원: {targetScale:F2} (FixedDeltaTime: {Time.fixedDeltaTime:F4}s)");
        }

        /// <summary>
        /// 연출용 타임 스톱 플러그인.
        /// 지정된 실시간 초(Real-time Seconds) 동안 게임 플레이 시간(timeScale)을 완전히 얼린 후,
        /// 만료 시 이전에 구동 중이던 타임 스케일로 자동 복원합니다.
        /// </summary>
        /// <param name="duration">정지 시간 (실제 시간 기준 초 단위)</param>
        public void StopTimeForDuration(float duration)
        {
            if (duration <= 0f) return;

            if (_timeStopCoroutine != null)
            {
                StopCoroutine(_timeStopCoroutine);
            }

            _timeStopCoroutine = StartCoroutine(TimeStopCoroutine(duration));
        }

        private IEnumerator TimeStopCoroutine(float duration)
        {
            float originalScale = _isPaused ? 0f : (_savedTimeScale > 0f ? _savedTimeScale : 1.0f);
            
            // 타임 스톱 강제 발동 (시간 정지)
            float prevScale = Time.timeScale;
            Time.timeScale = 0f;

            EventBus.Publish(new TimeScaleChangedEvent
            {
                PreviousScale = prevScale,
                NewScale = 0f,
                IsPaused = true
            });

            Debug.Log($"[TimeScaleController] 연출용 타임 스톱 발동: {duration:F2}초 간 정지 (복원 예정 배속: {originalScale:F2})");

            // 게임 시간 배속의 영향을 받지 않는 실시간 대기
            yield return new WaitForSecondsRealtime(duration);

            // 시간 복원 (일시 정지 상태가 아니었다면 원복, 일시 정지 상태였다면 0f 유지)
            if (!_isPaused)
            {
                Time.timeScale = originalScale;
                Time.fixedDeltaTime = _initialFixedDeltaTime * originalScale;

                EventBus.Publish(new TimeScaleChangedEvent
                {
                    PreviousScale = 0f,
                    NewScale = originalScale,
                    IsPaused = false
                });
                Debug.Log($"[TimeScaleController] 연출용 타임 스톱 종료: 배속 복원 {originalScale:F2} (FixedDeltaTime: {Time.fixedDeltaTime:F4}s)");
            }
            else
            {
                Debug.Log("[TimeScaleController] 연출용 타임 스톱 종료: 유저 일시정지 상태이므로 0f 유지");
            }

            _timeStopCoroutine = null;
        }
    }

    #region TimeScale Events (시간 제어 전역 이벤트 구조체)

    /// <summary>
    /// 게임 시간 배속이 물리적으로 변경되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct TimeScaleChangedEvent
    {
        public float PreviousScale;
        public float NewScale;
        public bool IsPaused;
    }

    #endregion
}
