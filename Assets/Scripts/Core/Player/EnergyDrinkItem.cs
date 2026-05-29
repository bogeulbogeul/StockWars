using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 에너지 드링크 아이템 관리 및 복구 로직.
    /// 플레이어가 500 Gold를 지불하고 '에너지 드링크'를 구입하여 복용하면,
    /// 금일 잔여 알바(노동) 가능 횟수를 2회 즉각 회복시킵니다.
    /// </summary>
    public class EnergyDrinkItem : Singleton<EnergyDrinkItem>
    {
        /// <summary>에너지 드링크 구매 가격 (500 Gold 고정)</summary>
        public const long DRINK_COST = 500L;

        /// <summary>에너지 드링크 사용 시 복구되는 알바 횟수 (+2회)</summary>
        public const int RECOVERY_AMOUNT = 2;

        // 애플리케이션 종료 여부 트래킹 (싱글톤 소멸 시 참조 방지)
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
        /// 에너지 드링크를 구매하여 횟수를 복구할 수 있는 정당한 조건인지 검증합니다.
        /// (지갑의 자산 확인 및 금일 알바 횟수 소진 여부 교차 검산)
        /// </summary>
        public bool CanBuyDrink()
        {
            if (_isQuitting || WalletManager.Instance == null || JobLimitSystem.Instance == null) return false;

            // 가드 1: 500 Gold 이상 소유하고 있는지 검사
            bool hasEnoughGold = WalletManager.Instance.GetCash() >= DRINK_COST;
            if (!hasEnoughGold) return false;

            // 가드 2: 오늘 소모한 알바 횟수가 1회라도 존재하는지 검사 (최대 한도 상태에서의 무상 낭비 방지)
            int remaining = JobLimitSystem.Instance.GetRemainingJobs();
            int limit = JobLimitSystem.Instance.GetMaxDailyJobsLimit();
            bool hasConsumedJobs = remaining < limit;

            return hasConsumedJobs;
        }

        /// <summary>
        /// 에너지 드링크를 500G에 구매하여 즉시 알바 수행 횟수를 2회 회복합니다.
        /// [트랜잭션 원자성 보장]: 복구 처리 도중 오류가 발생하면 차감된 500G를 즉시 환원(롤백) 처리합니다.
        /// 사용 성공 시 즉각 영속 저장을 트리거하여 데이터 유실 및 강제 종료 어뷰징을 차단합니다.
        /// </summary>
        /// <returns>구매 및 사용 성공 여부 (잔고 부족, 한도 최대 상태, 초기화 실패 시 false)</returns>
        public bool BuyAndUseDrink()
        {
            if (_isQuitting) return false;

            if (WalletManager.Instance == null || JobLimitSystem.Instance == null)
            {
                Debug.LogError("[EnergyDrinkItem] 지갑 또는 알바 관리 매니저 인프라가 준비되지 않아 아이템 사용이 불가합니다.");
                return false;
            }

            // 1. 최대 한도 상태에서의 드링크 중복 구매 및 무상 증발 방지 가드링
            int remaining = JobLimitSystem.Instance.GetRemainingJobs();
            int limit = JobLimitSystem.Instance.GetMaxDailyJobsLimit();
            if (remaining >= limit)
            {
                Debug.LogWarning($"[EnergyDrinkItem] 드링크 구매 거부: 이미 알바 가능 횟수가 최대치({limit}회)입니다. 낭비를 방지합니다.");
                return false;
            }

            // 2. 가용 골드 500G 선차감 시도
            if (!WalletManager.Instance.SpendCash(DRINK_COST))
            {
                Debug.LogWarning($"[EnergyDrinkItem] 드링크 구매 실패: 잔고 부족. 필요={DRINK_COST}G, 보유={WalletManager.Instance.GetCash()}G");
                return false;
            }

            // 3. 알바 사용 횟수 +2회 회복 집행 및 세이브 트리거
            // (예외 발생 시 차감 골드를 복구하는 원자적 롤백 메커니즘 가동)
            try
            {
                // 알바 사용 횟수 회복
                JobLimitSystem.Instance.RecoverJobCount(RECOVERY_AMOUNT);

                int newRemaining = JobLimitSystem.Instance.GetRemainingJobs();

                // 드링크 소비 전역 이벤트 발행 (UI 사운드 연출 및 퀘스트 트리거용)
                EventBus.Publish(new EnergyDrinkUsedEvent
                {
                    CostPaid = DRINK_COST,
                    RecoveredJobsCount = RECOVERY_AMOUNT,
                    NewRemainingJobs = newRemaining
                });

                Debug.Log($"[EnergyDrinkItem] 에너지 드링크 구매 및 사용 성공! {DRINK_COST}G 소모 → 알바 횟수 +{RECOVERY_AMOUNT}회 회복 (잔량: {remaining} -> {newRemaining})");

                // 강제 종료 어뷰징을 방지하기 위한 즉시 강제 세이브 단행
                JobLimitSystem.Instance.SaveStateImmediately();

                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[EnergyDrinkItem] 복구 처리 과정 중 치명적 예외 감지! 트랜잭션을 철회하고 소모된 {DRINK_COST}G를 롤백합니다.");
                Debug.LogException(ex);

                // 원자적 트랜잭션 롤백: 지출했던 골드 즉각 복구 환원
                WalletManager.Instance.AddCash(DRINK_COST);

                return false;
            }
        }
    }

    #region Energy Drink Event Definitions

    /// <summary>
    /// 플레이어가 에너지 드링크를 소모하고 횟수 복구를 받았을 때 발행되는 전역 이벤트입니다.
    /// </summary>
    public struct EnergyDrinkUsedEvent
    {
        public long CostPaid;
        public int RecoveredJobsCount;
        public int NewRemainingJobs;
    }

    #endregion
}
