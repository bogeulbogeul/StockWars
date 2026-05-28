using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 전체 노동(알바) 리스트 및 보상 데이터 매크로 관리 컨트롤러.
    /// 게임 내 유일한 노동 구역 '비트 물류(Bit Logistics)'의 등급별 보상 테이블 및 특수 메커니즘
    /// (황금 기회 잭팟, 위탁 수수료, 패스권)을 정의하고, 세션 결과를 판정·지급하는 총괄 엔진입니다.
    /// </summary>
    public class JobSystemController : Singleton<JobSystemController>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        #region Job Grade Definitions (등급 판정 테이블)

        /// <summary>
        /// 알바 등급 열거형. MOD_GDD_02 5절 작업량 기반 등급 판정표와 1:1 대응합니다.
        /// </summary>
        public enum JobGrade
        {
            C = 0,  // Below: 4개 미만 or 파손
            B = 1,  // Normal: 4~6개
            A = 2,  // Good: 7~9개
            S = 3   // Excellent: 10개 이상
        }

        /// <summary>
        /// 등급별 보상 데이터 구조체 (GDD 5절 테이블).
        /// </summary>
        [Serializable]
        public struct JobRewardData
        {
            public JobGrade Grade;
            public int MinCargoCount;   // 이 등급 진입 최소 화물 수 (C등급은 0으로 설정)
            public long GoldReward;     // 기본 Gold 보상
            public int ExpReward;       // EXP 보상
            public float RumorChance;   // 찌라시 획득 확률 (0~1)
        }

        /// <summary>
        /// GDD 5절에 정의된 4등급 보상 마스터 테이블 (읽기 전용 정적 데이터).
        /// </summary>
        private static readonly JobRewardData[] RewardTable = new JobRewardData[]
        {
            new JobRewardData { Grade = JobGrade.S, MinCargoCount = 10, GoldReward = 800L,  ExpReward = 100, RumorChance = 0.30f },
            new JobRewardData { Grade = JobGrade.A, MinCargoCount = 7,  GoldReward = 560L,  ExpReward = 70,  RumorChance = 0.15f },
            new JobRewardData { Grade = JobGrade.B, MinCargoCount = 4,  GoldReward = 320L,  ExpReward = 40,  RumorChance = 0.05f },
            new JobRewardData { Grade = JobGrade.C, MinCargoCount = 0,  GoldReward = 100L,  ExpReward = 10,  RumorChance = 0.00f },
        };

        #endregion

        #region Grade Evaluation (등급 판정 API)

        /// <summary>
        /// 세션 종료 시점의 운송 성공 화물 수를 기반으로 최종 알바 등급을 판정합니다.
        /// 화물 파손(isBroken)이 발생했을 경우 무조건 C등급으로 판정합니다.
        /// </summary>
        /// <param name="deliveredCount">운송 성공한 화물 수</param>
        /// <param name="isBroken">파손 게이지 100% 초과 여부</param>
        public JobGrade EvaluateGrade(int deliveredCount, bool isBroken)
        {
            if (isBroken)
            {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
                // 파손은 정상 게임플레이 흐름이므로 개발 빌드에서만 로그 출력 (릴리스 스팸 방지)
                Debug.Log($"[JobSystemController] 화물 파손 판정 → 강제 C등급 (운송 수: {deliveredCount})");
#endif
                return JobGrade.C;
            }

            if (deliveredCount >= 10) return JobGrade.S;
            if (deliveredCount >= 7)  return JobGrade.A;
            if (deliveredCount >= 4)  return JobGrade.B;
            return JobGrade.C;
        }

        /// <summary>
        /// 주어진 등급에 해당하는 보상 데이터를 반환합니다.
        /// </summary>
        public JobRewardData GetRewardData(JobGrade grade)
        {
            foreach (var reward in RewardTable)
            {
                if (reward.Grade == grade) return reward;
            }

            // 폴백: 배열 순서 의존 제거 — Grade 기준으로 C등급을 명시적으로 탐색
            Debug.LogError($"[JobSystemController] 알 수 없는 등급 값: {grade} — C등급으로 강제 폴백");
            foreach (var reward in RewardTable)
            {
                if (reward.Grade == JobGrade.C) return reward;
            }

            // 최후 안전망: 테이블 자체가 비어있는 극단적 상황
            Debug.LogError("[JobSystemController] RewardTable이 비어 있어 기본값 구조체를 반환합니다.");
            return default;
        }

        #endregion

        #region Reward Dispatch (보상 지급 처리)

        /// <summary>
        /// 알바 세션 결과를 판정하고 Gold 및 EXP를 지급합니다.
        /// 협상력 스탯 배율, 위탁 수수료, 패스권 여부를 모두 반영하여 최종 지급액을 산출합니다.
        /// </summary>
        /// <param name="deliveredCount">운송 성공 화물 수</param>
        /// <param name="isBroken">파손 여부</param>
        /// <param name="isPassUsed">퀵-패스권 사용 여부 (사용 시 수수료 0%)</param>
        /// <param name="isAutoConsignment">위탁 자동 완료 여부 (패스권 미사용 자동 시 수수료 20%)</param>
        /// <returns>최종 지급된 Gold 수량</returns>
        public long DispatchJobReward(int deliveredCount, bool isBroken,
                                      bool isPassUsed = false, bool isAutoConsignment = false)
        {
            if (WalletManager.Instance == null)
            {
                Debug.LogError("[JobSystemController] WalletManager 인스턴스 없음 — 보상 지급 불가");
                return 0L;
            }

            JobGrade grade = EvaluateGrade(deliveredCount, isBroken);
            JobRewardData reward = GetRewardData(grade);

            // ① 협상력 스탯 배율 적용 (StatCore 기반)
            float negotiationMultiplier = StatCore.Instance != null
                ? StatCore.Instance.GetJobRewardMultiplier()
                : 1.0f;

            // ② 위탁 수수료 적용 (GDD 7.2절)
            // NOTE: 이전에는 baseGold를 (long) 캐스팅 후 다시 feeRate 적용 시 (long) 캐스팅하여
            //       소수점 손실이 2회 발생했습니다. 단일 연산으로 통합하여 손실 1회로 줄입니다.
            float feeRate = CalculateFeeRate(isPassUsed, isAutoConsignment);
            long finalGold = (long)(reward.GoldReward * negotiationMultiplier * (1f - feeRate));

            // ③ 황금 기회 잭팟 판정 (S등급 전용, 0.002%)
            bool jackpotTriggered = false;
            if (grade == JobGrade.S)
            {
                jackpotTriggered = TryGoldenOpportunity(ref finalGold);
            }

            // ④ Gold 지급
            WalletManager.Instance.AddGold(finalGold, "알바 보상 지급");

            // ⑤ EXP 지급
            if (LevelEngine.Instance != null)
            {
                LevelEngine.Instance.AddExp(reward.ExpReward);
            }

            // ⑥ 누적 알바 횟수 기록
            // NOTE: 이전에는 외부 호출자가 RecordJobCompletion()을 수동으로 호출해야 했으나,
            //       호출 누락 시 위탁 효율 해금 조건(100회)이 영구 미달성되는 버그가 있었습니다.
            //       DispatchJobReward() 내에서 직접 처리하여 누락 가능성을 제거합니다.
            WalletManager.Instance.ActiveSaveData.TotalJobsCompleted++;

            Debug.Log($"[JobSystemController] 알바 완료 | 등급={grade} | 화물={deliveredCount}개 | " +
                      $"기본={reward.GoldReward}G | 협상배율={negotiationMultiplier:F2}x | " +
                      $"수수료율={feeRate:P0} | 최종지급={finalGold}G | 잭팟={jackpotTriggered} | " +
                      $"누적횟수={WalletManager.Instance.ActiveSaveData.TotalJobsCompleted}회");

            // ⑦ 전역 이벤트 발행
            EventBus.Publish(new JobSessionCompletedEvent
            {
                Grade            = grade,
                DeliveredCount   = deliveredCount,
                BaseGold         = reward.GoldReward,
                FinalGold        = finalGold,
                ExpGained        = reward.ExpReward,
                FeeRate          = feeRate,
                JackpotTriggered = jackpotTriggered,
                RumorChance      = reward.RumorChance
            });

            return finalGold;
        }

        #endregion

        #region Fee Calculation (수수료 연산)

        /// <summary>
        /// 패스권 사용 여부 및 위탁 자동 완료 여부에 따른 위탁 수수료율을 반환합니다.
        /// GDD 7.1 / 7.2절 기준: 패스권=0%, 위탁=20% (숙련도 조건 충족 시 10%)
        /// </summary>
        private float CalculateFeeRate(bool isPassUsed, bool isAutoConsignment)
        {
            if (isPassUsed) return 0f;          // 퀵-패스권: 수수료 면제
            if (!isAutoConsignment) return 0f;  // 직접 플레이: 수수료 없음

            // 위탁 자동 완료: 기본 20%, 숙련도 조건 충족 시 10%
            if (IsConsignmentEfficiencyUnlocked())
            {
                Debug.Log("[JobSystemController] 위탁 효율 업그레이드 적용 → 수수료 10%");
                return 0.10f;
            }
            return 0.20f;
        }

        /// <summary>
        /// GDD 7.2절 위탁 관리 효율 해금 조건 충족 여부:
        /// 비트 물류 누적 100회 클리어 + 회복력 스탯 LV 5 달성.
        /// </summary>
        private bool IsConsignmentEfficiencyUnlocked()
        {
            if (WalletManager.Instance == null) return false;
            var saveData = WalletManager.Instance.ActiveSaveData;

            bool hasEnoughClears   = saveData.TotalJobsCompleted >= 100;
            bool hasResilienceLv5  = StatCore.Instance != null &&
                                     StatCore.Instance.GetBaseStat(StatType.Resilience) >= 5;

            return hasEnoughClears && hasResilienceLv5;
        }

        #endregion

        #region Golden Opportunity (황금 기회 잭팟)

        /// <summary>
        /// GDD 6절 황금 기회(Golden Opportunity): S등급 달성 시 0.002% 확률로 보상 10배 지급.
        /// </summary>
        /// <remarks>
        /// MAX_JACKPOT(8,000G) 캡으로 인해 협상력이 높은 플레이어는 항상 8,000G 고정 수령합니다.
        /// 예) 협상 LV5 → finalGold 1,040G × 10 = 10,400G → 캡 적용 → 8,000G
        /// 이는 GDD에서 "최대 8,000G 잭팟"으로 명시된 의도된 동작입니다.
        /// </remarks>
        private bool TryGoldenOpportunity(ref long currentGold)
        {
            const float JACKPOT_CHANCE = 0.00002f; // 0.002% = 0.00002 (1/50,000 확률)
            const long  MAX_JACKPOT    = 8000L;    // GDD 6절 최대 잭팟 상한선

            float roll = UnityEngine.Random.value;
            if (roll > JACKPOT_CHANCE) return false;

            long jackpotGold = Math.Min(currentGold * 10L, MAX_JACKPOT);
            Debug.LogWarning($"[JobSystemController] ★ 황금 기회 발동! 잭팟 보상: {jackpotGold}G (10배, 최대 {MAX_JACKPOT}G 캡)");
            currentGold = jackpotGold;
            return true;
        }

        #endregion

        #region Session Counter (누적 클리어 카운터)

        /// <summary>
        /// [Deprecated] 누적 알바 횟수 기록은 이제 DispatchJobReward() 내부에서 자동 처리됩니다.
        /// 이 메서드는 하위 호환성을 위해 유지되며, 직접 호출 시 중복 카운트가 발생하지 않도록
        /// DispatchJobReward()를 우회한 특수 케이스(에디터 테스트 등)에만 사용하세요.
        /// </summary>
        [System.Obsolete("DispatchJobReward() 내부에서 자동 처리됩니다. 직접 호출 불필요.")]
        public void RecordJobCompletion()
        {
            if (WalletManager.Instance == null) return;
            WalletManager.Instance.ActiveSaveData.TotalJobsCompleted++;
            Debug.Log($"[JobSystemController] (수동) 누적 알바 완료: {WalletManager.Instance.ActiveSaveData.TotalJobsCompleted}회");
        }

        /// <summary>
        /// 현재까지의 누적 알바 완료 횟수를 반환합니다.
        /// </summary>
        public int GetTotalJobsCompleted()
        {
            return WalletManager.Instance?.ActiveSaveData.TotalJobsCompleted ?? 0;
        }

        #endregion

        #region Utility (보상 미리보기 / 디버그)

        /// <summary>
        /// 특정 화물 수에 대한 보상 미리보기를 반환합니다. (UI 보상 예측 표시용)
        /// </summary>
        public JobRewardData PreviewReward(int deliveredCount, bool isBroken = false)
        {
            JobGrade grade = EvaluateGrade(deliveredCount, isBroken);
            return GetRewardData(grade);
        }

        /// <summary>
        /// 전체 보상 테이블을 반환합니다. (UI 알바 안내 화면용)
        /// </summary>
        public IReadOnlyList<JobRewardData> GetFullRewardTable()
        {
            return RewardTable;
        }

        #endregion
    }

    #region Job Session Events (노동 세션 이벤트 구조체)

    /// <summary>
    /// 알바 세션 1회가 완전히 종료되고 보상 지급이 완료되었을 때 발행됩니다.
    /// RumorGenerator, UI, 통계 트래커 등이 이 이벤트를 구독합니다.
    /// </summary>
    public struct JobSessionCompletedEvent
    {
        public JobSystemController.JobGrade Grade;
        public int   DeliveredCount;
        public long  BaseGold;
        public long  FinalGold;
        public int   ExpGained;
        public float FeeRate;
        public bool  JackpotTriggered;
        public float RumorChance; // 찌라시 획득 시도에 전달할 확률값
    }

    #endregion
}
