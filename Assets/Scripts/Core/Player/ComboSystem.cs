using System;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 미니게임 연속 화물 운송 성공 콤보 보너스 엔진.
    /// 플레이어가 편의점/상하차 미니게임 도중 실수 없이 화물을 연속해서 운송(콤보)한 최대 횟수를 기반으로
    /// 정산 단계에서 추가 콤보 보너스 골드(Combo Bonus Gold)를 산출해 지급합니다.
    /// </summary>
    public static class ComboSystem
    {
        /// <summary>
        /// 최대 콤보 횟수를 입력받아 최종 추가 보너스 골드를 연산합니다.
        /// (연속 3콤보 이상 성공 시점부터 단계별 보상 가산 작동)
        /// </summary>
        public static long CalculateComboBonus(int maxCombo)
        {
            if (maxCombo < 3) return 0L;

            // 구간별 보상 금액 산정 (GDD v2.25.0 수치 최적화)
            if (maxCombo >= 10) return 350L; // 10콤보 이상 (퍼펙트 달성)
            if (maxCombo >= 8)  return 220L; // 8~9 콤보
            if (maxCombo >= 5)  return 120L; // 5~7 콤보
            return 50L;                      // 3~4 콤보
        }
    }
}
