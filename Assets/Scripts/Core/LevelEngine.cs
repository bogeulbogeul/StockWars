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

                    // 데모 종료 트리거 감지 (레벨 3 도달 시 즉시 발동)
                    if (saveData.PlayerLevel == GlobalConstants.MAX_DEMO_LEVEL)
                    {
                        EventBus.Publish(new DemoCompletedEvent
                        {
                            FinalLevel = saveData.PlayerLevel,
                            FinalGold = saveData.Gold,
                            TotalTradingVolume = saveData.CumulativeTradingVolume
                        });
                    }
                }
                else
                {
                    break;
                }
            }

            if (leveledUp)
            {
                EventBus.Publish(new PlayerLevelUpEvent
                {
                    NewLevel = saveData.PlayerLevel,
                    GainedLevels = levelsGained
                });
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

    #region Leveling Events (레벨 전역 이벤트)

    /// <summary>
    /// 캐릭터 데모 버전 목표 달성(레벨 3) 시 발행되는 이벤트.
    /// UI 암전 연출 및 최종 성적표 리포트 창 출력부에서 구독합니다.
    /// </summary>
    public struct DemoCompletedEvent
    {
        /// <summary>최종 달성 레벨 (3)</summary>
        public int FinalLevel;

        /// <summary>데모 종료 시점 가용 보유 현금 (Gold)</summary>
        public long FinalGold;

        /// <summary>총 누적 매매 거래 대금 (Gold)</summary>
        public long TotalTradingVolume;
    }

    /// <summary>
    /// 플레이어 레벨이 실제로 상승했을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct PlayerLevelUpEvent
    {
        public int NewLevel;
        public int GainedLevels;
    }

    #endregion
}
