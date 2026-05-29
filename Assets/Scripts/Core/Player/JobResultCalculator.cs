using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 최종 스코어 기반 Gold 및 경험치, 찌라시 획득 정산 엔진.
    /// 알바 세션 종료 시 전달받은 화물 운송 결과와 스탯 보너스, 수수료, 잭팟 롤링 및 찌라시 드롭 판정을 
    /// 수학적으로 엄밀히 조율해 최종 정산 데이터를 구성하는 계산부입니다.
    /// </summary>
    public static class JobResultCalculator
    {
        /// <summary>
        /// 알바 최종 정산 계산 결과를 담는 구조체입니다.
        /// </summary>
        public struct JobCalculatedResult
        {
            public JobSystemController.JobGrade Grade;
            public int DeliveredCount;
            public long BaseGold;
            public long FinalGold;
            public int ExpGained;
            public float AppliedFeeRate;
            public long FeeSubtracted;
            public bool IsJackpotTriggered;
            public float FinalRumorChance; // 찌라시 최종 획득 확률 (기본 + 회복력 버프)
            public JobPromotion.PromotionTitle AppliedTitle; // [MOD_GDD_02] 적용된 승급 직급
            public float AppliedPromotionMultiplier;       // [MOD_GDD_02] 적용된 시급 배율
            public int MaxCombo;                            // [MOD_GDD_02] 기록된 최대 콤보 수
            public long ComboBonusGold;                     // [MOD_GDD_02] 산출된 콤보 가산금
        }

        /// <summary>
        /// 알바 세션 실적과 캐릭터 스탯, 위탁 모드 및 패스권 사용 여부를 취합하여 최종 보상 데이터를 계산합니다. (하위 호환용 오버로드)
        /// </summary>
        public static JobCalculatedResult CalculateResult(int deliveredCount, bool isBroken, 
                                                          bool isPassUsed = false, bool isAutoConsignment = false)
        {
            return CalculateResult(deliveredCount, 0, isBroken, isPassUsed, isAutoConsignment);
        }

        /// <summary>
        /// 알바 세션 실적과 캐릭터 스탯, 위탁 모드 및 패스권 사용 여부와 연속 성공 콤보 횟수를 취합하여 최종 보상 데이터를 계산합니다.
        /// </summary>
        /// <param name="deliveredCount">최종 운송 성공 화물 수</param>
        /// <param name="maxCombo">운송 과정에서 달성한 최대 연속 성공 콤보 수</param>
        /// <param name="isBroken">화물 파손 게이지 100% 도달 여부</param>
        /// <param name="isPassUsed">퀵-패스권 사용 여부 (위탁 수수료 0%)</param>
        /// <param name="isAutoConsignment">위탁 자동 완료 여부 (기본 20%, 효율 달성 시 10%)</param>
        /// <returns>최종 정산 결과 구조체</returns>
        public static JobCalculatedResult CalculateResult(int deliveredCount, int maxCombo, bool isBroken, 
                                                          bool isPassUsed = false, bool isAutoConsignment = false)
        {
            // 1. 등급 판정 (GDD v2.25.0 5절)
            JobSystemController.JobGrade grade = EvaluateGrade(deliveredCount, isBroken);
            
            // 2. 기본 보상 룩업
            long baseGold = GetBaseGoldReward(grade);
            int expReward = GetBaseExpReward(grade);
            float baseRumorChance = GetBaseRumorChance(grade);

            // 3. 협상력 스탯 가산 배율 및 알바 승급 배율 적용 (StatCore & JobPromotion 연동)
            float negotiationMultiplier = StatCore.Instance != null 
                ? StatCore.Instance.GetJobRewardMultiplier() 
                : 1.0f;

            // [Off-by-One 보정]: 이번 세션 완료를 소급하여 'totalJobs + 1' 회차 기준으로 직급 배율을 반영합니다.
            // 플레이어가 이번 세션 완료와 동시에 승급선에 도달할 경우, 인상된 시급을 즉각 당일 보상에 소급 적용받게 돕습니다.
            int totalJobs = WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null
                ? WalletManager.Instance.ActiveSaveData.TotalJobsCompleted 
                : 0;
            int anticipatedTotalJobs = totalJobs + 1;

            float promotionMultiplier = JobPromotion.GetPromotionMultiplier(anticipatedTotalJobs);

            // [합산(Additive) 밸런싱 개정]: 곱연산으로 인한 과도한 재화 인플레이션(예: 1.3 * 1.5 = 1.95배)을 억제하기 위해,
            // 협상력 스탯 보너스와 시급 승급 보너스를 합산(예: 1.3 + 1.5 - 1.0 = 1.80배) 방식으로 공식 개정합니다.
            float combinedMultiplier = negotiationMultiplier + promotionMultiplier - 1.0f;

            // 3.5. 연속 운송 성공 콤보 보너스 금액 산출 (ComboSystem 연동)
            long comboBonusGold = ComboSystem.CalculateComboBonus(maxCombo);

            // 협상력 및 승급 보너스가 합산 방식으로 융합된 세전 골드 + 콤보 보너스 골드 합산
            // 콤보 보너스 골드는 순수 숙련도 실력 포상이므로, 수수료를 떼기 전 세전 골드에 직접 합산해줍니다.
            long preTaxGold = (long)(baseGold * combinedMultiplier) + comboBonusGold;

            // 4. 위탁 수수료 산출 및 적용 (GDD 7.1 & 7.2절)
            float feeRate = CalculateFeeRate(isPassUsed, isAutoConsignment);
            long feeSubtracted = (long)(preTaxGold * feeRate);
            long finalGold = preTaxGold - feeSubtracted;

            // 5. 황금 기회 잭팟 판정 (S등급 한정, 0.002% 확률로 10배, 최대 8,000G 한도 캡)
            // 부동소수점 오차 차단을 위해 정밀 정수 매칭(1/50,000) 기법 적용
            bool jackpotTriggered = false;
            if (grade == JobSystemController.JobGrade.S)
            {
                jackpotTriggered = TryJackpotOpportunity(ref finalGold);
            }

            // 6. 찌라시 획득 최종 확률 연산 (회복력 LV 3 패시브 버프 가산 반영)
            // NOTE: 2중 롤링 및 야간 보정(2배) 누락 버그 방지를 위해 주사위 판정은 이벤트를 수신한
            //       RumorGenerator가 독자적으로 집행합니다. 본 엔진은 스탯이 가산된 순수 최종 확률만 도출합니다.
            float resilienceBonusChance = StatCore.Instance != null 
                ? StatCore.Instance.GetJobRumorFindBonus() 
                : 0.0f;

            float finalRumorChance = baseRumorChance > 0f 
                ? baseRumorChance + resilienceBonusChance 
                : 0f; // C등급(기본 확률 0%)은 추가 버프가 있더라도 획득 불가 규정 고수

            return new JobCalculatedResult
            {
                Grade = grade,
                DeliveredCount = deliveredCount,
                BaseGold = baseGold,
                FinalGold = finalGold,
                ExpGained = expReward,
                AppliedFeeRate = feeRate,
                FeeSubtracted = feeSubtracted,
                IsJackpotTriggered = jackpotTriggered,
                FinalRumorChance = finalRumorChance,
                AppliedTitle = JobPromotion.GetCurrentTitle(anticipatedTotalJobs),
                AppliedPromotionMultiplier = promotionMultiplier,
                MaxCombo = maxCombo,
                ComboBonusGold = comboBonusGold
            };
        }

        /// <summary>
        /// 화물 수와 파손 플래그에 따라 최종 등급을 결정합니다. (GDD 5절 수치 정렬)
        /// </summary>
        public static JobSystemController.JobGrade EvaluateGrade(int deliveredCount, bool isBroken)
        {
            if (isBroken) return JobSystemController.JobGrade.C;
            if (deliveredCount >= 10) return JobSystemController.JobGrade.S;
            if (deliveredCount >= 7)  return JobSystemController.JobGrade.A;
            if (deliveredCount >= 4)  return JobSystemController.JobGrade.B;
            return JobSystemController.JobGrade.C;
        }

        /// <summary>
        /// 등급별 기본 골드 보상을 반환합니다.
        /// </summary>
        public static long GetBaseGoldReward(JobSystemController.JobGrade grade)
        {
            return grade switch
            {
                JobSystemController.JobGrade.S => 800L,
                JobSystemController.JobGrade.A => 560L,
                JobSystemController.JobGrade.B => 320L,
                JobSystemController.JobGrade.C => 100L,
                _ => 100L
            };
        }

        /// <summary>
        /// 등급별 기본 경험치 보상을 반환합니다.
        /// </summary>
        public static int GetBaseExpReward(JobSystemController.JobGrade grade)
        {
            return grade switch
            {
                JobSystemController.JobGrade.S => 100,
                JobSystemController.JobGrade.A => 70,
                JobSystemController.JobGrade.B => 40,
                JobSystemController.JobGrade.C => 10,
                _ => 10
            };
        }

        /// <summary>
        /// 등급별 기본 찌라시 획득 확률을 반환합니다.
        /// </summary>
        public static float GetBaseRumorChance(JobSystemController.JobGrade grade)
        {
            return grade switch
            {
                JobSystemController.JobGrade.S => 0.30f,
                JobSystemController.JobGrade.A => 0.15f,
                JobSystemController.JobGrade.B => 0.05f,
                JobSystemController.JobGrade.C => 0.00f,
                _ => 0.00f
            };
        }

        /// <summary>
        /// GDD 7.1/7.2 규격에 의거한 위탁 수수료율을 산정합니다.
        /// 패스권 = 0%, 직접 플레이 = 0%, 위탁 자동 = 기본 20% (누적 100회 + 회복력 LV 5 충족 시 10%)
        /// </summary>
        public static float CalculateFeeRate(bool isPassUsed, bool isAutoConsignment)
        {
            if (isPassUsed) return 0f;          // 퀵-패스: 0%
            if (!isAutoConsignment) return 0f;  // 직접 플레이: 0%

            // 위탁 효율 업그레이드 조건 검사
            if (IsConsignmentEfficiencyUnlocked())
            {
                return 0.10f; // 10%로 감면
            }
            return 0.20f; // 기본 20%
        }

        /// <summary>
        /// GDD 7.2절 위탁 관리 효율 해금 조건 충족 여부:
        /// 비트 물류 누적 100회 클리어 + 회복력 스탯 LV 5 달성.
        /// </summary>
        private static bool IsConsignmentEfficiencyUnlocked()
        {
            if (WalletManager.Instance == null) return false;
            var saveData = WalletManager.Instance.ActiveSaveData;

            bool hasEnoughClears = saveData.TotalJobsCompleted >= 100;
            bool hasResilienceLv5 = StatCore.Instance != null &&
                                     StatCore.Instance.GetBaseStat(StatType.Resilience) >= 5;

            return hasEnoughClears && hasResilienceLv5;
        }

        /// <summary>
        /// S등급 달성 시 0.002% 확률로 10배 잭팟(최대 8,000G 한도 캡)을 판정합니다.
        /// </summary>
        /// <remarks>
        /// float 부동소수점 오차로 인한 정밀도 누수를 상쇄하기 위해 정밀 정수 매칭(1/50,000) 기법을 사용합니다.
        /// 추후 RNG 결정론적 디버깅/재현 테스트를 위해 UnityEngine.Random 대신 RNG_System 주입이 가능하도록 고려되었습니다.
        /// </remarks>
        private static bool TryJackpotOpportunity(ref long currentGold)
        {
            const int JACKPOT_DENOMINATOR = 50000; // 0.002% = 1 / 50,0000
            const long MAX_JACKPOT = 8000L;       // GDD 6절 최대 잭팟 상한선

            // 0부터 49999 사이의 무작위 정수 생성 (정확히 1/50,000 확률)
            int roll = UnityEngine.Random.Range(0, JACKPOT_DENOMINATOR);
            if (roll == 0)
            {
                long jackpotGold = Math.Min(currentGold * 10L, MAX_JACKPOT);
                currentGold = jackpotGold;
                return true;
            }
            return false;
        }
    }
}
