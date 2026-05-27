using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 매주 월요일 00:00 (UTC) 복리 이자 합산 및 금융 트랜잭션 보장 시스템 (Interest Cycle Manager).
    /// <para>
    /// `CalendarSystem`이 발행하는 주간 금융 정산 이벤트(WeeklySettlementEvent)를 구독하여 동작합니다.
    /// </para>
    /// <para>
    /// 모든 활성 대출 목록(Debts)을 순회하며 무이자 기프트 만료 검사, 소셜 신용 이자율 감면(-0.5%p),
    /// 블랙 스완 긴급 재난 이자 유예(0.0%) 등을 안전하게 정산하고 이자 누적액을 갱신합니다.
    /// </para>
    /// </summary>
    public class InterestCycle : Singleton<InterestCycle>
    {
        // --------------------------------------------------------
        // 1. 이벤트 구독 설정
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            
            // 주간 금융 정산(월요일 00:00 UTC) 이벤트 구독
            EventBus.Subscribe<WeeklySettlementEvent>(OnWeeklySettlement);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<WeeklySettlementEvent>(OnWeeklySettlement);
        }

        // --------------------------------------------------------
        // 2. 핵심 이자 정산 루프
        // --------------------------------------------------------

        private void OnWeeklySettlement(WeeklySettlementEvent e)
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                Debug.LogWarning("[InterestCycle] 세이브 데이터 컨텍스트가 부재하여 이자 정산을 스킵합니다.");
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData.Debts == null || saveData.Debts.Count == 0)
            {
                // 청구할 대출 채무가 없음
                return;
            }

            long totalAccruedThisWeek = 0;
            double currentRate = GetApplicableInterestRate();

            Debug.Log($"[InterestCycle] 주간 이자 정산 시작. 기준시(UTC): {e.SettlementTime:yyyy-MM-dd HH:mm:ss}, 기본이율: {currentRate * 100:F1}%");

            // 모든 활성 부채 루프 순회
            for (int i = 0; i < saveData.Debts.Count; i++)
            {
                var debt = saveData.Debts[i];
                if (debt.Principal <= 0 && debt.Interest <= 0)
                {
                    // 원금과 이자가 모두 상환된 대출은 정산 불요
                    continue;
                }

                // A. 무이자 혜택 검사 (안나의 웰컴 기프트 등)
                if (debt.IsInterestFree)
                {
                    // 정산 기준 시각이 무이자 종료 시각을 지났는가?
                    if (e.SettlementTime >= debt.InterestFreeEndTimeUtc)
                    {
                        debt.IsInterestFree = false;
                        Debug.Log($"[InterestCycle] 대출 [{debt.LoanId}]의 무이자 혜택 기간이 만료되었습니다. 일반 이율로 전환됩니다.");
                    }
                    else
                    {
                        // 무이자 기간 중에는 이번 정산 회차에서 이자 가산 스킵
                        Debug.Log($"[InterestCycle] 대출 [{debt.LoanId}]는 무이자 상태입니다. (만료일: {debt.InterestFreeEndTimeUtc:yyyy-MM-dd HH:mm:ss} UTC)");
                        continue;
                    }
                }

                // B. 복리 이자 연산
                // 복리 공식에 따라 (원금 + 기존 가산 이자)의 지정된 이율만큼 이자 가산
                long interestAccrued = (long)Math.Round(debt.TotalDebt * currentRate);
                if (interestAccrued > 0)
                {
                    debt.AccrueInterest(interestAccrued, e.SettlementTime);
                    totalAccruedThisWeek += interestAccrued;
                }
            }

            // 이번 정산 주기에 신규 가산된 총 이자가 존재할 경우 계좌 반영 및 보안 동기화
            if (totalAccruedThisWeek > 0)
            {
                saveData.AccumulatedInterest += totalAccruedThisWeek;
                
                Debug.Log($"[InterestCycle] 주간 이자 가산 완료. 신규 이자 합산액: {totalAccruedThisWeek:N0}G. 총 누적 채무 이자: {saveData.AccumulatedInterest:N0}G");

                // UI 통보용 전역 알림 이벤트 발행
                EventBus.Publish(new InterestAccruedEvent
                {
                    AccruedAmount = totalAccruedThisWeek,
                    AppliedRate = currentRate,
                    SettlementTime = e.SettlementTime
                });

                // ── 중요 보안 무결성 동기화 ──
                // 누적 이자(AccumulatedInterest)가 정당하게 합산되었으므로 무결성 그림자 데이터를 동기화하여 보안 크래시 방지!
                if (DataIntegrity.Instance != null)
                {
                    DataIntegrity.Instance.SyncShadows();
                }
            }
        }

        // --------------------------------------------------------
        // 3. 미래 지향적 이자율 버프/디버프 조회 엔진
        // --------------------------------------------------------

        /// <summary>
        /// 버프 및 이벤트를 반영한 최종 적용 주간 이자율을 계산합니다.
        /// </summary>
        public double GetApplicableInterestRate()
        {
            // 1. 블랙 스완 재난 지원 유예 버프 검증 (이율 0.0%)
            if (IsBlackSwanReliefActive())
            {
                return 0.0;
            }

            double baseRate = 0.02; // 기본 주당 2.0%

            // 2. 사회적 신뢰 버프 검증 (가구 테마 보유 버프 -0.5%p)
            if (HasSocialCreditBuff())
            {
                baseRate -= 0.005; // 최종 1.5%
            }

            return baseRate;
        }

        /// <summary>
        /// 블랙 스완 복구 긴급 재난 지원 혜택이 적용 중인지 여부를 검사합니다.
        /// </summary>
        private bool IsBlackSwanReliefActive()
        {
            // [미래 구현 확장부]: 블랙 스완 매니저 연동 가능 영역
            // 현재는 코어 구조 단계이므로 기본값 false를 반환합니다.
            return false;
        }

        /// <summary>
        /// 사회적 신뢰 이자 감면 버프([코지 빈티지], [사이버 펑크], [로열 미니멀리즘] 테마 가구 3종 이상 보유) 상태를 검증합니다.
        /// </summary>
        private bool HasSocialCreditBuff()
        {
            // [미래 구현 확장부]: 가구 인벤토리 관리 매니저 연동 가능 영역
            // 현재는 코어 구조 단계이므로 기본값 false를 반환합니다.
            return false;
        }
    }

    // --------------------------------------------------------
    // 4. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 주간 이자가 성공적으로 합산 가산되었을 때 발행되는 알림 이벤트 (UI 연동용)
    /// </summary>
    public struct InterestAccruedEvent
    {
        /// <summary>이번 기수에 신규 가산된 총 이자 금액</summary>
        public long AccruedAmount;

        /// <summary>정산에 적용된 실질 이자율 (예: 0.02 = 2.0%)</summary>
        public double AppliedRate;

        /// <summary>이자가 발생한 정산 기준 일시 (UTC)</summary>
        public DateTime SettlementTime;
    }
}
