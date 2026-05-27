using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_06: 매 프레임 세이브 데이터의 무단 메모리 변조를 감시 및 방어하는 무결성 엔진 (Data Integrity Engine).
    /// <para>
    /// 게임 내 핵심 자산(가용 현금, 누적 이자, 누적 배당금, 플레이어 레벨, 스탯 포인트 및 4대 기본 능력치)을 대상으로
    /// 치트 엔진(Cheat Engine) 등 메모리 에디터에 의한 변조를 실시간으로 탐지합니다.
    /// </para>
    /// <para>
    /// 메모리 검색 우회를 방지하기 위해 세션별 무작위 XOR 솔트를 사용하여 정적 그림자 데이터(Shadow Value)를 암호화 보관하며,
    /// 변조 탐지 시 원본 데이터로 자동 롤백(자가 치유)을 수행하고 계좌 동결 및 즉각적인 '적색 수배(RedNotice)' 상태로 처벌합니다.
    /// </para>
    /// <para>
    /// 치트 툴의 '값 고정(Lock/Freeze)' 기능을 켰을 때 발생하는 로그 폭증 및 프레임 드랍을 막기 위해 1.5초 경보 쿨다운이 내장되어 있습니다.
    /// </para>
    /// </summary>
    public class DataIntegrity : Singleton<DataIntegrity>
    {
        // --------------------------------------------------------
        // 1. 보안용 세션 XOR 솔트 및 정적 암호화 그림자 데이터
        // --------------------------------------------------------
        
        private long _xorSalt;
        private bool _isInitialized = false;
        private SaveDataDTO _lastTrackedSaveData;

        // 핵심 자금 그림자 데이터
        private long _shadowGoldEncoded;
        private long _shadowDividendsEncoded;
        private long _shadowInterestEncoded;

        // 플레이어 성장 그림자 데이터
        private int _shadowLevelEncoded;
        private int _shadowStatPointsEncoded;
        private int _shadowTradingVolumeEncoded;

        // 4대 스탯 베이스 블록 그림자 데이터
        private int _shadowAnalysisLvEncoded;
        private int _shadowNegotiationLvEncoded;
        private int _shadowTradingLvEncoded;
        private int _shadowRecoveryLvEncoded;

        // --------------------------------------------------------
        // 2. 경보 폭증 방지용 스로틀링(Throttling) 시스템
        // --------------------------------------------------------

        private readonly Dictionary<string, float> _lastAlertTimes = new Dictionary<string, float>();
        private const float AlertCooldown = 1.5f; // 경보 및 로그 최소 간격 (초)

        // --------------------------------------------------------
        // 3. 초기화 및 이벤트 등록
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            GenerateSessionSalt();
        }

        private void OnEnable()
        {
            // 합법적인 정적 값 변동 이벤트 구독 (EventBus 연동)
            EventBus.Subscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Subscribe<DividendsChangedEvent>(OnDividendsChanged);
            EventBus.Subscribe<InterestChangedEvent>(OnInterestChanged);
            EventBus.Subscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
            EventBus.Subscribe<StatAllocatedEvent>(OnStatAllocated);
            EventBus.Subscribe<StatResetEvent>(OnStatReset);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Unsubscribe<DividendsChangedEvent>(OnDividendsChanged);
            EventBus.Unsubscribe<InterestChangedEvent>(OnInterestChanged);
            EventBus.Unsubscribe<PlayerLevelUpEvent>(OnPlayerLevelUp);
            EventBus.Unsubscribe<StatAllocatedEvent>(OnStatAllocated);
            EventBus.Unsubscribe<StatResetEvent>(OnStatReset);
        }

        /// <summary>
        /// 치트 툴의 동일 메모리 탐색 추적을 방해하기 위해 런타임 시작 시 난수 솔트를 생성합니다.
        /// </summary>
        private void GenerateSessionSalt()
        {
            // 중복 및 0 값 방지를 위한 비트 XOR용 시드 생성
            _xorSalt = (long)(UnityEngine.Random.Range(0x10000000, 0x7FFFFFFF)) | ((long)UnityEngine.Random.Range(0x10000000, 0x7FFFFFFF) << 32);
            if (_xorSalt == 0) _xorSalt = 0x55AA55AAFF00FF00L;
        }

        /// <summary>
        /// 치트 또는 개발자 콘솔 등에서 수치 변동 후 무결성 데이터와 그림자 값을 강제 재동기화합니다.
        /// </summary>
        public void SyncShadows()
        {
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                InitializeShadows(WalletManager.Instance.ActiveSaveData);
            }
        }

        /// <summary>
        /// 특정 세이브 데이터 컨텍스트를 기준으로 정적 그림자 데이터를 생성 및 초기화합니다.
        /// </summary>
        private void InitializeShadows(SaveDataDTO saveData)
        {
            if (saveData == null) return;

            _shadowGoldEncoded = saveData.Gold ^ _xorSalt;
            _shadowDividendsEncoded = saveData.AccumulatedDividends ^ _xorSalt;
            _shadowInterestEncoded = saveData.AccumulatedInterest ^ _xorSalt;

            _shadowLevelEncoded = saveData.PlayerLevel ^ _xorSalt;
            _shadowStatPointsEncoded = saveData.AvailableStatPoints ^ _xorSalt;
            _shadowTradingVolumeEncoded = (int)(saveData.CumulativeTradingVolume & 0x7FFFFFFF) ^ (int)(_xorSalt & 0x7FFFFFFF);

            _shadowAnalysisLvEncoded = saveData.Stats.BaseAnalysisLv ^ (int)(_xorSalt & 0x7FFFFFFF);
            _shadowNegotiationLvEncoded = saveData.Stats.BaseNegotiationLv ^ (int)(_xorSalt & 0x7FFFFFFF);
            _shadowTradingLvEncoded = saveData.Stats.BaseTradingLv ^ (int)(_xorSalt & 0x7FFFFFFF);
            _shadowRecoveryLvEncoded = saveData.Stats.BaseRecoveryLv ^ (int)(_xorSalt & 0x7FFFFFFF);

            _lastAlertTimes.Clear();
            _isInitialized = true;
            Debug.Log($"[DataIntegrity] 신규 세이브 데이터 컨텍스트 감지: 실시간 무결성 모니터링이 시작되었습니다. (Salt: {_xorSalt:X})");
        }

        // --------------------------------------------------------
        // 4. 매 프레임 실시간 무결성 검증 루프 (Update)
        // --------------------------------------------------------

        private void Update()
        {
            if (WalletManager.Instance == null) return;

            var currentSaveData = WalletManager.Instance.ActiveSaveData;
            if (currentSaveData == null) return;

            // 로드 또는 세션 변경 등으로 세이브 데이터 인스턴스가 교체되었는지 확인하여 지능적 재구성
            if (currentSaveData != _lastTrackedSaveData)
            {
                InitializeShadows(currentSaveData);
                _lastTrackedSaveData = currentSaveData;
                return;
            }

            if (!_isInitialized) return;

            // 무단 변조 실시간 판정 검증 (매 프레임 자가 회복 적용)
            VerifyValue(ref currentSaveData.Gold, _shadowGoldEncoded, "Gold (현금)");
            VerifyValue(ref currentSaveData.AccumulatedDividends, _shadowDividendsEncoded, "AccumulatedDividends (누적 배당금)");
            VerifyValue(ref currentSaveData.AccumulatedInterest, _shadowInterestEncoded, "AccumulatedInterest (누적 이자)");

            int currentLevel = currentSaveData.PlayerLevel;
            VerifyValue(ref currentLevel, _shadowLevelEncoded, "PlayerLevel (레벨)");
            if (currentLevel != currentSaveData.PlayerLevel)
            {
                currentSaveData.PlayerLevel = currentLevel;
            }

            int currentStatPoints = currentSaveData.AvailableStatPoints;
            VerifyValue(ref currentStatPoints, _shadowStatPointsEncoded, "AvailableStatPoints (보유 스탯포인트)");
            if (currentStatPoints != currentSaveData.AvailableStatPoints)
            {
                currentSaveData.AvailableStatPoints = currentStatPoints;
            }

            // 4대 스탯 베이스 블록 개별 검증 및 원복
            var stats = currentSaveData.Stats;
            VerifyValue(ref stats.BaseAnalysisLv, _shadowAnalysisLvEncoded, "Stats.BaseAnalysisLv");
            VerifyValue(ref stats.BaseNegotiationLv, _shadowNegotiationLvEncoded, "Stats.BaseNegotiationLv");
            VerifyValue(ref stats.BaseTradingLv, _shadowTradingLvEncoded, "Stats.BaseTradingLv");
            VerifyValue(ref stats.BaseRecoveryLv, _shadowRecoveryLvEncoded, "Stats.BaseRecoveryLv");
            currentSaveData.Stats = stats;

            // 4대 스탯 합산 무결성 2중 수학적 교차 검증 (GDD 5.1 규칙: SUM(Stats) + Available == PlayerLevel)
            if (StatCore.Instance != null && !StatCore.Instance.VerifyStatPointsIntegrity())
            {
                // 스탯 불일치 크래시 변조 감지
                TriggerSecurityEnforcement("Stats Integrity (스탯 합산 정합성)", "불일치", "일치");
                
                // 불법 변조 시 강제 자가 치유: 레벨에 맞는 스탯 강제 초기화
                StatCore.Instance.ResetAllBaseStats();
            }
        }

        // --------------------------------------------------------
        // 5. 개별 무결성 비교 및 자가 치유 연산부
        // --------------------------------------------------------

        private void VerifyValue(ref long liveValue, long encodedShadow, string fieldName)
        {
            long shadowDecrypted = encodedShadow ^ _xorSalt;
            if (liveValue != shadowDecrypted)
            {
                // 무단 변조 발견! (강력한 처벌 및 스로틀링된 보안 알림 트리거)
                TriggerSecurityEnforcement(fieldName, liveValue.ToString(), shadowDecrypted.ToString());

                // 자가 치유 (실시간 원래 상태 강제 롤백 - 치트 툴의 쓰기 무력화)
                liveValue = shadowDecrypted;
            }
        }

        private void VerifyValue(ref int liveValue, int encodedShadow, string fieldName)
        {
            int shadowDecrypted = encodedShadow ^ (int)(_xorSalt & 0x7FFFFFFF);
            if (liveValue != shadowDecrypted)
            {
                // 무단 변조 발견! (강력한 처벌 및 스로틀링된 보안 알림 트리거)
                TriggerSecurityEnforcement(fieldName, liveValue.ToString(), shadowDecrypted.ToString());

                // 자가 치유 (실시간 원래 상태 강제 롤백 - 치트 툴의 쓰기 무력화)
                liveValue = shadowDecrypted;
            }
        }

        /// <summary>
        /// 메모리 치트 적발 및 강력한 인게임 제제 조치를 단행합니다.
        /// </summary>
        private void TriggerSecurityEnforcement(string fieldName, string tamperedValue, string originalValue)
        {
            if (_lastTrackedSaveData != null)
            {
                // 인게임 벌칙 규칙: 계좌 동결 및 NPC 영구 적대화를 유도하는 '적색 수배(RedNotice)'로 직행
                _lastTrackedSaveData.WantedStatus = WantedStatus.RedNotice;
            }

            // ── 경보 및 로그 스로틀링(Throttling) 필터 작동 ──
            float currentTime = Time.time;
            if (_lastAlertTimes.TryGetValue(fieldName, out float lastTime))
            {
                if (currentTime - lastTime < AlertCooldown)
                {
                    // 경보 간 쿨타임인 경우 무한 난사를 방지하기 위해 로깅과 이벤트 발행은 생략합니다. (백그라운드 수배/복원은 유지)
                    return;
                }
            }
            _lastAlertTimes[fieldName] = currentTime;

            // 스로틀링 통과 시에만 로그 출력 및 이벤트 발행
            Debug.LogError($"[DataIntegrity] 🚨 보안 위반 감지! {fieldName} 필드가 불법 변조되었습니다: " +
                           $"변조값={tamperedValue} -> 정상값={originalValue}. 데이터를 강제 원복하고 적색 수배령을 내립니다!");

            // 보안 위반 전역 이벤트 발행 (화면 진동, 사이렌 연출, UI 노이즈 글리치 효과 트리거용)
            EventBus.Publish(new DataTamperedEvent
            {
                FieldName = fieldName,
                TamperedValue = tamperedValue,
                OriginalValue = originalValue
            });
        }

        // --------------------------------------------------------
        // 6. 합법적 이벤트 감청에 따른 그림자 값 동기화부
        // --------------------------------------------------------

        private void OnCashChanged(CashChangedEvent e)
        {
            if (!_isInitialized) return;
            _shadowGoldEncoded = e.NewCash ^ _xorSalt;
        }

        private void OnDividendsChanged(DividendsChangedEvent e)
        {
            if (!_isInitialized) return;
            _shadowDividendsEncoded = e.NewDividends ^ _xorSalt;
        }

        private void OnInterestChanged(InterestChangedEvent e)
        {
            if (!_isInitialized) return;
            _shadowInterestEncoded = e.NewInterest ^ _xorSalt;
        }

        private void OnPlayerLevelUp(PlayerLevelUpEvent e)
        {
            if (!_isInitialized) return;
            _shadowLevelEncoded = e.NewLevel ^ _xorSalt;
            
            // 레벨업 시 스탯 포인트가 합법적으로 증가하므로 섀도 복사 갱신
            if (_lastTrackedSaveData != null)
            {
                _shadowStatPointsEncoded = _lastTrackedSaveData.AvailableStatPoints ^ _xorSalt;
            }
        }

        private void OnStatAllocated(StatAllocatedEvent e)
        {
            if (!_isInitialized) return;
            
            _shadowStatPointsEncoded = e.RemainingPoints ^ _xorSalt;

            // 분배된 개별 스탯 섀도 갱신
            int newLvEncoded = e.NewBaseLevel ^ (int)(_xorSalt & 0x7FFFFFFF);
            switch (e.Stat)
            {
                case StatType.Analysis: _shadowAnalysisLvEncoded = newLvEncoded; break;
                case StatType.Negotiation: _shadowNegotiationLvEncoded = newLvEncoded; break;
                case StatType.Management: _shadowTradingLvEncoded = newLvEncoded; break;
                case StatType.Resilience: _shadowRecoveryLvEncoded = newLvEncoded; break;
            }
        }

        private void OnStatReset(StatResetEvent e)
        {
            if (!_isInitialized) return;

            _shadowStatPointsEncoded = e.RefundedPoints ^ _xorSalt;

            // 모든 베이스 스탯이 0으로 밀림에 따른 섀도 동기화
            int zeroEncoded = 0 ^ (int)(_xorSalt & 0x7FFFFFFF);
            _shadowAnalysisLvEncoded = zeroEncoded;
            _shadowNegotiationLvEncoded = zeroEncoded;
            _shadowTradingLvEncoded = zeroEncoded;
            _shadowRecoveryLvEncoded = zeroEncoded;
        }
    }

    // --------------------------------------------------------
    // 7. 보안 적발 관련 전역 이벤트
    // --------------------------------------------------------

    /// <summary>
    /// 메모리 에디팅이나 수치 무단 해킹 적발 시 발행되는 경고 이벤트.
    /// UI 해킹 안내창 노출, 차트 마구 떨림 효과, 경보음 활성화 등에서 구독합니다.
    /// </summary>
    public struct DataTamperedEvent
    {
        /// <summary>변조 적발된 데이터 필드 이름</summary>
        public string FieldName;

        /// <summary>에디터로 변경하려고 시도한 거짓 수치</summary>
        public string TamperedValue;

        /// <summary>무결성 엔진에 안전하게 봉인되어 있던 정답 수치</summary>
        public string OriginalValue;
    }
}
