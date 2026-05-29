using System;
using UnityEngine;
using StockWars.Core;

namespace StockWars.Minigames.SortingHub
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 상하차 미니게임의 화물 균형 잡기 물리 밸런스 로직입니다.
    /// 플레이어는 좌우 방향키로 상자 탑의 균형을 잡아야 하며, Shift(가속) 시 파손 게이지 민감도가 급증합니다.
    /// FatigueSystem과 연동되어 피로도가 높을수록 균형 잡기가 가혹해집니다.
    /// </summary>
    public class SortingHub_Balance : MonoBehaviour
    {
        [Header("Balance Settings")]
        [Tooltip("화물이 파손 없이 버틸 수 있는 최대 기울기 (절대값 각도)")]
        [SerializeField] private float maxSafeTilt = 45f;
        
        [Tooltip("1초당 자연스럽게 증가하는 파손 게이지 기본량 (기울기가 maxSafeTilt에 도달할 때의 기준)")]
        [SerializeField] private float baseDamageRate = 20f;
        
        [Tooltip("Shift(가속) 키를 눌렀을 때 파손 게이지 증가폭에 곱해지는 가혹도 배율")]
        [SerializeField] private float shiftPenaltyMultiplier = 3.5f;

        [Header("Input Dynamics")]
        [Tooltip("좌우 방향키 입력 시 1초당 회복(보정)할 수 있는 기울기(각도) 속도")]
        [SerializeField] private float tiltCorrectionSpeed = 60f;

        [Tooltip("자연적으로 발생하는 기울기 드리프트(Drift) 속도")]
        [SerializeField] private float baseDriftSpeed = 15f;

        // 상태 변수
        private float _currentTilt = 0f;        // 현재 기울기 (-100 ~ 100 범위 혹은 각도. 여기서는 각도로 취급: -maxSafeTilt ~ +maxSafeTilt)
        private float _damageGauge = 0f;        // 파손 게이지 (0% ~ 100%)
        private float _currentDriftDirection = 1f; // 1: 우측으로 기움, -1: 좌측으로 기움
        private bool _isBroken = false;
        private bool _isSessionActive = false;

        // 이벤트 콜백
        public Action<float> OnDamageGaugeChanged;
        public Action<float> OnTiltChanged;
        public Action OnBoxBroken;

        private void Start()
        {
            // 화물을 집어 드는 시점에 초기화 (GDD 명세: 게이지 0% 리셋)
            InitializeNewBox();
        }

        private void Update()
        {
            if (!_isSessionActive || _isBroken) return;

            HandleInputAndPhysics();
            CheckDamageAndFailure();
        }

        /// <summary>
        /// 새로운 화물을 집어들 때 상태를 초기화합니다.
        /// </summary>
        public void InitializeNewBox()
        {
            _currentTilt = 0f;
            _damageGauge = 0f;
            _isBroken = false;
            _isSessionActive = true;
            
            // 초기 드리프트 방향을 무작위로 설정
            _currentDriftDirection = UnityEngine.Random.value > 0.5f ? 1f : -1f;

            OnDamageGaugeChanged?.Invoke(_damageGauge);
            OnTiltChanged?.Invoke(_currentTilt);
        }

        private void HandleInputAndPhysics()
        {
            float deltaTime = Time.deltaTime;

            // 1. FatigueSystem 연동: 피로도에 따른 난이도 보정치 산출
            float fatigueMultiplier = 1.0f;
            if (FatigueSystem.Instance != null)
            {
                // GetSuccessZoneScale()은 피로할수록 0.5에 가까워짐 (즉, 좁아짐).
                // 이를 난이도(가속도) 배율로 역산: 1.0f / scale (피로할수록 1배 -> 2배까지 드리프트가 빨라짐)
                float successScale = FatigueSystem.Instance.GetSuccessZoneScale();
                fatigueMultiplier = 1.0f / Mathf.Clamp(successScale, 0.5f, 1.0f);
            }

            // 2. 가속(Shift) 키 입력 확인
            bool isAccelerating = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);

            // 3. 자연 기울기(Drift) 연산
            // 가속 시 관성이 붙어 드리프트 속도 자체가 상승
            float currentDriftSpeed = baseDriftSpeed * fatigueMultiplier;
            if (isAccelerating)
            {
                currentDriftSpeed *= (shiftPenaltyMultiplier * 0.5f); // 가속 시 기울어짐도 빨라짐
            }

            // 방향 전환 (끝에 도달하면 반대 방향으로 흔들리게 하거나, 난수 주기로 방향이 바뀔 수 있음)
            // 여기서는 단순성을 위해 한계에 도달하면 더 밀리지 않고 게이지만 차오르게 둠.
            // 난이도를 높이기 위해 무작위로 흔들림 방향이 바뀌도록 핑퐁 구현
            if (UnityEngine.Random.value < 0.02f) 
            {
                _currentDriftDirection *= -1f;
            }

            _currentTilt += _currentDriftDirection * currentDriftSpeed * deltaTime;

            // 4. 플레이어 좌우 입력 보정 (Player Correction)
            float inputHorizontal = 0f;
            if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A))
            {
                inputHorizontal = -1f;
            }
            else if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D))
            {
                inputHorizontal = 1f;
            }

            // 보정력 적용 (피로도와 무관하게 플레이어의 손가락 피지컬에 의존)
            _currentTilt += inputHorizontal * tiltCorrectionSpeed * deltaTime;

            // 시각적 표현을 위한 제한 (너무 많이 넘어가면 시각적으로 이상하므로 maxSafeTilt의 1.2배까지만 물리 제한)
            _currentTilt = Mathf.Clamp(_currentTilt, -maxSafeTilt * 1.2f, maxSafeTilt * 1.2f);
            
            OnTiltChanged?.Invoke(_currentTilt);

            // 5. 파손 게이지 증가 연산 (Damage Gauge)
            // 기울기가 클수록, 그리고 가속(Shift) 상태일수록 게이지가 극심하게 상승합니다.
            float tiltRatio = Mathf.Abs(_currentTilt) / maxSafeTilt;
            
            // 약간의 유격(Tolerance) 허용: 기울기가 20% 이내면 파손 게이지 미증가 (선택적)
            if (tiltRatio > 0.2f)
            {
                // 게이지 증가량 = 기본 증가량 * 피로도 배율 * 기울기 심각도
                float damageIncrease = baseDamageRate * fatigueMultiplier * tiltRatio * deltaTime;
                
                // 가속 시(Shift) 민감도(Sensitivity) 폭증
                if (isAccelerating)
                {
                    damageIncrease *= shiftPenaltyMultiplier;
                }

                _damageGauge += damageIncrease;
            }
            else
            {
                // 안정권에 있으면 게이지가 서서히 회복(옵션)되거나 멈춤. 여기서는 멈춤으로 구현.
            }
        }

        private void CheckDamageAndFailure()
        {
            _damageGauge = Mathf.Clamp(_damageGauge, 0f, 100f);
            OnDamageGaugeChanged?.Invoke(_damageGauge);

            // 게이지 100% 도달 시 화물 파손
            if (_damageGauge >= 100f && !_isBroken)
            {
                _isBroken = true;
                _isSessionActive = false;
                
                Debug.LogWarning("[SortingHub_Balance] 파손 게이지 100% 도달! 화물이 파손되었습니다.");
                
                if (AudioManager.Instance != null)
                {
                    AudioManager.Instance.PlaySFX(SfxType.Job_DeliveryFail);
                }

                OnBoxBroken?.Invoke();
            }
        }

        #region Getters
        public bool IsBroken => _isBroken;
        public float CurrentDamageGauge => _damageGauge;
        public float CurrentTilt => _currentTilt;
        #endregion
    }
}
