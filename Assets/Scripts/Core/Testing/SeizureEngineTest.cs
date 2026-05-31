using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04 및 MOD_GDD_11 의 자산 압류, 메일 독촉 발송 타이머, 강제 주식 패널티 청산
    /// 및 지갑 부채 상환 정합성을 100% 검증하는 통합 유닛 테스트 컴포넌트.
    /// </summary>
    public class SeizureEngineTest : MonoBehaviour
    {
        [Header("Test Configuration")]
        [Tooltip("True일 경우 시작 시 자산 압류 및 독촉 메일 검증 테스트를 즉시 자동 구동합니다.")]
        public bool runTestOnStart = true;

        [SerializeField, ReadOnlyDisplay]
        private string testResultStatus = "Not Run";

        private void Start()
        {
            if (runTestOnStart)
            {
                RunSeizureTest();
            }
        }

        /// <summary>
        /// 연체 발생 ➡️ 유예 가동 ➡️ 6시간 전 독촉 메일 발송 ➡️ 유예 만료 ➡️ 70% 강제 청산 ➡️ 부채 순차 상환 흐름을 정밀 검사합니다.
        /// </summary>
        public void RunSeizureTest()
        {
            Debug.Log("[SeizureEngineTest] ===== STARTING BANKRUPTCY & SEIZURE ENGINE TEST =====");
            testResultStatus = "Running...";

            try
            {
                var wallet = WalletManager.Instance;
                var market = MarketManager.Instance;
                var mailSys = MailSystem.Instance;
                var engine = SeizureEngine.Instance;

                if (wallet == null || market == null || mailSys == null || engine == null)
                {
                    throw new Exception("Core Singletons are not fully initialized.");
                }

                // 1. 가짜 세이브 데이터 구성 주입 (대출 1개 소지, 마이너스 잔고 -5,000G 설정)
                SaveDataDTO testSave = new SaveDataDTO
                {
                    Gold = -5000, // 연체 상태
                    PlayerLevel = 1,
                    Mails = new List<MailInstance>(),
                    Debts = new List<DebtKernel>(),
                    Portfolio = new Dictionary<string, StockHoldingsDTO>()
                };

                // 대출 주입 (원금 10,000G)
                var testDebt = new DebtKernel("TEST_LOAN_001", 10000, DateTime.UtcNow);
                testSave.Debts.Add(testDebt);

                // 보유 주식 주입 (CLOUDBERRY 100주 보유)
                testSave.Portfolio["CLOUDBERRY"] = new StockHoldingsDTO
                {
                    StockId = "CLOUDBERRY",
                    Quantity = 100,
                    AveragePurchasePrice = 850
                };

                // WalletManager에 테스트 데이터 DTO 세팅
                wallet.GetType()
                      .GetProperty("ActiveSaveData")
                      ?.SetValue(wallet, testSave);

                // MarketManager의 CLOUDBERRY 런타임 가격 강제 조작 (주당 1,000G 가정)
                var cbStock = market.GetStock("CLOUDBERRY");
                if (cbStock != null)
                {
                    cbStock.CurrentPrice = 1000;
                }

                Debug.Log("[SeizureEngineTest] [Step 1] Injected test save with cash = -5,000G, debt = 10,000G, portfolio = CLOUDBERRY 100 shares (price 1,000G).");

                // 2. 1차 평가 집행: 유예 기한 시작 및 초기 경고 수신 검사
                Debug.Log("[SeizureEngineTest] [Step 2] Executing SeizureEngine.Instance.EvaluateSeizureStatus() [Round 1]...");
                engine.EvaluateSeizureStatus();

                if (!testSave.SeizureGracePeriodExpiryTimeUtc.HasValue)
                {
                    throw new Exception("Grace period was not triggered for overdue account.");
                }

                // 초기 경고 메일 도착 검사
                int mailCount = testSave.Mails.Count;
                Debug.Log($"[SeizureEngineTest] [Step 2] Mails count after Round 1: {mailCount}");
                if (mailCount != 1 || !testSave.Mails[0].Title.Contains("대기 안내"))
                {
                    throw new Exception("Initial seizure warning mail was not sent or corrupted.");
                }

                // 3. 만료 6시간 전 시계열 타임 시뮬레이션: 5.5시간 남은 상황으로 강제 타임 루프 조작
                Debug.Log("[SeizureEngineTest] [Step 3] Simulating grace period timer: setting hours left to 5.5 hours...");
                testSave.SeizureGracePeriodExpiryTimeUtc = DateTime.UtcNow.AddHours(5.5);

                // 2차 평가 집행: 독촉 메일 전송 자동화 검사
                engine.EvaluateSeizureStatus();

                Debug.Log($"[SeizureEngineTest] [Step 3] IsSeizureWarningMailSent: {testSave.IsSeizureWarningMailSent}");
                Debug.Log($"[SeizureEngineTest] [Step 3] Total Mails count after Round 2: {testSave.Mails.Count}");

                if (!testSave.IsSeizureWarningMailSent)
                {
                    throw new Exception("IsSeizureWarningMailSent flag was not set to True.");
                }

                var warningMail = testSave.Mails.FirstOrDefault(m => m.Title.Contains("6시간 전 경고"));
                if (warningMail == null)
                {
                    throw new Exception("Final 6-hour warning urge mail was not sent automatically.");
                }

                // 4. 유예 기한 완전 초과 만료 시뮬레이션: 만료 시간을 1시간 전으로 조작
                Debug.Log("[SeizureEngineTest] [Step 4] Simulating expired grace period: setting expiration to 1 hour ago...");
                testSave.SeizureGracePeriodExpiryTimeUtc = DateTime.UtcNow.AddHours(-1.0);

                // 3차 평가 집행: 강제 매각 및 부채 청산 트랜잭션 검사
                engine.EvaluateSeizureStatus();

                // (A) 주식 자산이 0으로 비워졌는지 확인
                int portfolioCount = testSave.Portfolio.Count;
                Debug.Log($"[SeizureEngineTest] [Step 4] Portfolio count after seizure: {portfolioCount}");
                if (portfolioCount != 0)
                {
                    throw new Exception("Portfolio was not liquidated. Forced sell failed.");
                }

                // (B) 70% 특가 매각 및 부채 변제 수학적 정합성 검사
                // 원래 현금: -5,000G
                // 매각액 (100주 * 1,000G * 0.70): +70,000G
                // 매각 후 현금: 65,000G
                // 빚 상환액: -10,000G
                // 상환 후 현금: 55,000G
                long finalCash = wallet.GetCash();
                Debug.Log($"[SeizureEngineTest] [Step 4] Verify Cash: Expected=55000, Actual={finalCash}");
                if (finalCash != 55000)
                {
                    throw new Exception($"Liquidated cash calculation is incorrect. Expected 55000G but got {finalCash}G.");
                }

                // (C) 빚이 성공적으로 상환 및 제거되었는지 확인
                int remainingDebts = testSave.Debts.Count;
                Debug.Log($"[SeizureEngineTest] [Step 4] Remaining Debts Count: Expected=0, Actual={remainingDebts}");
                if (remainingDebts != 0)
                {
                    throw new Exception("Overdue debts were not cleared after successful seizure liquidation.");
                }

                // (D) 최종 결과 메일 수신 확인
                var reportMail = testSave.Mails.FirstOrDefault(m => m.Title.Contains("압류 집행 및 부채 변제"));
                if (reportMail == null)
                {
                    throw new Exception("Final seizure execution report mail was not sent.");
                }

                // (E) 상태 플래그들이 null, false 로 리셋되었는지 확인
                bool isExpiryCleared = !testSave.SeizureGracePeriodExpiryTimeUtc.HasValue;
                bool isWarningCleared = !testSave.IsSeizureWarningMailSent;
                Debug.Log($"[SeizureEngineTest] [Step 4] Expiry Cleared: {isExpiryCleared}, Warning Cleared: {isWarningCleared}");
                if (!isExpiryCleared || !isWarningCleared)
                {
                    throw new Exception("Seizure engine status flags were not reset after execution.");
                }

                testResultStatus = "SUCCESS (Overdue ➡️ Grace ➡️ Urge Mail ➡️ 70% Liquidation ➡️ Loan Repayment verified)";
                Debug.Log("[SeizureEngineTest] ===== SEIZURE ENGINE INTEGRITY TEST COMPLETED WITH 100% SUCCESS =====");
            }
            catch (Exception ex)
            {
                testResultStatus = "FAILED: " + ex.Message;
                Debug.LogError($"[SeizureEngineTest] ===== SEIZURE ENGINE INTEGRITY TEST FAILED =====: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
