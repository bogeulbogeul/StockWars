using UnityEngine;
using System;

namespace StockWars.Core
{
    public enum WeatherType
    {
        Clear,      // 맑음
        Rainy,      // 폭우 (유통 거래량 감소 및 지연)
        Heatwave,   // 폭염 (에너지/바이오 변동성 상승)
        Glitch      // 글리치 (IT 섹터 노이즈 발생)
    }

    /// <summary>
    /// CORE_GDD_02 [7.2]: 매일 자정(GameDayTickEvent)마다 새로운 날씨를 무작위로 결정하고,
    /// 이에 따른 시장 버프/디버프 환경 정보를 전역 시스템에 제공하는 날씨 관리 시스템 (WeatherManager).
    /// </summary>
    public class WeatherManager : Singleton<WeatherManager>
    {
        [Header("State")]
        [SerializeField] private WeatherType _currentWeather = WeatherType.Clear;

        [Header("Probabilities (Sum should be 100)")]
        [Range(0, 100)] [SerializeField] private int _clearProbability = 70;
        [Range(0, 100)] [SerializeField] private int _rainyProbability = 15;
        [Range(0, 100)] [SerializeField] private int _heatwaveProbability = 10;
        [Range(0, 100)] [SerializeField] private int _glitchProbability = 5;

        public WeatherType CurrentWeather => _currentWeather;

        private void OnEnable()
        {
            // 자정에 발생하는 일일 날짜 갱신 틱 구독
            EventBus.Subscribe<GameDayTickEvent>(OnGameDayTick);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameDayTickEvent>(OnGameDayTick);
        }

        private void Start()
        {
            // 게임 시작 시 첫 날씨 설정
            UpdateWeather();
        }

        private void OnGameDayTick(GameDayTickEvent e)
        {
            UpdateWeather();
        }

        /// <summary>
        /// 지정된 확률 분포에 기반하여 오늘의 날씨를 무작위 추첨합니다.
        /// </summary>
        public void UpdateWeather()
        {
            int total = _clearProbability + _rainyProbability + _heatwaveProbability + _glitchProbability;
            int roll = UnityEngine.Random.Range(0, total);

            WeatherType newWeather = WeatherType.Clear;

            if (roll < _clearProbability)
            {
                newWeather = WeatherType.Clear;
            }
            else if (roll < _clearProbability + _rainyProbability)
            {
                newWeather = WeatherType.Rainy;
            }
            else if (roll < _clearProbability + _rainyProbability + _heatwaveProbability)
            {
                newWeather = WeatherType.Heatwave;
            }
            else
            {
                newWeather = WeatherType.Glitch;
            }

            SetWeather(newWeather);
        }

        /// <summary>
        /// 날씨 상태를 강제로 변경하고, 비주얼 연출 및 환경을 동기화합니다.
        /// </summary>
        public void SetWeather(WeatherType weather)
        {
            _currentWeather = weather;
            Debug.Log($"[WeatherManager] Today's Weather changed to: {_currentWeather}");

            // 하늘 및 비 VFX 컴포넌트 싱크
            if (GlobalSkyCycle.Instance != null)
            {
                GlobalSkyCycle.Instance.SetRainyWeather(_currentWeather == WeatherType.Rainy);
            }
            
            // 날씨 변경 통보 이벤트 발행 (주식 시장 엔진 등에서 구독하여 수수료/변동성 보정용)
            EventBus.Publish(new WeatherChangedEvent { Weather = _currentWeather });
        }
    }

    /// <summary>
    /// 날씨 변화 감지 이벤트 구조체
    /// </summary>
    public struct WeatherChangedEvent
    {
        public WeatherType Weather;
    }
}
