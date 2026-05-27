using System;
using UnityEngine.Scripting;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 플레이어의 개별 대출(부채) 정보를 담은 코어 데이터 클래스 (Debt Kernel).
    /// <para>
    /// 개별 대출 원금, 누적 복리 이자, 대출 일자, 최근 정산 일자 정보를 추적하며,
    /// 안나의 첫 대출 무이자 혜택(AnnaWelcomeGift) 연동을 위한 무이자 플래그 및 만료 시각(UTC)을 담고 있습니다.
    /// </para>
    /// <para>
    /// C# 리스트 내에서의 참조 변경 및 쉬운 데이터 동기화를 보장하기 위해 참조 형식(Class)으로 설계되었습니다.
    /// </para>
    /// </summary>
    [Serializable]
    [Preserve]
    public class DebtKernel
    {
        /// <summary>대출 거래 고유 식별자 (ID)</summary>
        public string LoanId { get; set; }

        /// <summary>빌린 원금 (Principal)</summary>
        public long Principal { get; set; }

        /// <summary>해당 대출에서 누적/가산된 복리 이자액 (Interest)</summary>
        public long Interest { get; set; }

        /// <summary>대출 계약이 체결되어 자금이 입금된 시각 (UTC)</summary>
        public DateTime LoanTimeUtc { get; set; }

        /// <summary>가장 최근에 이자율(2.0%) 연산 및 정산 처리가 이루어진 시각 (UTC)</summary>
        public DateTime LastSettlementTimeUtc { get; set; }

        /// <summary>현재 무이자 혜택이 적용 중인지 여부 (True일 경우 이자 가산 생략)</summary>
        public bool IsInterestFree { get; set; }

        /// <summary>무이자 혜택이 만료되어 일반 주간 복리 이자율(2.0%)로 전환되는 한계 시각 (UTC)</summary>
        public DateTime InterestFreeEndTimeUtc { get; set; }

        /// <summary>
        /// 총 채무 합산 상환 대상액 (원금 + 이자)
        /// </summary>
        public long TotalDebt => Principal + Interest;

        /// <summary>
        /// 역직렬화 및 기본 생성을 위한 기본 생성자
        /// </summary>
        public DebtKernel()
        {
            LoanId = Guid.NewGuid().ToString();
            LoanTimeUtc = DateTime.UtcNow;
            LastSettlementTimeUtc = DateTime.UtcNow;
        }

        /// <summary>
        /// 신규 대출 계약 정보를 기록하는 생성자
        /// </summary>
        /// <param name="loanId">고유 대출 ID (미입력 시 GUID 자동 발급)</param>
        /// <param name="principal">대출 원금</param>
        /// <param name="loanTimeUtc">대출 실행 시간 (UTC)</param>
        /// <param name="isInterestFree">무이자 혜택 활성화 플래그</param>
        /// <param name="interestFreeEndTimeUtc">무이자 혜택 만료 시각 (UTC)</param>
        public DebtKernel(string loanId, long principal, DateTime loanTimeUtc, bool isInterestFree = false, DateTime? interestFreeEndTimeUtc = null)
        {
            LoanId = string.IsNullOrEmpty(loanId) ? Guid.NewGuid().ToString() : loanId;
            Principal = Math.Max(0, principal);
            Interest = 0;
            LoanTimeUtc = loanTimeUtc;
            LastSettlementTimeUtc = loanTimeUtc;
            IsInterestFree = isInterestFree;
            InterestFreeEndTimeUtc = interestFreeEndTimeUtc ?? DateTime.MinValue;
        }

        /// <summary>
        /// 이 대출에 복리 이자를 수동/자동으로 가산합니다.
        /// </summary>
        /// <param name="interestAmount">가산할 이자 금액 (음수 방어)</param>
        /// <param name="settlementTimeUtc">정산 시각 (UTC)</param>
        public void AccrueInterest(long interestAmount, DateTime settlementTimeUtc)
        {
            Interest += Math.Max(0, interestAmount);
            LastSettlementTimeUtc = settlementTimeUtc;
        }

        /// <summary>
        /// 채무 상환을 적용합니다. 이자 우선 변제 규칙을 따릅니다.
        /// </summary>
        /// <param name="paymentAmount">상환액 (음수 방어)</param>
        /// <param name="interestPaid">실제 이자 변제액 반환</param>
        /// <param name="principalPaid">실제 원금 변제액 반환</param>
        public void PayDebt(long paymentAmount, out long interestPaid, out long principalPaid)
        {
            long remainingPayment = Math.Max(0, paymentAmount);

            // 1. 이자 우선 변제
            if (Interest > 0)
            {
                long interestToPay = Math.Min(Interest, remainingPayment);
                Interest -= interestToPay;
                remainingPayment -= interestToPay;
                interestPaid = interestToPay;
            }
            else
            {
                interestPaid = 0;
            }

            // 2. 남은 상환액으로 원금 변제
            if (remainingPayment > 0 && Principal > 0)
            {
                long principalToPay = Math.Min(Principal, remainingPayment);
                Principal -= principalToPay;
                remainingPayment -= principalToPay;
                principalPaid = principalToPay;
            }
            else
            {
                principalPaid = 0;
            }
        }
    }
}
