using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 주간 배당금 발생 시 대출 채무를 우선 자동 상환하는 자동 이체부 시스템 (Auto Repayment Manager).
    /// <para>
    /// `DividendController`가 주간 배당 정산 연산을 끝내고 `WeeklyDividendsCalculatedEvent`를 발행하는 즉시 감청하여 가동됩니다.
    /// </para>
    /// <para>
    /// 발생한 배당 수익금 범위 내에서 활성 채무의 이자(우선 변제)와 원금을 자동 차감/이체 처리합니다.
    /// </para>
    /// </summary>
    public class AutoRepayment : Singleton<AutoRepayment>
    {
        // --------------------------------------------------------
        // 1. 이벤트 구독 설정
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            
            // 주간 배당금 정산 완료 이벤트 구독
            EventBus.Subscribe<WeeklyDividendsCalculatedEvent>(OnWeeklyDividendsCalculated);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<WeeklyDividendsCalculatedEvent>(OnWeeklyDividendsCalculated);
        }

        // --------------------------------------------------------
        // 2. 자동 상환 이체 로직
        // --------------------------------------------------------

        private void OnWeeklyDividendsCalculated(WeeklyDividendsCalculatedEvent e)
        {
            if (e.TotalDividendEarned <= 0)
            {
                // 이번 주 발생한 배당금이 없으면 이체할 자원이 없음
                return;
            }

            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData.Debts == null || saveData.Debts.Count == 0)
            {
                // 변제할 대출 채무가 존재하지 않음
                return;
            }

            // A. 상환에 투입할 수 있는 실제 가용 배당 이체금 계산
            // 이번에 새로 입금된 배당금과 지갑의 누적 배당금 중 작은 값을 이체금 한도로 설정 (보안 정렬)
            long currentAccumDividends = WalletManager.Instance.GetAccumulatedDividends();
            long autoPayLimit = Math.Min(e.TotalDividendEarned, currentAccumDividends);
            if (autoPayLimit <= 0) return;

            Debug.Log($"[AutoRepayment] 주간 배당금 발생에 따른 자동 부채 상환 프로세스 가동. 이체 투입액: {autoPayLimit:N0}G");

            long remainingPayment = autoPayLimit;
            long totalInterestPaid = 0;
            long totalPrincipalPaid = 0;

            // B. 활성 채무 목록을 순회하며 '이자 우선 변제' 상환 적용
            for (int i = 0; i < saveData.Debts.Count; i++)
            {
                var debt = saveData.Debts[i];
                if (debt.TotalDebt <= 0) continue;

                // 개별 대출 상환 처리 (이자 선차감 -> 남은 금액 원금 차감 내부 탑재)
                debt.PayDebt(remainingPayment, out long interestPaid, out long principalPaid);
                
                long paidThisDebt = interestPaid + principalPaid;
                remainingPayment -= paidThisDebt;
                totalInterestPaid += interestPaid;
                totalPrincipalPaid += principalPaid;

                Debug.Log($"[AutoRepayment] 대출 [{debt.LoanId}] 상환: 변제액={paidThisDebt:N0}G (이자={interestPaid:N0}G, 원금={principalPaid:N0}G), 남은대출={debt.TotalDebt:N0}G");

                if (remainingPayment <= 0)
                {
                    break;
                }
            }

            long totalPaid = totalInterestPaid + totalPrincipalPaid;
            if (totalPaid > 0)
            {
                // C. 지갑의 누적 미지급 배당금에서 이체된 상환금만큼 차감 반영
                long prevDividends = saveData.AccumulatedDividends;
                saveData.AccumulatedDividends = Math.Max(0, saveData.AccumulatedDividends - totalPaid);

                // 배당금 변동 이벤트 전역 발행 (UI 갱신 연동)
                EventBus.Publish(new DividendsChangedEvent
                {
                    PreviousDividends = prevDividends,
                    NewDividends = saveData.AccumulatedDividends,
                    Delta = -totalPaid
                });

                // D. 지갑의Outstanding(미지급) 이자 지표 차감 반영
                if (totalInterestPaid > 0)
                {
                    WalletManager.Instance.PayInterest(totalInterestPaid);
                }

                // E. 완납된 대출 항목 정리 (메모리 및 세이브 파일 최적화)
                saveData.Debts.RemoveAll(d => d.TotalDebt <= 0);

                Debug.Log($"[AutoRepayment] 자동 상환 완료. 총 변제액={totalPaid:N0}G (이자={totalInterestPaid:N0}G, 원금={totalPrincipalPaid:N0}G). 남은 누적배당금={saveData.AccumulatedDividends:N0}G");

                // F. 자동 이체 결과 전역 알림 발행 (UI 연출용)
                EventBus.Publish(new AutoRepaymentProcessedEvent
                {
                    AmountTransferred = totalPaid,
                    InterestPaid = totalInterestPaid,
                    PrincipalPaid = totalPrincipalPaid,
                    SettlementTime = e.SettlementTime
                });

                // G. ── 중요 보안 무결성 동기화 ──
                // 배당금 잔고와 대출 이자 잔고가 변동되었으므로 무결성 섀도 데이터를 즉시 강제 동기화!
                if (DataIntegrity.Instance != null)
                {
                    DataIntegrity.Instance.SyncShadows();
                }
            }
        }
    }

    // --------------------------------------------------------
    // 3. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 주간 배당금 자동 상환/이체 처리가 성공적으로 실행되었을 때 발행되는 알림 이벤트 (UI 연동용)
    /// </summary>
    public struct AutoRepaymentProcessedEvent
    {
        /// <summary>자동 이체 및 변제된 총 금액 (Gold)</summary>
        public long AmountTransferred;

        /// <summary>이자 변제에 할당된 금액 (Gold)</summary>
        public long InterestPaid;

        /// <summary>원금 변제에 할당된 금액 (Gold)</summary>
        public long PrincipalPaid;

        /// <summary>처리가 완료된 정산 기준 UTC 시각</summary>
        public DateTime SettlementTime;
    }
}
