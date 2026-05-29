using System;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 알바 승급(Promotion) 및 시급 스케일 배율 관리 엔진.
    /// 플레이어의 누적 알바 완료 횟수(TotalJobsCompleted)에 기반하여 수습사원부터 부장까지의 승급 직급을 산출하고,
    /// 이에 따라 시급(알바 기본 골드 보상) 배율을 1.0배에서 최대 1.5배까지 동적으로 향상시킵니다.
    /// </summary>
    public static class JobPromotion
    {
        /// <summary>
        /// 승급 직급(Career Tiers) 정의
        /// </summary>
        public enum PromotionTitle
        {
            Intern,      // 수습사원 (1.0x)
            Junior,      // 주임 (1.1x) - 10회 이상
            Senior,      // 대리 (1.2x) - 30회 이상
            Manager,     // 과장 (1.3x) - 60회 이상
            Director,    // 차장 (1.4x) - 100회 이상 (위탁 관리 효율 10% 감면 조건과 동시 달성)
            Executive    // 부장 (1.5x) - 150회 이상 (시급 극대화 만렙 직급)
        }

        /// <summary>
        /// 플레이어의 누적 알바 완료 횟수에 맞는 최종 직급을 계산합니다.
        /// </summary>
        /// <param name="totalJobsCompleted">현재까지 완결된 알바 누적 횟수</param>
        public static PromotionTitle GetCurrentTitle(int totalJobsCompleted)
        {
            if (totalJobsCompleted >= 150) return PromotionTitle.Executive;
            if (totalJobsCompleted >= 100) return PromotionTitle.Director;
            if (totalJobsCompleted >= 60)  return PromotionTitle.Manager;
            if (totalJobsCompleted >= 30)  return PromotionTitle.Senior;
            if (totalJobsCompleted >= 10)  return PromotionTitle.Junior;
            return PromotionTitle.Intern;
        }

        /// <summary>
        /// 직급에 따른 최종 시급 승급 배율(1.0x ~ 1.5x)을 쿼리합니다.
        /// </summary>
        public static float GetPromotionMultiplier(int totalJobsCompleted)
        {
            PromotionTitle title = GetCurrentTitle(totalJobsCompleted);
            return title switch
            {
                PromotionTitle.Executive => 1.5f,
                PromotionTitle.Director  => 1.4f,
                PromotionTitle.Manager   => 1.3f,
                PromotionTitle.Senior    => 1.2f,
                PromotionTitle.Junior    => 1.1f,
                _ => 1.0f
            };
        }

        /// <summary>
        /// 직급 열거형에 해당하는 친근한 한글 이름을 반환합니다. (UI 연계 텍스트용)
        /// </summary>
        public static string GetTitleName(PromotionTitle title)
        {
            return title switch
            {
                PromotionTitle.Executive => "부장",
                PromotionTitle.Director  => "차장",
                PromotionTitle.Manager   => "과장",
                PromotionTitle.Senior    => "대리",
                PromotionTitle.Junior    => "주임",
                _ => "수습사원"
            };
        }

        /// <summary>
        /// 현재 누적 알바 횟수를 기준으로 한글 직급명을 직접 쿼리합니다.
        /// </summary>
        public static string GetTitleName(int totalJobsCompleted)
        {
            return GetTitleName(GetCurrentTitle(totalJobsCompleted));
        }
    }
}
