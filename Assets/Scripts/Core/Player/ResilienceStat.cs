using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_03 [회복력] 일일 알바(노동) 횟수 확장 및 리셋 엔진.
    /// 플레이어의 회복력(Resilience) 스탯 레벨에 따라 매일 기본 알바 한도를 3~5회로 동적 산출합니다.
    /// UTC 00:00 자정을 지나거나 세이브 로드 시 날짜 변동을 실시간 감지하여 당일 사용 횟수를 자동 클리어(Reset)하며,
    /// 5레벨 달성 특권(10% 확률 차감 무시) 및 에너지 드링크 복용에 의한 한도 회복(+2회) 연산을 관장합니다.
    /// </summary>
    public class ResilienceStat : Singleton<ResilienceStat>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        #region Core Resilience APIs (일일 알바 한도 및 잔량 조회)

        /// <summary>
        /// 회복력 스탯 단계에 따라 플레이어의 금일 최대 알바 가능 횟수를 반환합니다. (기본 3 ~ 최대 5회)
        /// </summary>
        public int GetMaxDailyJobs()
        {
            if (StatCore.Instance == null) return GlobalConstants.BASE_DAILY_JOB_LIMIT;
            return StatCore.Instance.GetDailyJobLimit();
        }

        /// <summary>
        /// 플레이어가 금일 수행할 수 있는 잔여 알바 횟수를 반환합니다. (00:00 자정 리셋 자동 소급)
        /// </summary>
        public int GetRemainingJobs()
        {
            if (WalletManager.Instance == null) return 0;
            
            // 날짜 경계선 선행 검사
            CheckAndResetDailyJobs();

            var saveData = WalletManager.Instance.ActiveSaveData;
            int maxJobs = GetMaxDailyJobs();
            
            return Math.Max(0, maxJobs - saveData.DailyJobsUsed);
        }

        /// <summary>
        /// 금일 추가 알바가 가능한 상태인지 여부를 판별합니다.
        /// </summary>
        public bool CanDoJob()
        {
            return GetRemainingJobs() > 0;
        }

        #endregion

        #region Job Transaction & Consumption (알바 소모 및 회복)

        /// <summary>
        /// 알바를 1회 개시하거나 수령 시 횟수를 소모합니다. 
        /// 회복력 LV 5 패시브가 트리거될 경우 10% 확률로 횟수가 소모되지 않는 불굴의 의지가 발동됩니다.
        /// </summary>
        /// <returns>횟수 소모 성공 여부 (잔여 횟수가 없으면 false 반환)</returns>
        public bool ConsumeJob()
        {
            if (WalletManager.Instance == null) return false;

            // 자정 검사 선행
            CheckAndResetDailyJobs();

            if (!CanDoJob())
            {
                Debug.LogWarning("[ResilienceStat] 알바 실행 거부: 금일 허용된 일일 노동 횟수를 모두 소진했습니다.");
                return false;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            int prevRemaining = GetRemainingJobs();

            // 회복력 LV 5 불굴의 의지 (10% 확률 알바 카운트 보존) 판사
            bool isIgnored = false;
            if (StatCore.Instance != null && StatCore.Instance.ShouldIgnoreJobCountConsumption())
            {
                isIgnored = true;
                Debug.LogWarning("[ResilienceStat] 불굴의 의지 발동! 회복력 만렙(LV 5) 보너스로 알바 소모 카운트가 차감되지 않았습니다. (10% 확률)");
            }

            if (!isIgnored)
            {
                saveData.DailyJobsUsed++;
            }

            int newRemaining = GetRemainingJobs();

            // 알바 소모 전역 이벤트 발행
            EventBus.Publish(new DailyJobConsumedEvent
            {
                WasIgnoredByBuff = isIgnored,
                DailyJobsUsed = saveData.DailyJobsUsed,
                RemainingJobs = newRemaining,
                PreviousRemaining = prevRemaining
            });

            return true;
        }

        /// <summary>
        /// 상점 아이템 '에너지 드링크' 등을 사용하여 당일 알바 수행 가능 횟수를 회복시킵니다. (+2회)
        /// </summary>
        /// <param name="recoveryAmount">회복할 횟수 수치</param>
        public void RecoverJobs(int recoveryAmount)
        {
            if (WalletManager.Instance == null) return;
            if (recoveryAmount <= 0) return;

            // 선행 자정 체크
            CheckAndResetDailyJobs();

            var saveData = WalletManager.Instance.ActiveSaveData;
            int prevRemaining = GetRemainingJobs();

            // 금일 사용 횟수를 차감하여 잔여 알바 횟수를 늘림 (최소 0회 사용 상태 보장)
            saveData.DailyJobsUsed = Math.Max(0, saveData.DailyJobsUsed - recoveryAmount);

            int newRemaining = GetRemainingJobs();
            Debug.Log($"[ResilienceStat] 에너지 드링크 사용 완료: 알바 횟수 +{recoveryAmount}회 회복 (잔량: {prevRemaining} -> {newRemaining})");

            EventBus.Publish(new DailyJobRecoveredEvent
            {
                RecoveredAmount = recoveryAmount,
                NewRemainingJobs = newRemaining
            });
        }

        /// <summary>
        /// 개발자 디버그 모드용 일일 노동 횟수 강제 전원 복구(Reset) 함수입니다.
        /// </summary>
        public void ForceResetDailyJobs()
        {
            if (WalletManager.Instance == null) return;
            var saveData = WalletManager.Instance.ActiveSaveData;

            saveData.DailyJobsUsed = 0;
            saveData.LastJobResetTimeUtc = DateTime.UtcNow;

            Debug.Log("[ResilienceStat] 일일 알바 가능 횟수가 100% 강제 초기화되었습니다.");

            EventBus.Publish(new DailyJobsResetEvent
            {
                ResetTime = saveData.LastJobResetTimeUtc.ToLocalTime(),
                MaxJobsLimit = GetMaxDailyJobs()
            });
        }

        #endregion

        #region Date boundary check (날짜 경계선 감지 자가 정산)

        /// <summary>
        /// 시스템 로컬 시간 기준 00:00 자정 경계선 통과 시 알바 한도를 자동 복구합니다.
        /// </summary>
        private void CheckAndResetDailyJobs()
        {
            if (WalletManager.Instance == null) return;
            var saveData = WalletManager.Instance.ActiveSaveData;

            DateTime nowLocal = DateTime.Now;

            // 최초 시작 세션이거나, 로컬 시간대 기준 마지막 리셋 날짜와 현재 로컬 날짜의 '일(Date)'이 다를 경우 리셋 집행
            if (saveData.LastJobResetTimeUtc == DateTime.MinValue || nowLocal.Date != saveData.LastJobResetTimeUtc.ToLocalTime().Date)
            {
                int prevUsed = saveData.DailyJobsUsed;
                saveData.DailyJobsUsed = 0;
                saveData.LastJobResetTimeUtc = nowLocal.ToUniversalTime(); // 세이브 직렬화 표준 호환을 위해 UTC로 복사 저장

                Debug.Log($"[ResilienceStat] 로컬 자정 도달 자동 알바 횟수 복구 완료: 이전 사용={prevUsed}회 -> 리셋완료 (기준시: {saveData.LastJobResetTimeUtc.ToLocalTime():yyyy-MM-dd HH:mm:ss} Local)");

                EventBus.Publish(new DailyJobsResetEvent
                {
                    ResetTime = saveData.LastJobResetTimeUtc.ToLocalTime(),
                    MaxJobsLimit = GetMaxDailyJobs()
                });
            }
        }

        #endregion
    }

    #region Resilience Events (회복력 노동 이벤트 구조체)

    /// <summary>
    /// 플레이어의 알바 수행에 의해 노동 횟수가 차감 완료되었을 때 발행됩니다.
    /// </summary>
    public struct DailyJobConsumedEvent
    {
        public bool WasIgnoredByBuff;
        public int DailyJobsUsed;
        public int RemainingJobs;
        public int PreviousRemaining;
    }

    /// <summary>
    /// 상점 포션 및 음료 등으로 인해 당일 잔여 알바 횟수가 회복되었을 때 발행됩니다. (UI 리프레시용)
    /// </summary>
    public struct DailyJobRecoveredEvent
    {
        public int RecoveredAmount;
        public int NewRemainingJobs;
    }

    /// <summary>
    /// 00:00 자정이 경과하거나 관리자가 강제 리셋을 처리했을 때 발행됩니다.
    /// </summary>
    public struct DailyJobsResetEvent
    {
        public DateTime ResetTime;
        public int MaxJobsLimit;
    }

    #endregion
}
