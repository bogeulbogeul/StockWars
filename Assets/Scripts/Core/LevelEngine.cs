using System;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_03: 누적 거래액 기반 레벨업 및 스탯 포인트 지급 엔진
    /// </summary>
    public static class LevelEngine
    {
        /// <summary>
        /// 다음 레벨로 가기 위한 요구 누적 거래액을 계산합니다.
        /// </summary>
        public static long GetRequiredVolumeForNextLevel(int currentLevel)
        {
            // GDD 공식: 100 * (Level^1.5)
            double exp = 100 * Math.Pow(currentLevel, 1.5);
            return (long)(exp * GlobalConstants.LEVEL_VOLUME_SCALE);
        }

        /// <summary>
        /// 거래액을 누적하고 레벨업 여부를 확인하여 처리합니다.
        /// </summary>
        /// <param name="saveData">플레이어 세이브 데이터</param>
        /// <param name="tradeVolume">이번에 발생한 거래액</param>
        /// <param name="levelsGained">상승한 레벨 수</param>
        /// <returns>레벨업 발생 여부</returns>
        public static bool AddTradingVolume(SaveDataDTO saveData, long tradeVolume, out int levelsGained)
        {
            levelsGained = 0;
            saveData.CumulativeTradingVolume += tradeVolume;

            bool leveledUp = false;

            while (saveData.PlayerLevel < GlobalConstants.MAX_DEMO_LEVEL)
            {
                long reqVolume = GetRequiredVolumeForNextLevel(saveData.PlayerLevel);
                
                if (saveData.CumulativeTradingVolume >= reqVolume)
                {
                    saveData.PlayerLevel++;
                    levelsGained++;
                    
                    // 레벨업 보상: 스탯 포인트 지급 (레벨당 1포인트 가정)
                    saveData.AvailableStatPoints++;
                    
                    leveledUp = true;
                }
                else
                {
                    break;
                }
            }

            return leveledUp;
        }

        /// <summary>
        /// 현재 레벨에서의 진행률을 0~1 사이의 값으로 반환합니다.
        /// </summary>
        public static float GetLevelProgress(SaveDataDTO saveData)
        {
            long currentLevelReq = saveData.PlayerLevel > 1 ? GetRequiredVolumeForNextLevel(saveData.PlayerLevel - 1) : 0;
            long nextLevelReq = GetRequiredVolumeForNextLevel(saveData.PlayerLevel);
            
            long progress = saveData.CumulativeTradingVolume - currentLevelReq;
            long totalNeeded = nextLevelReq - currentLevelReq;
            
            if (totalNeeded <= 0) return 1f;
            
            return Math.Clamp((float)progress / totalNeeded, 0f, 1f);
        }
    }
}
