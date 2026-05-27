using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 게임 내 시간(요일, 날짜, 시각)의 흐름을 가공하여 UI(HUD 등)에 제공하고,
    /// 주간 금융 정산 주기(매주 월요일 00:00 UTC)까지의 카운트다운을 총괄하는 타이머 클래스.
    /// </summary>
    public class MarketTimer : Singleton<MarketTimer>
    {
        /// <summary>
        /// 현재 게임 내 로컬 일시 (UI 표시용)
        /// </summary>
        public DateTime CurrentTimeLocal => CalendarSystem.Instance != null 
            ? CalendarSystem.Instance.CurrentTimeLocal 
            : DateTime.Now;

        /// <summary>
        /// 현재 게임 내 UTC 일시 (정밀 정산 연산용)
        /// </summary>
        public DateTime CurrentTimeUtc => CalendarSystem.Instance != null 
            ? CalendarSystem.Instance.CurrentTimeUtc 
            : DateTime.UtcNow;

        /// <summary>
        /// 현재 로컬 시간 기준 한국어 요일 이름을 반환합니다. (예: "월요일")
        /// </summary>
        public string GetKoreanDayOfWeek()
        {
            return GetKoreanDayOfWeek(CurrentTimeLocal.DayOfWeek);
        }

        /// <summary>
        /// 특정 DayOfWeek에 대해 한국어 요일 이름을 반환합니다.
        /// </summary>
        public string GetKoreanDayOfWeek(DayOfWeek day)
        {
            return day switch
            {
                DayOfWeek.Sunday => "일요일",
                DayOfWeek.Monday => "월요일",
                DayOfWeek.Tuesday => "화요일",
                DayOfWeek.Wednesday => "수요일",
                DayOfWeek.Thursday => "목요일",
                DayOfWeek.Friday => "금요일",
                DayOfWeek.Saturday => "토요일",
                _ => string.Empty
            };
        }

        /// <summary>
        /// HUD UI 표시용으로 포맷팅된 현재 날짜/시각 문자열을 반환합니다. (예: "2026년 05월 26일 (화) 10:15")
        /// </summary>
        public string GetFormattedCurrentDateTime()
        {
            var dt = CurrentTimeLocal;
            string shortDay = GetKoreanDayOfWeek(dt.DayOfWeek);
            if (!string.IsNullOrEmpty(shortDay))
            {
                shortDay = shortDay.Substring(0, 1); // "월요일" -> "월"
            }
            return $"{dt:yyyy년 MM월 dd일} ({shortDay}) {dt:HH:mm}";
        }

        /// <summary>
        /// 다음 주간 금융 정산(월요일 00:00 UTC)까지 남은 실시간 시간(TimeSpan)을 반환합니다.
        /// </summary>
        public TimeSpan GetTimeToNextSettlement()
        {
            if (CalendarSystem.Instance == null) return TimeSpan.Zero;
            
            DateTime nextUtc = CalendarSystem.Instance.NextSettlementTime;
            if (nextUtc == DateTime.MinValue) return TimeSpan.Zero;

            DateTime nowUtc = CurrentTimeUtc;
            if (nowUtc >= nextUtc) return TimeSpan.Zero;

            return nextUtc - nowUtc;
        }

        /// <summary>
        /// HUD 카운트다운용으로 남은 정산 시간을 정밀 가공하여 반환합니다.
        /// <list type="bullet">
        ///   <item>1일 이상 남은 경우: "N일 H시간 M분 남음"</item>
        ///   <item>1일 미만 1시간 이상 남은 경우: "H시간 M분 S초 남음"</item>
        ///   <item>1시간 미만 남은 경우: "M분 S초 남음"</item>
        ///   <item>시간이 경과했거나 정산 중인 경우: "정산 진행 중..."</item>
        /// </list>
        /// </summary>
        public string GetFormattedTimeToNextSettlement()
        {
            TimeSpan ts = GetTimeToNextSettlement();
            if (ts <= TimeSpan.Zero)
            {
                return "정산 진행 중...";
            }

            if (ts.Days > 0)
            {
                return $"{ts.Days}일 {ts.Hours}시간 {ts.Minutes}분 남음";
            }
            if (ts.Hours > 0)
            {
                return $"{ts.Hours}시간 {ts.Minutes}분 {ts.Seconds}초 남음";
            }
            return $"{ts.Minutes}분 {ts.Seconds}초 남음";
        }
    }
}
