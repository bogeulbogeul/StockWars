using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04: 생애 최초 대출 시 168시간(1주일) 무이자 대출 특전 작동 시스템 (Anna's Welcome Gift).
    /// <para>
    /// 플레이어가 은행(노드 파이낸스)에 방문하여 첫 대출을 실행할 때 안나가 개입하여
    /// 10,000G 한도의 무이자 대출(168시간 적용)을 강제 활성화하고 전용 가이드 대사를 트리거합니다.
    /// </para>
    /// </summary>
    public class AnnaWelcomeGift : Singleton<AnnaWelcomeGift>
    {
        /// <summary>안나가 제공하는 무이자 대출 원금 (10,000 Gold)</summary>
        public const long WELCOME_LOAN_AMOUNT = 10000;

        /// <summary>무이자 유지 기간 (168시간 = 1주일)</summary>
        public const int WELCOME_LOAN_FREE_HOURS = 168;

        // --------------------------------------------------------
        // 1. 자격 검증 및 실행 API
        // --------------------------------------------------------

        /// <summary>
        /// 플레이어가 현재 안나의 무이자 웰컴 기프트를 받을 자격이 있는지 확인합니다.
        /// </summary>
        public bool IsEligibleForWelcomeGift()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return false;
            }

            // 이미 기프트를 수령한 이력이 없다면 자격 보유
            return !WalletManager.Instance.ActiveSaveData.IsAnnaWelcomeGiftClaimed;
        }

        /// <summary>
        /// 생애 최초 무이자 대출 특전을 계좌 및 채무 리스트에 공식적으로 반영합니다.
        /// </summary>
        public void ApplyWelcomeGiftLoan()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                Debug.LogError("[AnnaWelcomeGift] 세이브 데이터 컨텍스트가 부재하여 웰컴 기프트를 적용할 수 없습니다.");
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            // 중복 수령 방어 검증
            if (saveData.IsAnnaWelcomeGiftClaimed)
            {
                Debug.LogWarning("[AnnaWelcomeGift] 이미 최초 무이자 혜택 대출을 수령 완료한 플레이어입니다.");
                return;
            }

            DateTime loanTimeUtc = DateTime.UtcNow;
            DateTime freeEndTimeUtc = loanTimeUtc.AddHours(WELCOME_LOAN_FREE_HOURS);

            // 1. 168시간 무이자 특전용 DebtKernel 생성
            DebtKernel welcomeLoan = new DebtKernel(
                loanId: "ANNA_WELCOME_LOAN",
                principal: WELCOME_LOAN_AMOUNT,
                loanTimeUtc: loanTimeUtc,
                isInterestFree: true,
                interestFreeEndTimeUtc: freeEndTimeUtc
            );

            // 2. 플레이어 채무 목록에 이식
            if (saveData.Debts == null)
            {
                saveData.Debts = new System.Collections.Generic.List<DebtKernel>();
            }
            saveData.Debts.Add(welcomeLoan);

            // 3. 10,000G 가용 현금 입금
            WalletManager.Instance.AddCash(WELCOME_LOAN_AMOUNT);

            // 4. 기프트 수령 완료 플래그 영속 반영
            saveData.IsAnnaWelcomeGiftClaimed = true;

            Debug.Log($"[AnnaWelcomeGift] 플레이어 생애 첫 무이자 대출 10,000G 실행 완료! 무이자 기간: {freeEndTimeUtc:yyyy-MM-dd HH:mm:ss} UTC 까지.");

            // 5. ── 중요 보안 무결성 동기화 ──
            // 가용 자금(Gold)이 정당한 경로로 증가했으므로 실시간 무결성 검증 섀도 데이터를 즉시 강제 갱신!
            if (DataIntegrity.Instance != null)
            {
                DataIntegrity.Instance.SyncShadows();
            }

            // 6. 중요 마일스톤이므로 즉시 디스크 물리 저장 강제 실행 (모바일 세이브 규격 대응)
            if (AutoSaveRouter.Instance != null)
            {
                AutoSaveRouter.Instance.TriggerInstantSave();
            }

            // 7. 대화 다이얼로그 및 UI 통보용 전역 이벤트 발행
            EventBus.Publish(new AnnaWelcomeGiftTriggeredEvent
            {
                PrincipalAmount = WELCOME_LOAN_AMOUNT,
                FreeHours = WELCOME_LOAN_FREE_HOURS,
                FreeEndTimeUtc = freeEndTimeUtc,
                AnnaDialogueMessage = "첫 거래니까 제가 은행 측과 미리 얘기해뒀어요. 1만 골드까지는 이자 없이 빌릴 수 있을 거예요. 대신 이 돈은 꼭 신중하게 굴려야 해요, 파트너?"
            });
        }
    }

    // --------------------------------------------------------
    // 2. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 안나의 최초 무이자 웰컴 기프트 대출이 정상 실행되었을 때 발행되는 다이얼로그 및 UI 알림 이벤트
    /// </summary>
    public struct AnnaWelcomeGiftTriggeredEvent
    {
        /// <summary>지급된 대출 원금 (10,000G)</summary>
        public long PrincipalAmount;

        /// <summary>무이자 보장 시간 (168시간)</summary>
        public int FreeHours;

        /// <summary>무이자 종료 시각 (UTC)</summary>
        public DateTime FreeEndTimeUtc;

        /// <summary>안나의 전용 연출 가이드 다이얼로그 메세지</summary>
        public string AnnaDialogueMessage;
    }
}
