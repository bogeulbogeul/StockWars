using System;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05: 게임 내 시간대에 따른 실시간 환경 광원(Day/Night) 변화 제어 엔진 (GlobalLightingCycle).
    /// <para>
    /// 현실 시간과 1:1로 동기화된 달력 시스템(CalendarSystem)의 현재 로컬 시간을 수신하여,
    /// 아침/낮, 노을/황혼, 밤 시간대에 어울리는 아늑하고 감성적인 조명 색상과 강도를 실시간으로 부드럽게 Lerp합니다.
    /// </para>
    /// <para>
    /// URP 2D 환경의 Light2D뿐만 아니라 3D 전역 Light도 동시에 지원하여 유연성을 높였습니다.
    /// </para>
    /// </summary>
    public class GlobalLightingCycle : Singleton<GlobalLightingCycle>
    {
        [Serializable]
        public struct AmbianceConfig
        {
            public Color lightColor;
            public float intensity;
            [Tooltip("화면 포스트 프로세싱 화이트 밸런스 보정용 가중치")]
            public float tempOffset;
        }

        [Header("Light Sources")]
        [Tooltip("URP 2D 전역 환경 광원 (Light2D)")]
        [SerializeField] private Light2D _globalLight2D;

        [Tooltip("3D 전역 환경 광원 (Light - 3D Directional Light 활용 시)")]
        [SerializeField] private Light _globalLight3D;

        [Header("Ambiance Presets")]
        [Tooltip("아침 및 대낮 환경 (07:00 ~ 16:00) - 따스한 아침 햇살 엠버")]
        [SerializeField] private AmbianceConfig _dayPreset = new AmbianceConfig 
        { 
            lightColor = new Color(1.0f, 0.96f, 0.88f), 
            intensity = 1.0f, 
            tempOffset = 10f 
        };

        [Tooltip("노을 및 황혼 환경 (18:00 ~ 20:00) - 낭만적인 오렌지빛 석양")]
        [SerializeField] private AmbianceConfig _duskPreset = new AmbianceConfig 
        { 
            lightColor = new Color(1.0f, 0.58f, 0.32f), 
            intensity = 0.8f, 
            tempOffset = 25f 
        };

        [Tooltip("심야 및 아늑한 밤 환경 (22:00 ~ 05:00) - 차분한 청색 아우라와 가구 백열등 대비")]
        [SerializeField] private AmbianceConfig _nightPreset = new AmbianceConfig 
        { 
            lightColor = new Color(0.18f, 0.22f, 0.38f), 
            intensity = 0.4f, 
            tempOffset = -20f 
        };

        [Header("Debug & Manual Control")]
        [Tooltip("True일 경우 시스템 시간 대신 아래 수동 디버그 시간(0~23)을 사용하여 테스트합니다.")]
        [SerializeField] private bool _useDebugHour = false;
        
        [Range(0f, 23f)]
        [SerializeField] private float _debugHour = 12f;

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 시간 경과를 감지하기 위해 GameTickEvent 구독
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        private void Start()
        {
            UpdateLightingCycle();
        }

        private void Update()
        {
            // 디버그 모드가 켜져 있을 때는 프레임마다 인스펙터 슬라이더의 변화를 실시간으로 추적하여 조명에 반영합니다.
            if (_useDebugHour)
            {
                UpdateLightingCycle();
            }
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            // 재생 중에 에디터 인스펙터 창에서 수치를 드래그하여 고치는 즉시 화면에 보간 연산이 먹히도록 갱신합니다.
            if (UnityEditor.EditorApplication.isPlaying)
            {
                UpdateLightingCycle();
            }
        }
#endif

        /// <summary>
        /// GameTickEvent 발생 시마다 주기적으로 환경 라이팅을 계산하여 동기화합니다.
        /// </summary>
        private void OnGameTick(GameTickEvent e)
        {
            UpdateLightingCycle();
        }

        /// <summary>
        /// 시간(Hour)을 기준으로 라이트 색상 및 밝기 세팅을 선형 보간하여 적용합니다.
        /// </summary>
        public void UpdateLightingCycle()
        {
            float currentHour = GetCurrentHour();
            AmbianceConfig currentAmbiance = CalculateAmbiance(currentHour);

            ApplyAmbiance(currentAmbiance);
        }

        /// <summary>
        /// 디버그 옵션 여부에 따라 현재 적용할 시간(Hour)을 반환합니다.
        /// </summary>
        private float GetCurrentHour()
        {
            if (_useDebugHour) return _debugHour;

            if (CalendarSystem.Instance != null)
            {
                // CalendarSystem에 내장된 UI용 로컬 시간 기반
                DateTime localTime = CalendarSystem.Instance.CurrentTimeLocal;
                return (float)localTime.Hour + (float)localTime.Minute / 60f + (float)localTime.Second / 3600f;
            }

            return (float)DateTime.Now.Hour;
        }

        /// <summary>
        /// 24시간 곡선에 따라 시간대별 엠비언스 프리셋 값을 선형 보간(Lerp)합니다.
        /// </summary>
        private AmbianceConfig CalculateAmbiance(float hour)
        {
            AmbianceConfig config = new AmbianceConfig();

            // 1. 밤 ➡️ 낮 전환 구간 (05:00 ~ 07:00)
            if (hour >= 5.0f && hour < 7.0f)
            {
                float t = (hour - 5.0f) / 2.0f;
                config.lightColor = Color.Lerp(_nightPreset.lightColor, _dayPreset.lightColor, t);
                config.intensity = Mathf.Lerp(_nightPreset.intensity, _dayPreset.intensity, t);
                config.tempOffset = Mathf.Lerp(_nightPreset.tempOffset, _dayPreset.tempOffset, t);
            }
            // 2. 낮 유지 구간 (07:00 ~ 16:00)
            else if (hour >= 7.0f && hour < 16.0f)
            {
                config = _dayPreset;
            }
            // 3. 낮 ➡️ 노을 전환 구간 (16:00 ~ 18:00)
            else if (hour >= 16.0f && hour < 18.0f)
            {
                float t = (hour - 16.0f) / 2.0f;
                config.lightColor = Color.Lerp(_dayPreset.lightColor, _duskPreset.lightColor, t);
                config.intensity = Mathf.Lerp(_dayPreset.intensity, _duskPreset.intensity, t);
                config.tempOffset = Mathf.Lerp(_dayPreset.tempOffset, _duskPreset.tempOffset, t);
            }
            // 4. 노을 유지 구간 (18:00 ~ 20:00)
            else if (hour >= 18.0f && hour < 20.0f)
            {
                config = _duskPreset;
            }
            // 5. 노을 ➡️ 밤 전환 구간 (20:00 ~ 22:00)
            else if (hour >= 20.0f && hour < 22.0f)
            {
                float t = (hour - 20.0f) / 2.0f;
                config.lightColor = Color.Lerp(_duskPreset.lightColor, _nightPreset.lightColor, t);
                config.intensity = Mathf.Lerp(_duskPreset.intensity, _nightPreset.intensity, t);
                config.tempOffset = Mathf.Lerp(_duskPreset.tempOffset, _nightPreset.tempOffset, t);
            }
            // 6. 밤 유지 구간 (22:00 ~ 05:00)
            else
            {
                config = _nightPreset;
            }

            return config;
        }

        /// <summary>
        /// 계산된 엠비언스 구성을 실제 조명 소스에 대입합니다.
        /// </summary>
        private void ApplyAmbiance(AmbianceConfig ambiance)
        {
            // 1. 2D URP 조명 적용
            if (_globalLight2D != null)
            {
                _globalLight2D.color = ambiance.lightColor;
                _globalLight2D.intensity = ambiance.intensity;
            }

            // 2. 3D 일반 조명 적용
            if (_globalLight3D != null)
            {
                _globalLight3D.color = ambiance.lightColor;
                _globalLight3D.intensity = ambiance.intensity;
            }

            // 3. PostProcessManager 연동 (화이트 밸런스 간접 제어 등을 위해 확장 가능)
            // 현재는 볼륨 가중치를 시간대에 따라 보정할 필요가 있을 때 활용하기 좋은 기초 설계입니다.
        }

        // --------------------------------------------------------
        // 4. 외부 테스트 지원용 API
        // --------------------------------------------------------

        /// <summary>
        /// 디버그용으로 수동 시간을 대입하여 조명을 강제 업데이트합니다.
        /// </summary>
        public void SetDebugHour(float hour)
        {
            _useDebugHour = true;
            _debugHour = Mathf.Clamp(hour, 0f, 23.99f);
            UpdateLightingCycle();
            Debug.Log($"[GlobalLightingCycle] 수동 디버그 시간 강제 지정: {_debugHour:F1}시");
        }

        /// <summary>
        /// 수동 디버그 상태를 해제하고 실시간 현실 시간 연동 모드로 복귀합니다.
        /// </summary>
        public void ReleaseDebugMode()
        {
            _useDebugHour = false;
            UpdateLightingCycle();
            Debug.Log("[GlobalLightingCycle] 수동 디버그 해제 -> 현실 시간 동기화 모드 복원");
        }
    }
}
