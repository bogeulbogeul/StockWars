using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 플레이어의 실시간 순자산 및 평판 등급을 분석하여 동적 대출한도를 연산하는 심사 엔진 (Loan Evaluator).
    /// <para>
    /// 플레이어의 자산 규모(Net Worth)와 명성 시스템(Reputation Grade)의 곱절 조합을 바탕으로 
    /// 신용한도(Max Credit Limit) 및 즉각 대출 가능한 잔여 한도(Available Credit Headroom)를 산출합니다.
    /// </para>
    /// <para>
    /// 자산 압류 엔진(Seizure Engine)의 Mercy Grace Period 유예 등급 판정을 위한 부채비율(Debt-to-Asset Ratio) 연산 기능도 통합 제공합니다.
    /// </para>
    /// </summary>
    public class LoanEvaluator : Singleton<LoanEvaluator>
    {
        /// <summary>플레이어 생애 최저 신용 보장 기본 한도 (10,000 Gold)</summary>
        public const long BASE_MAX_LIMIT = 10000;

        // --------------------------------------------------------
        // 1. 최대 대출 신용 한도 연산
        // --------------------------------------------------------

        /// <summary>
        /// 플레이어의 평판 등급과 실시간 순자산을 결합해 가용할 수 있는 '최대 신용 대출 한도'를 산출합니다.
        /// <para>공식: (기본한도 10,000G * 평판 배율) + 실시간 순자산의 10% (레버리지 완충 비율)</para>
        /// </summary>
        public long GetMaxCreditLimit()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return BASE_MAX_LIMIT;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            // A. 평판 등급별 신용 승수 획득
            double reputationMultiplier = GetReputationMultiplier(saveData.Reputation);

            // B. 실시간 총자산(Net Worth) 획득
            long totalAssets = NetWorthCore.Instance != null 
                ? NetWorthCore.Instance.GetNetWorth() 
                : saveData.Gold;

            // C. 총자산 연계 10% 추가 신용 레버리지 계산
            long assetLeeway = (long)(totalAssets * 0.10);

            // D. 최종 합산 및 최저치 보장
            long rawLimit = (long)(BASE_MAX_LIMIT * reputationMultiplier) + assetLeeway;
            
            return Math.Max(BASE_MAX_LIMIT, rawLimit);
        }

        // --------------------------------------------------------
        // 2. 현재 누적 부채 및 가용 잔여 한도
        // --------------------------------------------------------

        /// <summary>
        /// 현재 플레이어가 짊어지고 있는 총 활성 채무액(원금 + 누적이자)의 합계를 구합니다.
        /// </summary>
        public long GetTotalActiveDebts()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return 0;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData.Debts == null) return 0;

            long total = 0;
            foreach (var debt in saveData.Debts)
            {
                if (debt != null)
                {
                    total += debt.TotalDebt;
                }
            }

            return total;
        }

        /// <summary>
        /// 현재 플레이어가 추가로 더 대출을 실행할 수 있는 '실시간 잔여 신용 한도'를 구합니다.
        /// <para>공식: 최대 신용 대출 한도 - 현재 누적 채무액</para>
        /// </summary>
        public long GetAvailableCreditHeadroom()
        {
            long maxLimit = GetMaxCreditLimit();
            long activeDebts = GetTotalActiveDebts();

            return Math.Max(0L, maxLimit - activeDebts);
        }

        // --------------------------------------------------------
        // 3. 자산 압류 엔진 전용 부채 비율 산출
        // --------------------------------------------------------

        /// <summary>
        /// 현재 총자산 대비 누적 부채의 백분율 비율(Debt-to-Asset Ratio)을 연산합니다.
        /// <para>자산 압류 엔진의 Mercy Grace Period(24h~168h) 유예 상태 등급 결정의 절대적 잣대가 됩니다.</para>
        /// </summary>
        public double GetDebtToAssetRatio()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return 0.0;
            }

            long activeDebts = GetTotalActiveDebts();
            if (activeDebts <= 0) return 0.0;

            long totalAssets = NetWorthCore.Instance != null 
                ? NetWorthCore.Instance.GetNetWorth() 
                : WalletManager.Instance.ActiveSaveData.Gold;

            if (totalAssets <= 0)
            {
                // 자산이 0 이하인데 채무가 있다면 100% 위험 임계치를 초과한 상태로 판정
                return 1.01; 
            }

            return (double)activeDebts / totalAssets;
        }

        // --------------------------------------------------------
        // 4. 평판 등급별 계수 맵
        // --------------------------------------------------------

        /// <summary>
        /// 평판 등급에 따른 신용 승수를 매칭하여 반환합니다. (F등급 1.0배 ~ 최고 S등급 50.0배 신용 한도 개방)
        /// </summary>
        public double GetReputationMultiplier(ReputationGrade grade)
        {
            switch (grade)
            {
                case ReputationGrade.F: return 1.0;  // F등급: 기본 10,000G
                case ReputationGrade.E: return 1.5;  // E등급: 기본 15,000G (레벨 20 해금)
                case ReputationGrade.D: return 2.5;  // D등급: 기본 25,000G (Whale)
                case ReputationGrade.C: return 5.0;  // C등급: 기본 50,000G (Market Mover)
                case ReputationGrade.B: return 10.0; // B등급: 기본 100,000G (Legendary Maker)
                case ReputationGrade.A: return 25.0; // A등급: 기본 250,000G (Grand Master)
                case ReputationGrade.S: return 50.0; // S등급: 기본 500,000G (Emperor)
                default: return 1.0;
            }
        }
    }
}
