using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 유저의 수동 입력을 통한 대출 부분/전액 상환을 처리하는 금융 변제 엔진 (Manual Repayment Manager).
    /// <para>
    /// 플레이어의 보유 Gold를 소비하여 지목된 대출 ID(`LoanId`)의 누적이자(선변제) 및 원금을 차감 상환합니다.
    /// </para>
    /// </summary>
    public class ManualRepayment : Singleton<ManualRepayment>
    {
        /// <summary>
        /// 유저 입력을 바탕으로 대출을 안전하게 수동 상환합니다. (이자 우선 변제 규칙)
        /// </summary>
        /// <param name="loanId">상환할 대출 고유 식별 ID</param>
        /// <param name="payAmount">상환하고자 하는 신청 금액 (Gold)</param>
        /// <param name="interestPaid">변제 완료된 이자액 반환</param>
        /// <param name="principalPaid">변제 완료된 원금액 반환</param>
        /// <returns>상환 트랜잭션 성공 여부 (잔고 부족, 대출 정보 없음 등일 경우 false)</returns>
        public bool RepayDebtManually(string loanId, long payAmount, out long interestPaid, out long principalPaid)
        {
            interestPaid = 0;
            principalPaid = 0;

            if (string.IsNullOrEmpty(loanId))
            {
                Debug.LogError("[ManualRepayment] 유효하지 않은 대출 ID 입력입니다.");
                return false;
            }

            if (payAmount <= 0)
            {
                Debug.LogError("[ManualRepayment] 상환 요청 금액은 0보다 커야 합니다.");
                return false;
            }

            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                Debug.LogError("[ManualRepayment] 지갑 시스템이나 활성 세이브 데이터를 불러올 수 없습니다.");
                return false;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData.Debts == null)
            {
                Debug.LogError("[ManualRepayment] 대출 목록 정보가 세이브 데이터에 누락되어 있습니다.");
                return false;
            }

            // A. 상환 대상 대출 인스턴스 조회
            var debt = saveData.Debts.Find(d => d.LoanId == loanId);
            if (debt == null)
            {
                Debug.LogWarning($"[ManualRepayment] 지정된 ID의 대출 건이 존재하지 않습니다: {loanId}");
                return false;
            }

            // B. 밸런스 친화적 상환액 클램핑
            // 유저가 보유한 부채 총액보다 더 많은 상환금을 입력한 경우, 총 부채(원금+이자)까지만 내도록 안전 보정
            long totalDebtLeft = debt.TotalDebt;
            long actualPayAmount = Math.Min(payAmount, totalDebtLeft);

            if (actualPayAmount <= 0)
            {
                Debug.LogWarning($"[ManualRepayment] 이미 완납 완료되었거나 변제할 부채 잔액이 없습니다.");
                return false;
            }

            // C. 지갑 가용 잔고(현금) 대조 검증
            long availableCash = WalletManager.Instance.GetCash();
            if (availableCash < actualPayAmount)
            {
                Debug.LogWarning($"[ManualRepayment] 상환 실패 (잔고 부족): 필요={actualPayAmount}G, 보유={availableCash}G");
                return false;
            }

            // D. 대출 상환 집행 (이자 선차감 -> 남은 금액 원금 차감 내부 탑재)
            debt.PayDebt(actualPayAmount, out interestPaid, out principalPaid);
            long totalPaid = interestPaid + principalPaid;

            if (totalPaid > 0)
            {
                // E. 지갑 가용 현금 차감 (SpendCash 트랜잭션 호출)
                bool spendSuccess = WalletManager.Instance.SpendCash(totalPaid);
                if (!spendSuccess)
                {
                    // 예외적 비정상 차감 실패 방지용 이중 복원 (안전장치)
                    debt.AccrueInterest(interestPaid, DateTime.UtcNow);
                    debt.Principal += principalPaid;
                    Debug.LogError("[ManualRepayment] 지갑 잔고 차감 실패로 인한 상환 롤백이 수행되었습니다.");
                    return false;
                }

                // F. 지갑의 Outstanding(미지급) 이자 지표 차감 반영
                if (interestPaid > 0)
                {
                    WalletManager.Instance.PayInterest(interestPaid);
                }

                bool isFullyRepaid = debt.TotalDebt <= 0;

                // G. 완납된 대출 항목 정리 (물리 세이브 보전 최적화)
                if (isFullyRepaid)
                {
                    saveData.Debts.Remove(debt);
                    Debug.Log($"[ManualRepayment] 대출 [{loanId}] 완납 완료! 목록에서 삭제되었습니다.");
                }
                else
                {
                    Debug.Log($"[ManualRepayment] 대출 [{loanId}] 부분 상환 완료: 변제={totalPaid:N0}G (이자={interestPaid:N0}G, 원금={principalPaid:N0}G), 남은대출={debt.TotalDebt:N0}G");
                }

                // H. ── 전역 알림 발행 (UI 연출 연동) ──
                EventBus.Publish(new ManualRepaymentProcessedEvent
                {
                    LoanId = loanId,
                    AmountPaid = totalPaid,
                    InterestPaid = interestPaid,
                    PrincipalPaid = principalPaid,
                    IsFullyRepaid = isFullyRepaid
                });

                // I. ── 강제적 보안 무결성 동기화 및 즉각 자동저장 ──
                // 현금 잔고와 대출 목록이 변동되었으므로 무결성 데이터 동기화 및 강제 세이브 수행!
                if (DataIntegrity.Instance != null)
                {
                    DataIntegrity.Instance.SyncShadows();
                }

                if (AutoSaveRouter.Instance != null)
                {
                    AutoSaveRouter.Instance.TriggerInstantSave();
                }

                return true;
            }

            return false;
        }
    }

    // --------------------------------------------------------
    // 3. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 유저가 수동 입력을 통해 부채 상환 처리를 성공적으로 실행했을 때 발행되는 알림 이벤트 (UI 연동용)
    /// </summary>
    public struct ManualRepaymentProcessedEvent
    {
        /// <summary>대출 고유 ID</summary>
        public string LoanId;

        /// <summary>실제 상환 처리되어 차감된 총액 (Gold)</summary>
        public long AmountPaid;

        /// <summary>이자 변제에 할당된 금액 (Gold)</summary>
        public long InterestPaid;

        /// <summary>원금 변제에 할당된 금액 (Gold)</summary>
        public long PrincipalPaid;

        /// <summary>대출이 전액 변제(완납)되었는지 여부</summary>
        public bool IsFullyRepaid;
    }
}
