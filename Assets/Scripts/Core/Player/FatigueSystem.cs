using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_02 [노동 시스템] 연속 노동(알바)에 따른 피로도(Fatigue) 난이도 연산 엔진.
    /// 당일 플레이어가 알바를 수행할 때마다 피로도가 누적되어 미니게임의 성공 판정 범위(Success Zone Width)를
    /// 점진적으로 축소시킵니다. 회복력(Resilience) 스탯이 높을수록 피로도 축소 페널티가 경감됩니다.
    /// </summary>
    public class FatigueSystem : Singleton<FatigueSystem>
    {
        /// <summary>알바 1회 완료 시 누적되는 기본 판정 범위 축소 페널티 (10% 고정)</summary>
        public const float PENALTY_PER_JOB = 0.10f;

        /// <summary>판정 범위 축소의 최대 상한선 (피로도가 아무리 높아도 최소 50%의 성공 범위는 보장)</summary>
        public const float MAX_PENALTY_CAP = 0.50f;

        // 프레임 단위 캐싱 (동일 프레임 내 여러 UI/렌더러의 반복 쿼리로 인한 가벼운 오버헤드 완천 방단)
        private int _lastCachedFrame = -1;
        private float _cachedSuccessScale = 1.0f;
        private float _cachedFatiguePercent = 0.0f;

        protected override void Awake()
        {
            base.Awake();
        }

        /// <summary>
        /// 금일 누적 알바 수행 횟수를 계산하여 반환합니다.
        /// </summary>
        public int GetDailyJobsConsumedToday()
        {
            if (JobLimitSystem.Instance == null) return 0;
            int limit = JobLimitSystem.Instance.GetMaxDailyJobsLimit();
            int remaining = JobLimitSystem.Instance.GetRemainingJobs();
            return Mathf.Max(0, limit - remaining);
        }

        /// <summary>
        /// 회복력(Resilience) 스탯에 따른 피로도 페널티 감쇄(경감) 배율을 연산합니다.
        /// LV 1당 피로도 페널티를 8%씩 경감합니다. (최대 LV 5 기준 40% 페널티 경감)
        /// </summary>
        public float GetResilienceMitigationFactor()
        {
            if (StatCore.Instance == null) return 1.0f;
            int resilienceLevel = StatCore.Instance.GetBaseStat(StatType.Resilience);
            // 경감률 = 1 - (회복력 LV * 0.08)
            float mitigation = 1.0f - (resilienceLevel * 0.08f);
            return Mathf.Max(0.60f, mitigation); // 페널티 경감률은 최대 40%까지만 보장
        }

        /// <summary>
        /// 현재 피로도 연산을 단일 프레임 주기 내에서 안정적으로 취합 연산하여 캐싱합니다.
        /// </summary>
        private void UpdateFatigueCacheIfRequired()
        {
            int currentFrame = Time.frameCount;
            if (currentFrame == _lastCachedFrame) return;

            int jobsConsumed = GetDailyJobsConsumedToday();
            if (jobsConsumed <= 0)
            {
                _cachedSuccessScale = 1.0f;
                _cachedFatiguePercent = 0.0f;
                _lastCachedFrame = currentFrame;
                return;
            }

            // 1. 순수 피로도 페널티 계산
            float rawPenalty = jobsConsumed * PENALTY_PER_JOB;

            // 2. 회복력 스탯에 의한 페널티 경감 처리
            float mitigation = GetResilienceMitigationFactor();
            float finalPenalty = rawPenalty * mitigation;

            // 3. 최소 성공 보장선 캡 적용
            float cappedPenalty = Mathf.Min(finalPenalty, MAX_PENALTY_CAP);

            // 4. 캐시 변수 업데이트
            _cachedSuccessScale = 1.0f - cappedPenalty;
            _cachedFatiguePercent = cappedPenalty / MAX_PENALTY_CAP;
            _lastCachedFrame = currentFrame;
        }

        /// <summary>
        /// 현재 피로도와 회복력 수준을 종합하여, 미니게임에 즉시 대입할 최종 성공 판정 범위 배율(Success Zone Scale)을 연산합니다.
        /// 미니게임 프론트엔드 씬이나 게이지 렌더러가 이 배율을 곱하여 성공 영역의 가로 길이를 동적으로 좁힙니다.
        /// [동일 프레임 캐싱 적용 완료]
        /// </summary>
        /// <returns>최종 성공 영역 배율 (1.0f = 기본 상태, 0.7f = 30% 영역 축소 난이도 상승)</returns>
        public float GetSuccessZoneScale()
        {
            UpdateFatigueCacheIfRequired();
            return _cachedSuccessScale;
        }

        /// <summary>
        /// UI나 디버그 모니터링을 위해 현재 누적 피로도 퍼센트(0% ~ 100%)를 반환합니다.
        /// [동일 프레임 캐싱 적용 완료]
        /// </summary>
        public float GetFatiguePercentage()
        {
            UpdateFatigueCacheIfRequired();
            return _cachedFatiguePercent;
        }
    }
}
