using System;
using UnityEngine;
using UnityEngine.UI;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05: 시간대(Day/Sunset/Night) 및 날씨 변화에 따라 하늘 배경 레이어의 스프라이트를
    /// 부드럽게 페이드(Fade) 전환하는 환경 연출 매니저 (GlobalSkyCycle).
    /// </summary>
    public class GlobalSkyCycle : Singleton<GlobalSkyCycle>
    {
        [Header("UI Image Layers")]
        [Tooltip("기본 하늘 이미지 레이어 (아래쪽)")]
        [SerializeField] private Image _skyBaseImage;
        
        [Tooltip("페이드 트랜지션용 하늘 이미지 레이어 (위쪽)")]
        [SerializeField] private Image _skyFadeImage;

        [Header("Sky Sprites")]
        [SerializeField] private Sprite _daySkySprite;
        [SerializeField] private Sprite _sunsetSkySprite;
        [SerializeField] private Sprite _nightSkySprite;
        [SerializeField] private Sprite _rainySkySprite;

        [Header("Weather Settings")]
        [SerializeField] private bool _isRainy = false;
        [Tooltip("날씨 전환 페이드 속도")]
        [SerializeField] private float _weatherFadeSpeed = 2.0f;

        [Header("Debug Control")]
        [SerializeField] private bool _useDebugHour = false;
        [Range(0f, 23.99f)]
        [SerializeField] private float _debugHour = 12f;

        private float _currentWeatherAlpha = 0f;

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        private void Start()
        {
            UpdateSkyCycle();
        }

        private void Update()
        {
            if (_useDebugHour)
            {
                UpdateSkyCycle();
            }
            
            // 날씨 변화(비 오는 날)에 따른 페이드 애니메이션 처리 (부드러운 전환)
            HandleWeatherTransition();
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            if (UnityEditor.EditorApplication.isPlaying)
            {
                UpdateSkyCycle();
                
                // 에디터 플레이 모드에서 Is Rainy 체크박스를 누를 때 파티클 시스템도 실시간 연동되도록 처리
                RainVFXController rainVFX = FindFirstObjectByType<RainVFXController>();
                if (rainVFX != null)
                {
                    rainVFX.SetRainActive(_isRainy);
                }
            }
        }
#endif

        private void OnGameTick(GameTickEvent e)
        {
            UpdateSkyCycle();
        }

        private float GetCurrentHour()
        {
            if (_useDebugHour) return _debugHour;

            if (CalendarSystem.Instance != null)
            {
                DateTime localTime = CalendarSystem.Instance.CurrentTimeLocal;
                return (float)localTime.Hour + (float)localTime.Minute / 60f + (float)localTime.Second / 3600f;
            }

            return (float)DateTime.Now.Hour;
        }

        /// <summary>
        /// 시간대에 따른 스프라이트 결정 및 페이드 보간율을 계산하여 반영합니다.
        /// </summary>
        public void UpdateSkyCycle()
        {
            if (_skyBaseImage == null || _skyFadeImage == null) return;

            float hour = GetCurrentHour();
            
            Sprite baseSprite = null;
            Sprite fadeSprite = null;
            float lerpT = 0f;

            // 1. 밤 ➡️ 낮 전환 (05:00 ~ 07:00)
            if (hour >= 5.0f && hour < 7.0f)
            {
                baseSprite = _nightSkySprite;
                fadeSprite = _daySkySprite;
                lerpT = (hour - 5.0f) / 2.0f;
            }
            // 2. 낮 유지 (07:00 ~ 16:00)
            else if (hour >= 7.0f && hour < 16.0f)
            {
                baseSprite = _daySkySprite;
                fadeSprite = _daySkySprite;
                lerpT = 0f;
            }
            // 3. 낮 ➡️ 노을 전환 (16:00 ~ 18:00)
            else if (hour >= 16.0f && hour < 18.0f)
            {
                baseSprite = _daySkySprite;
                fadeSprite = _sunsetSkySprite;
                lerpT = (hour - 16.0f) / 2.0f;
            }
            // 4. 노을 유지 (18:00 ~ 20:00)
            else if (hour >= 18.0f && hour < 20.0f)
            {
                baseSprite = _sunsetSkySprite;
                fadeSprite = _sunsetSkySprite;
                lerpT = 0f;
            }
            // 5. 노을 ➡️ 밤 전환 (20:00 ~ 22:00)
            else if (hour >= 20.0f && hour < 22.0f)
            {
                baseSprite = _sunsetSkySprite;
                fadeSprite = _nightSkySprite;
                lerpT = (hour - 20.0f) / 2.0f;
            }
            // 6. 밤 유지 (22:00 ~ 05:00)
            else
            {
                baseSprite = _nightSkySprite;
                fadeSprite = _nightSkySprite;
                lerpT = 0f;
            }

            // --- 시간대별 하늘 틴트(Tint) 컬러 계산 (비오는 날 밤 어두워지는 연출 포함) ---
            Color nightTint = new Color(0.20f, 0.23f, 0.40f, 1f); // 심야 밤 틴트 (어두운 청색)
            Color dayTint = Color.white;                          // 대낮 틴트 (원색 그대로)
            Color sunsetTint = new Color(0.90f, 0.70f, 0.65f, 1f); // 석양 틴트 (붉은 노을빛)
            Color currentTint = Color.white;

            if (hour >= 5.0f && hour < 7.0f)
            {
                currentTint = Color.Lerp(nightTint, dayTint, (hour - 5.0f) / 2.0f);
            }
            else if (hour >= 7.0f && hour < 16.0f)
            {
                currentTint = dayTint;
            }
            else if (hour >= 16.0f && hour < 18.0f)
            {
                currentTint = Color.Lerp(dayTint, sunsetTint, (hour - 16.0f) / 2.0f);
            }
            else if (hour >= 18.0f && hour < 20.0f)
            {
                currentTint = sunsetTint;
            }
            else if (hour >= 20.0f && hour < 22.0f)
            {
                currentTint = Color.Lerp(sunsetTint, nightTint, (hour - 20.0f) / 2.0f);
            }
            else
            {
                currentTint = nightTint;
            }

            // 비가 안 오는 평소 상태의 시간대 보간 세팅
            if (!_isRainy && _currentWeatherAlpha <= 0f)
            {
                _skyBaseImage.sprite = baseSprite;
                _skyBaseImage.color = currentTint;

                _skyFadeImage.sprite = fadeSprite;
                _skyFadeImage.color = new Color(currentTint.r, currentTint.g, currentTint.b, lerpT);
            }
            else
            {
                // 비가 오거나 비로 전환 중인 상태
                // Base는 일반 시간대 하늘(동일하게 틴트 적용), Fade는 비구름 하늘로 덮어씌움
                _skyBaseImage.sprite = baseSprite;
                _skyBaseImage.color = currentTint;

                // 비구름 이미지도 시간대 틴트를 곱하여 밤에는 어두워지도록 설정
                _skyFadeImage.sprite = _rainySkySprite;
                _skyFadeImage.color = new Color(currentTint.r, currentTint.g, currentTint.b, _currentWeatherAlpha);
            }
        }

        /// <summary>
        /// 비 오는 날씨의 페이드 전환을 부드럽게 처리합니다.
        /// </summary>
        private void HandleWeatherTransition()
        {
            float targetAlpha = _isRainy ? 1.0f : 0.0f;
            if (!Mathf.Approximately(_currentWeatherAlpha, targetAlpha))
            {
                _currentWeatherAlpha = Mathf.MoveTowards(_currentWeatherAlpha, targetAlpha, _weatherFadeSpeed * Time.deltaTime);
                UpdateSkyCycle();
            }
        }

        /// <summary>
        /// 날씨 상태를 외부에서 변경합니다.
        /// </summary>
        public void SetRainyWeather(bool isRainy)
        {
            _isRainy = isRainy;
            // 비가 시작되면 RainVFXController도 함께 싱크를 맞춰줍니다.
            RainVFXController rainVFX = FindFirstObjectByType<RainVFXController>();
            if (rainVFX != null)
            {
                rainVFX.SetRainActive(isRainy);
            }
        }
    }
}
