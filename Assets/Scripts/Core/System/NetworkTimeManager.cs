using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 멀티플레이 및 라이브 서비스 환경에서 클라이언트의 시스템 시간 조작(Time Tampering/Cheat)을 원천 방어하고,
    /// 서버 권한 표준시(Server Authoritative UTC)를 모노토닉 하드웨어 타이머 기반으로 무결하게 유지하는 네트워크 시간 매니저.
    /// <para>
    /// [핵심 보안 원리]:
    /// 1. 서버 접속 시 1회 서버 표준 UTC를 동기화합니다.
    /// 2. 이후 시간 경과는 유저가 윈도우 시계를 변경해도 영향을 받지 않는 CPU 모노토닉 타이머(Time.realtimeSinceStartup)를 통해 누적합니다.
    /// 3. 로컬 시계 조작 시도를 실시간 감지하여 자동 무효화 및 부정행위 이벤트를 발행합니다.
    /// </para>
    /// </summary>
    public class NetworkTimeManager : Singleton<NetworkTimeManager>
    {
        [Header("State Info (Debug ReadOnly)")]
        [SerializeField, ReadOnlyDisplay] private string _currentServerTimeDisplay = "Not Synchronized";
        [SerializeField, ReadOnlyDisplay] private bool _isSynchronized = false;
        [SerializeField, ReadOnlyDisplay] private double _timeOffsetFromLocalSeconds = 0.0;

        [Header("Anti-Tampering Settings")]
        [SerializeField] private float _tamperCheckInterval = 5.0f; // 5초 주기 검사
        [SerializeField] private double _maxAllowedDriftSeconds = 10.0; // 허용 오차 한계

        // 런타임 모노토닉 타임 레퍼런스
        private DateTime _baseServerTimeUtc;
        private double _baseMonotonicTimestamp;
        private double _clientTimeOffsetSeconds;
        private float _lastTamperCheckTime;

        public bool IsSynchronized => _isSynchronized;

        /// <summary>
        /// 서버 기준 현재 협정 세계시 (UTC) - 윈도우 시계 조작 불변
        /// </summary>
        public DateTime UtcNow
        {
            get
            {
                if (_isSynchronized || _baseServerTimeUtc != DateTime.MinValue)
                {
                    double elapsed = Time.realtimeSinceStartupAsDouble - _baseMonotonicTimestamp;
                    return _baseServerTimeUtc.AddSeconds(elapsed);
                }
                return DateTime.UtcNow;
            }
        }

        /// <summary>
        /// 서버 기준 현재 로컬 타임존 시간 (UI 표시용)
        /// </summary>
        public DateTime LocalNow => UtcNow.ToLocalTime();

        protected override void Awake()
        {
            base.Awake();

            // 초기화: 서버 패킷 수신 전 기본 하드웨어 모노토닉 베이스라인 설정
            _baseServerTimeUtc = DateTime.UtcNow;
            _baseMonotonicTimestamp = Time.realtimeSinceStartupAsDouble;
            _clientTimeOffsetSeconds = 0.0;
            _isSynchronized = false;
        }

        private void Update()
        {
            _currentServerTimeDisplay = $"{UtcNow:yyyy-MM-dd HH:mm:ss} UTC (Synced: {_isSynchronized})";

            // 주기적 로컬 시스템 시간 변조(Anti-Tampering) 감시
            if (Time.unscaledTime - _lastTamperCheckTime >= _tamperCheckInterval)
            {
                _lastTamperCheckTime = Time.unscaledTime;
                CheckSystemTimeTampering();
            }
        }

        // --------------------------------------------------------
        // 1. 서버 시간 동기화 인터페이스
        // --------------------------------------------------------

        /// <summary>
        /// 멀티플레이 서버로부터 표준 UTC 시간을 수신했을 때 호출하여 기준점을 설정합니다.
        /// </summary>
        public void SyncWithServerTime(DateTime serverUtc)
        {
            _baseServerTimeUtc = serverUtc;
            _baseMonotonicTimestamp = Time.realtimeSinceStartupAsDouble;
            _clientTimeOffsetSeconds = (serverUtc - DateTime.UtcNow).TotalSeconds;
            _isSynchronized = true;

            _timeOffsetFromLocalSeconds = _clientTimeOffsetSeconds;

            Debug.Log($"<color=#00EAFF>[NetworkTimeManager] 서버 표준시 동기화 완료: {serverUtc:yyyy-MM-dd HH:mm:ss} UTC (로컬 오차: {_timeOffsetFromLocalSeconds:+0.00;-0.00}s)</color>");

            EventBus.Publish(new ServerTimeSynchronizedEvent
            {
                ServerTimeUtc = serverUtc,
                OffsetSeconds = _clientTimeOffsetSeconds
            });
        }

        // --------------------------------------------------------
        // 2. 시간 변조 감지 및 보안 가드
        // --------------------------------------------------------

        private void CheckSystemTimeTampering()
        {
            // 로컬 OS의 DateTime.UtcNow가 모노토닉 누적 시간과 급격하게 어긋났는지 검사
            double calculatedLocalDiff = Math.Abs((DateTime.UtcNow.AddSeconds(_clientTimeOffsetSeconds) - UtcNow).TotalSeconds);

            if (calculatedLocalDiff > _maxAllowedDriftSeconds)
            {
                Debug.LogWarning($"<color=#FF3344>[NetworkTimeManager] ⚠️ 로컬 OS 시간 조작 감지! (오차: {calculatedLocalDiff:F1}초). 서버 모노토닉 타이머({UtcNow:HH:mm:ss} UTC)를 유지합니다.</color>");

                EventBus.Publish(new SystemTimeTamperedEvent
                {
                    DetectedDriftSeconds = calculatedLocalDiff,
                    AuthoritativeServerTime = UtcNow
                });
            }
        }
    }

    /// <summary>
    /// 서버 시간 동기화 성공 이벤트
    /// </summary>
    public struct ServerTimeSynchronizedEvent
    {
        public DateTime ServerTimeUtc;
        public double OffsetSeconds;
    }

    /// <summary>
    /// 클라이언트 로컬 시계 조작 시도 감지 이벤트
    /// </summary>
    public struct SystemTimeTamperedEvent
    {
        public double DetectedDriftSeconds;
        public DateTime AuthoritativeServerTime;
    }
}
