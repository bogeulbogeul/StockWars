using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_03 플레이어 스탯 및 성장 코어 매니저.
    /// Base Block(최대 5블록)과 외부 요인에 따른 Bonus Fragment를 실시간 합산하여 최종 스탯 보정 효과를 연산합니다.
    /// 스탯 포인트 분배 및 스탯 데이터 무결성(SUM(Base) == PlayerLevel) 검증 엔진을 포함합니다.
    /// </summary>
    public class StatCore : Singleton<StatCore>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        #region Core Stat Retrieval (스탯 이원화 합산 API)

        /// <summary>
        /// 특정 스탯의 투자된 기본 블록 수(Base Blocks, Max 5)를 조회합니다.
        /// </summary>
        public int GetBaseStat(StatType type)
        {
            if (WalletManager.Instance == null) return 0;
            var stats = WalletManager.Instance.ActiveSaveData.Stats;
            
            return type switch
            {
                StatType.Analysis => stats.BaseAnalysisLv,
                StatType.Negotiation => stats.BaseNegotiationLv,
                StatType.Management => stats.BaseTradingLv,
                StatType.Resilience => stats.BaseRecoveryLv,
                _ => 0
            };
        }

        /// <summary>
        /// 특정 스탯의 가구/책/버프로 획득한 보너스 파편 수치(Bonus Fragments)를 조회합니다.
        /// </summary>
        public float GetBonusStat(StatType type)
        {
            if (WalletManager.Instance == null) return 0f;
            var stats = WalletManager.Instance.ActiveSaveData.Stats;

            return type switch
            {
                StatType.Analysis => stats.BonusAnalysisVal,
                StatType.Negotiation => stats.BonusNegotiationVal,
                StatType.Management => stats.BonusTradingVal,
                StatType.Resilience => stats.BonusRecoveryVal,
                _ => 0f
            };
        }

        /// <summary>
        /// GDD 3.1 공식에 의한 최종 스탯 효과 수치 반환.
        /// 공식: Final_Effect = (Base_Stat * 1.0f) + Bonus_Value
        /// </summary>
        public float GetFinalStat(StatType type)
        {
            int baseStat = GetBaseStat(type);
            float bonus = GetBonusStat(type);
            return (baseStat * 1.0f) + bonus;
        }

        #endregion

        #region 스탯 분배 및 무결성 검증 (Point Allocation & Integrity)

        /// <summary>
        /// 보유한 스탯 포인트를 소비하여 특정 능력치(Base)를 1레벨 성장시킵니다. (Max 5)
        /// </summary>
        public bool AllocateStatPoint(StatType type)
        {
            if (WalletManager.Instance == null) return false;
            var saveData = WalletManager.Instance.ActiveSaveData;

            if (saveData.AvailableStatPoints <= 0)
            {
                Debug.LogWarning("[StatCore] 투자 가능한 스탯 포인트가 부족합니다.");
                return false;
            }

            int currentBase = GetBaseStat(type);
            if (currentBase >= 5)
            {
                Debug.LogWarning($"[StatCore] {type} 능력치는 이미 최대 베이스 레벨(LV 5)에 도달해 더 이상 투자할 수 없습니다.");
                return false;
            }

            // DTO 내 실시간 필드 갱신
            var stats = saveData.Stats;
            switch (type)
            {
                case StatType.Analysis: stats.BaseAnalysisLv++; break;
                case StatType.Negotiation: stats.BaseNegotiationLv++; break;
                case StatType.Management: stats.BaseTradingLv++; break;
                case StatType.Resilience: stats.BaseRecoveryLv++; break;
            }
            saveData.Stats = stats; // Struct 값 이식 복사
            saveData.AvailableStatPoints--;

            Debug.Log($"[StatCore] 스탯 분배 완료: {type} Base레벨 상승 ({currentBase} -> {currentBase + 1}), 남은포인트={saveData.AvailableStatPoints}");

            // 무결성 즉시 자가 검증
            if (!VerifyStatPointsIntegrity())
            {
                Debug.LogError("[StatCore] 심각한 정합성 경고: SUM(Base_Blocks) + Available == PlayerLevel 무결성 검증이 불일치합니다!");
            }

            // 스탯 변경 이벤트 전역 발행 (UI 갱신용)
            EventBus.Publish(new StatAllocatedEvent
            {
                Stat = type,
                NewBaseLevel = currentBase + 1,
                RemainingPoints = saveData.AvailableStatPoints
            });

            return true;
        }

        /// <summary>
        /// GDD 5절 스탯 재분배 약물 사용 시 호출되어, 투자된 모든 Base 포인트를 회수하고 사용 가능한 포인트로 변환합니다.
        /// (최초 생성 시의 1포인트는 제외하고 회수하는 예방적 규칙을 적용합니다.)
        /// </summary>
        public void ResetAllBaseStats()
        {
            if (WalletManager.Instance == null) return;
            var saveData = WalletManager.Instance.ActiveSaveData;

            var stats = saveData.Stats;
            int totalBaseSpent = stats.BaseAnalysisLv + stats.BaseNegotiationLv + stats.BaseTradingLv + stats.BaseRecoveryLv;
            
            // 최초 기획: 1레벨 시 1포인트 강제 선택 성향 추가 활성화이므로, 전체 회수 후 회수 가능한 잔여분을 지급
            // 데이터 붕괴 방지를 위해 모든 베이스 스탯을 0으로 밀고, Level 만큼 포인트를 일괄 제공하여 안전한 재투자를 보장합니다.
            stats.BaseAnalysisLv = 0;
            stats.BaseNegotiationLv = 0;
            stats.BaseTradingLv = 0;
            stats.BaseRecoveryLv = 0;
            saveData.Stats = stats;

            saveData.AvailableStatPoints = saveData.PlayerLevel;

            Debug.LogWarning($"[StatCore] 스탯 초기화 약물 작동 완료: 모든 베이스 스탯이 초기화되었으며 {saveData.AvailableStatPoints} 포인트가 반환되었습니다.");
            
            EventBus.Publish(new StatResetEvent
            {
                RefundedPoints = saveData.AvailableStatPoints
            });
        }

        /// <summary>
        /// GDD 5.1 데이터 무결성 규칙: [투자된 스탯 합 + 남은 스탯] == [플레이어 레벨] 검증 로직.
        /// </summary>
        public bool VerifyStatPointsIntegrity()
        {
            if (WalletManager.Instance == null) return true;
            var saveData = WalletManager.Instance.ActiveSaveData;

            int sum = saveData.Stats.BaseAnalysisLv +
                      saveData.Stats.BaseNegotiationLv +
                      saveData.Stats.BaseTradingLv +
                      saveData.Stats.BaseRecoveryLv;

            int totalExpected = saveData.PlayerLevel;
            int currentActual = sum + saveData.AvailableStatPoints;

            return currentActual == totalExpected;
        }

        #endregion

        #region 능력치별 파생 상세 보정치 반환 APIs (Stat Derivations)

        // ── [1] 협상력 (Negotiation) ───────────────────────────
        
        /// <summary>
        /// 매매 수수료 감면 포인트를 반환합니다. (LV 1당 0.01%p 감면 = 0.0001 감면율)
        /// </summary>
        public double GetTradingFeeDiscount()
        {
            int baseLv = GetBaseStat(StatType.Negotiation);
            float bonus = GetBonusStat(StatType.Negotiation);
            // Base Level당 0.01%p 감면 + 보너스 파편의 최종 수치 합산
            double baseDiscount = baseLv * 0.0001; // 0.01% = 0.0001
            double bonusDiscount = bonus * 0.0001;
            return baseDiscount + bonusDiscount;
        }

        /// <summary>
        /// 은행 대출 이율 감면 포인트를 반환합니다. (LV 1당 0.1%p 감면 = 0.001 감면율)
        /// </summary>
        public double GetLoanInterestDiscount()
        {
            int baseLv = GetBaseStat(StatType.Negotiation);
            float bonus = GetBonusStat(StatType.Negotiation);
            // Base Level당 0.1%p 감면 + 보너스
            double baseDiscount = baseLv * 0.001; // 0.1% = 0.001
            double bonusDiscount = bonus * 0.001;
            return baseDiscount + bonusDiscount;
        }

        /// <summary>
        /// 일일 노동(알바) 완료 시 지급받는 골드 보상의 가산 배율을 구합니다. (LV 1당 +5% 보너스)
        /// </summary>
        public float GetJobRewardMultiplier()
        {
            int baseLv = GetBaseStat(StatType.Negotiation);
            float bonus = GetBonusStat(StatType.Negotiation);
            // 기본 100% + Base 레벨당 5% + 보너스 파편
            return 1.0f + (baseLv * 0.05f) + (bonus * 0.05f);
        }

        // ── [2] 분석력 (Analysis) ─────────────────────────────

        /// <summary>
        /// 찌라시 해독 비율을 반환합니다. (LV 1당 20% 해독 완료, LV 5 = 100%)
        /// </summary>
        public float GetDecryptionRate()
        {
            int baseLv = GetBaseStat(StatType.Analysis);
            float bonus = GetBonusStat(StatType.Analysis);
            return Mathf.Clamp01((baseLv * 0.2f) + (bonus * 0.2f));
        }

        /// <summary>
        /// 날씨 효과(글리치 노이즈) 발생 시 가격 흔들림 강도를 상쇄하는 저항 수준을 구합니다. (LV 1당 10~20% 상향, LV 5 = 100%)
        /// </summary>
        public float GetGlitchResistance()
        {
            int baseLv = GetBaseStat(StatType.Analysis);
            float bonus = GetBonusStat(StatType.Analysis);
            float baseResist = baseLv switch
            {
                0 => 0.0f,
                1 => 0.1f,
                2 => 0.2f,
                3 => 0.4f,
                4 => 0.7f,
                5 => 1.0f,
                _ => 1.0f
            };
            return Mathf.Clamp01(baseResist + bonus * 0.1f);
        }

        /// <summary>연관 섹터(산업군)명이 눈에 노출되는 수준인지 판별 (LV 2 이상)</summary>
        public bool IsSectorNameVisible() => GetBaseStat(StatType.Analysis) >= 2;

        /// <summary>연관 주식 종목명이 눈에 노출되는 수준인지 판별 (LV 3 이상)</summary>
        public bool IsStockNameVisible() => GetBaseStat(StatType.Analysis) >= 3;

        /// <summary>예상 주가 변동 범위(%)가 노출되는 수준인지 판별 (LV 4 이상)</summary>
        public bool IsExpectedRangeVisible() => GetBaseStat(StatType.Analysis) >= 4;

        /// <summary>원문이 완전 노출되는 만렙(LV 5) 상태인지 판별</summary>
        public bool IsOriginalTextVisible() => GetBaseStat(StatType.Analysis) >= 5;

        // ── [3] 운용력 (Management) ───────────────────────────

        /// <summary>
        /// 포트폴리오에 동시에 담을 수 있는 최대 주식 종목 슬롯 수를 반환합니다.
        /// </summary>
        public int GetPortfolioSlots()
        {
            int baseLv = GetBaseStat(StatType.Management);
            return baseLv switch
            {
                0 => 3,
                1 => 4,
                2 => 6,
                3 => 10,
                4 => 18,
                5 => 24, // 전 종목 슬롯 오픈
                _ => 24
            };
        }

        /// <summary>
        /// 단일 주식 종목에 동시에 투자할 수 있는 최대 금액(Buy Cap, Gold)을 구합니다.
        /// </summary>
        public long GetMaxBuyCapPerStock()
        {
            int baseLv = GetBaseStat(StatType.Management);
            return baseLv switch
            {
                0 => 10000L,
                1 => 50000L,
                2 => 200000L,
                3 => 1000000L,
                4 => 10000000L,
                5 => long.MaxValue, // 무제한 (No Cap)
                _ => long.MaxValue
            };
        }

        // ── [4] 회복력 (Resilience) ───────────────────────────

        /// <summary>
        /// 매일 수행 가능한 기본 알바 횟수 제한(Jobs)을 반환합니다.
        /// </summary>
        public int GetDailyJobLimit()
        {
            int baseLv = GetBaseStat(StatType.Resilience);
            return baseLv switch
            {
                0 => 3,
                1 => 3,
                2 => 4,
                3 => 4,
                4 => 5,
                5 => 5,
                _ => 5
            };
        }

        /// <summary>
        /// 노동 미니게임 시 조작 피로도를 상쇄해주는 스테미너 효율 보정치를 구합니다.
        /// </summary>
        public float GetStaminaEfficiency()
        {
            int baseLv = GetBaseStat(StatType.Resilience);
            float bonus = GetBonusStat(StatType.Resilience);
            float baseEff = baseLv switch
            {
                0 => 0.0f,
                1 => 0.15f,
                2 => 0.30f,
                3 => 0.50f,
                4 => 0.70f,
                5 => 1.00f,
                _ => 1.00f
            };
            return Mathf.Clamp01(baseEff + bonus * 0.1f);
        }

        /// <summary>
        /// 노동(알바)을 마칠 때마다 찌라시를 획득할 추가 확률 확률 가산치를 반환합니다. (Resilience LV 3 버프: +5%)
        /// </summary>
        public float GetJobRumorFindBonus()
        {
            return GetBaseStat(StatType.Resilience) >= 3 ? 0.05f : 0.0f;
        }

        /// <summary>
        /// 회복력 5레벨 도달 시 10% 확률로 알바 소비 횟수 차감을 무시할 수 있는 여부를 난수로 주사위 판정합니다.
        /// </summary>
        public bool ShouldIgnoreJobCountConsumption()
        {
            if (GetBaseStat(StatType.Resilience) < 5) return false;
            
            // 10% 확률 주사위 롤
            float roll = UnityEngine.Random.value;
            return roll <= 0.10f;
        }

        #endregion
    }

    #region Stat Events (성장 전역 이벤트 구조체)

    /// <summary>
    /// 플레이어가 스탯 보인트를 직접 사용하여 베이스 레벨을 상승시켰을 때 발행됩니다.
    /// </summary>
    public struct StatAllocatedEvent
    {
        public StatType Stat;
        public int NewBaseLevel;
        public int RemainingPoints;
    }

    /// <summary>
    /// 스탯 초기화 약물을 사용하여 스탯을 리셋했을 때 발행됩니다.
    /// </summary>
    public struct StatResetEvent
    {
        public int RefundedPoints;
    }

    #endregion
}
