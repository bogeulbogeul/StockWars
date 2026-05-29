using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 일일 알바 횟수 제한 및 리셋 시스템.
    /// 플레이어의 회복력(Resilience) 스탯 레벨에 따른 일일 알바 한도(기본 3회 ~ 최대 5회)를 관리하며,
    /// 알바 횟수 소진, 복구, 자정 경과 시 리셋 로직을 관장합니다.
    /// </summary>
    public class JobLimitSystem : Singleton<JobLimitSystem>
    {
        // 애플리케이션 종료 여부 트래킹 (싱글톤 파괴 시 에러 스팸 방지용)
        private static bool _isQuitting = false;

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnApplicationQuit()
        {
            _isQuitting = true;
        }

        /// <summary>
        /// 안전하게 ResilienceStat 싱글톤 인스턴스를 조회합니다.
        /// </summary>
        private ResilienceStat GetSafeStatInstance()
        {
            if (_isQuitting || !Application.isPlaying) return null;
            return ResilienceStat.Instance;
        }

        /// <summary>
        /// 플레이어의 스탯 정보와 세이브 데이터에 입각해 오늘 최대 가능한 알바 횟수 한도를 반환합니다.
        /// </summary>
        public int GetMaxDailyJobsLimit()
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null)
            {
                // 인스턴스가 없을 경우, WalletManager에 세이브 데이터가 준비되어 있다면 직접 조회 폴백
                if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null && StatCore.Instance != null)
                {
                    return StatCore.Instance.GetDailyJobLimit();
                }
                return GlobalConstants.BASE_DAILY_JOB_LIMIT; // 최후의 안전 폴백
            }
            return statInstance.GetMaxDailyJobs();
        }

        /// <summary>
        /// 금일 수행할 수 있는 잔여 알바 횟수를 쿼리합니다.
        /// 내부적으로 UTC 00:00 자정 리셋이 감지되면 자동으로 횟수를 복구한 후 잔량을 반환합니다.
        /// </summary>
        public int GetRemainingJobs()
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null)
            {
                // 인스턴스가 없을 경우 자정 리셋 소급을 건너뛰고 세이브 데이터의 기존 잔량을 강제 계산하는 복구용 폴백
                if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
                {
                    int maxJobs = GetMaxDailyJobsLimit();
                    return Math.Max(0, maxJobs - WalletManager.Instance.ActiveSaveData.DailyJobsUsed);
                }
                return 0;
            }
            return statInstance.GetRemainingJobs();
        }

        /// <summary>
        /// 플레이어가 금일 알바를 추가로 수행할 수 있는 잔여 횟수가 있는지 확인합니다.
        /// </summary>
        public bool CanPerformJob()
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null) return GetRemainingJobs() > 0;
            return statInstance.CanDoJob();
        }

        /// <summary>
        /// 알바 1회를 수행하기 시작하거나 세션 완료 시 횟수 차감을 실행합니다.
        /// 회복력 LV 5 효과가 발동하면 10% 확률로 차감을 면제(무시)합니다.
        /// </summary>
        /// <returns>차감 성공 여부 (잔여 횟수가 부족할 경우 false 반환)</returns>
        public bool ConsumeJobCount()
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null)
            {
                // 치명적 타이밍 경고 (게임 실행 중인데 매니저가 없는 경우에만 경고 출력)
                if (Application.isPlaying && !_isQuitting)
                {
                    Debug.LogError("[JobLimitSystem] ResilienceStat 인스턴스가 존재하지 않아 횟수를 차감할 수 없습니다.");
                }
                return false;
            }

            bool consumed = statInstance.ConsumeJob();

            // 횟수가 정상 소모된 경우, AutoSaveRouter가 전역 이벤트를 감지해 백그라운드 지연 저장을 예약하므로
            // 수동으로 물리 디스크 쓰기를 연타해 프레임 드랍을 유발하지 않고도 데이터 무결성을 유지합니다.
            return consumed;
        }

        /// <summary>
        /// 에너지 드링크 등 회복 소모품을 복용했을 때 알바 사용 횟수를 반출하여 잔여 한도를 늘립니다.
        /// </summary>
        /// <param name="amount">회복시킬 횟수 수량</param>
        public void RecoverJobCount(int amount)
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null)
            {
                if (Application.isPlaying && !_isQuitting)
                {
                    Debug.LogError("[JobLimitSystem] ResilienceStat 인스턴스가 존재하지 않아 횟수를 복구할 수 없습니다.");
                }
                return;
            }
            statInstance.RecoverJobs(amount);
        }

        /// <summary>
        /// 디버그/테스트 편의를 위한 오늘 하루 알바 횟수 전체 강제 초기화(Reset) API입니다.
        /// </summary>
        public void ForceResetDailyJobs()
        {
            var statInstance = GetSafeStatInstance();
            if (statInstance == null) return;
            statInstance.ForceResetDailyJobs();
        }

        /// <summary>
        /// 의도치 않은 비정상 종료 등으로 인한 피로도 데이터 어뷰징을 방지하기 위해,
        /// 즉각적인 강제 저장을 필요로 할 경우 직접 라우터를 호출하는 API입니다.
        /// </summary>
        public void SaveStateImmediately()
        {
            if (AutoSaveRouter.Instance != null && !_isQuitting && Application.isPlaying)
            {
                AutoSaveRouter.Instance.TriggerInstantSave();
            }
        }
    }
}
