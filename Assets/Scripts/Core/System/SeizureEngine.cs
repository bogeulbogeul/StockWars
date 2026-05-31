using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_04 [은행 대출 시스템] & MOD_GDD_11 [메일 시스템] 자산 압류 유예 판정 및 압류 강제 청산 집행 코어 엔진.
    /// <para>
    /// 플레이어의 활성 채무 상황과 현금 잔고를 실시간으로 모니터링하여,
    /// 연체 상황(대출이 존재하고 현금이 음수 0G 미만인 상태) 발생 시 24시간의 압류 유예 기한을 산정 및 카운트합니다.
    /// </para>
    /// <para>
    /// [최후 독촉 메일 자동화]: 유예 기한 만료 6시간 전에 스마트폰 시스템 메일을 자동으로 발송하여 위험을 공지합니다.
    /// </para>
    /// <para>
    /// [강제 압류 및 매각 집행]: 유예 기한이 만료되면 플레이어가 보유한 모든 주식을 전량 70% 가격(특가 청산 패널티)으로 
    /// 강제 매각하여 현금화한 뒤, 채무(Principal + Interest)를 원자적 트랜잭션으로 강제 상환 탕감 처리합니다.
    /// </para>
    /// </summary>
    public class SeizureEngine : Singleton<SeizureEngine>
    {
        private const double GRACE_PERIOD_HOURS = 24.0; // 기본 압류 유예 기간 (24시간)
        private const double WARNING_TRIGGER_HOURS = 6.0; // 최후 독촉 독촉메일 발송 임계 시각 (만료 6시간 전)

        private float _nextEvaluationTime = 0f;
        private const float EVALUATION_COOLTIME_SECONDS = 5.0f; // 연산 틱 쿨타임 (5초)

        protected override void Awake()
        {
            base.Awake();
            // 게임 틱 주기마다 자산 압류 상태 검사를 수행합니다.
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        private void OnGameTick(GameTickEvent e)
        {
            // 성능 최적화: 틱마다 복잡한 LINQ 연산을 회피하고 5초에 한 번만 실행되도록 스로틀링 가드
            if (Time.unscaledTime < _nextEvaluationTime) return;
            _nextEvaluationTime = Time.unscaledTime + EVALUATION_COOLTIME_SECONDS;

            EvaluateSeizureStatus();
        }

        /// <summary>
        /// 플레이어의 채무와 현금 상황을 종합 대조하여 유예기간 시계열 가동, 경고 메일 발송 및 강제 처분을 수행합니다.
        /// </summary>
        public void EvaluateSeizureStatus()
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var saveData = wallet.ActiveSaveData;
            long totalDebt = saveData.Debts.Sum(d => d.TotalDebt);
            long cash = wallet.GetCash();

            // 1. 압류 유예 상태 진입 판정: 채무가 존재하고 현금이 마이너스(0G 미만)인 경우
            if (totalDebt > 0 && cash < 0)
            {
                if (!saveData.SeizureGracePeriodExpiryTimeUtc.HasValue)
                {
                    // 유예 시각 산정 시작 (현재 시간 + 24시간)
                    saveData.SeizureGracePeriodExpiryTimeUtc = DateTime.UtcNow.AddHours(GRACE_PERIOD_HOURS);
                    saveData.IsSeizureWarningMailSent = false;
                    
                    Debug.Log($"[SeizureEngine] 대출 연체 및 잔고 부족 감지! 압류 유예 {GRACE_PERIOD_HOURS}시간 카운트다운 가동 시작. " +
                              $"(만료 예정: {saveData.SeizureGracePeriodExpiryTimeUtc.Value.ToLocalTime()})");
                    
                    // 초기 경고 전송
                    MailSystem.Instance.SendMail(
                        MailType.System,
                        "대부자산관리원",
                        "[경고] 자산 강제 압류 대기 안내",
                        "귀하의 계좌 잔고가 마이너스 상태로 진입하여 채무 연체가 감지되었습니다. 24시간의 유예 기간 내에 현금을 양수로 복구하거나 대출금을 상환하지 않을 시, 보유 주식 자산이 전량 압류 및 강제 매각됩니다.",
                        0, null
                    );
                }
                else
                {
                    // 2. 카운트다운 중 상태 제어
                    DateTime expiry = saveData.SeizureGracePeriodExpiryTimeUtc.Value;
                    DateTime now = DateTime.UtcNow;
                    double hoursLeft = (expiry - now).TotalHours;

                    // (A) 만료 6시간 전 최후 독촉 독촉메일 발송 자동화 (107번 태스크 핵심)
                    if (hoursLeft <= WARNING_TRIGGER_HOURS && !saveData.IsSeizureWarningMailSent)
                    {
                        saveData.IsSeizureWarningMailSent = true;
                        
                        Debug.Log($"[SeizureEngine] 유예 기간 만료 {hoursLeft:F1}시간 전 도달! 최후의 압류 독촉 메일을 자동 발송합니다.");

                        MailSystem.Instance.SendMail(
                            MailType.System,
                            "대부자산관리원",
                            "[최후통첩] 자산 강제 압류 집행 6시간 전 경고",
                            $"귀하의 대출 연체 유예 기간 만료가 임박했습니다 (약 {hoursLeft:F1}시간 남음). 유예 시한이 초과되는 즉시 소유하신 모든 주식 자산이 70% 가치로 압류 처분되며 대출금 상환에 강제 충당됩니다. 서둘러 계좌를 정리하십시오.",
                            0, null
                        );
                    }

                    // (B) 유예 기한 완전 초과 시 강제 압류 및 청산 집행
                    if (now >= expiry)
                    {
                        Debug.LogWarning($"[SeizureEngine] 연체 유예 기한 초과 만료! 자산 강제 압류 및 주식 강제 처분을 즉각 집행합니다.");
                        ExecuteForceSeizure(wallet, saveData);
                    }
                }
            }
            else
            {
                // 3. 연체 해결 및 정상 복구 판정 (빚이 없거나 현금이 0G 이상 복구되었을 시)
                if (saveData.SeizureGracePeriodExpiryTimeUtc.HasValue)
                {
                    saveData.SeizureGracePeriodExpiryTimeUtc = null;
                    saveData.IsSeizureWarningMailSent = false;
                    
                    Debug.Log("[SeizureEngine] 잔고가 플러스로 정상 복구되었거나 채무가 전량 상환되어 압류 경고 유예 상태를 안전하게 해제합니다.");

                    MailSystem.Instance.SendMail(
                        MailType.System,
                        "대부자산관리원",
                        "[안내] 자산 압류 경고 상태 해제 보고",
                        "귀하의 신용 계좌 정보 대조 결과 연체 사유가 말끔히 해결된 것이 정상 감지되어, 자산 압류 유예 및 독촉 상태를 공식 해제합니다. 항상 성실한 금융 거래에 깊이 감사드립니다.",
                        0, null
                    );
                }
            }
        }

        /// <summary>
        /// 보유 주식 전체를 70% 가치로 패널티 강제 청산하여 대출 채무를 강제로 탕감/상환하는 원자적 물리 처분 실행.
        /// </summary>
        private void ExecuteForceSeizure(WalletManager wallet, SaveDataDTO saveData)
        {
            long totalDebtBefore = saveData.Debts.Sum(d => d.TotalDebt);
            long totalLiquidationCashGained = 0;
            var market = MarketManager.Instance;

            List<string> liquidatedStocksInfo = new List<string>();

            // 1. 보유 포트폴리오 주식 전량 70% 가격 매각
            if (saveData.Portfolio != null && saveData.Portfolio.Count > 0)
            {
                var stockIds = saveData.Portfolio.Keys.ToList();
                foreach (string stockId in stockIds)
                {
                    var holding = saveData.Portfolio[stockId];
                    if (holding.Quantity > 0)
                    {
                        long currentPrice = 0;
                        string stockName = stockId;

                        if (market != null)
                        {
                            var stockInst = market.GetStock(stockId);
                            if (stockInst != null)
                            {
                                currentPrice = stockInst.CurrentPrice;
                                stockName = stockInst.Data.companyName;
                            }
                            else
                            {
                                Debug.LogError($"[SeizureEngine] [Critical Error] MarketManager에서 주식 ID '{stockId}' 정보를 조회하지 못해 청산 가치가 0G 처리됩니다. 세이브 무결성에 심각한 기획 불일치 오류가 우려됩니다!");
                            }
                        }
                        else
                        {
                            Debug.LogError("[SeizureEngine] MarketManager Instance가 활성화되어 있지 않아 강제 압류 주가 정산을 집행할 수 없습니다!");
                        }

                        // 강제 매각 총액 산출 (70% 강제 청산 패널티 적용)
                        long valueAtNormal = holding.Quantity * currentPrice;
                        long valueAtDiscount = (long)Math.Round(valueAtNormal * 0.70);

                        totalLiquidationCashGained += valueAtDiscount;
                        liquidatedStocksInfo.Add($"{stockName} {holding.Quantity}주 (청산금: +{valueAtDiscount}G)");
                    }
                }

                // 포트폴리오 주식 수량 영구 처분 박탈
                saveData.Portfolio.Clear();
            }

            // 2. 강제 청산으로 획득한 골드 가산
            wallet.AddCash(totalLiquidationCashGained);

            // 3. 채무 강제 우선 순차 변제 (PayDebt)
            long originalCash = wallet.GetCash();
            long remainingCashToPay = originalCash; // 빚 상환에 사용할 현금액

            // 이자 우선 변제 룰에 맞춰 개별 대출 순차 상환
            for (int i = saveData.Debts.Count - 1; i >= 0; i--)
            {
                var debt = saveData.Debts[i];
                if (remainingCashToPay <= 0) break;

                debt.PayDebt(remainingCashToPay, out long interestPaid, out long principalPaid);
                long totalPaid = interestPaid + principalPaid;

                remainingCashToPay -= totalPaid;
                wallet.SubtractCash(totalPaid); // 실제로 지갑에서 지불

                // 빚이 완제(TotalDebt == 0)된 경우 리스트에서 영구 방출
                if (debt.TotalDebt == 0)
                {
                    saveData.Debts.RemoveAt(i);
                }
            }

            long totalDebtAfter = saveData.Debts.Sum(d => d.TotalDebt);
            long totalRepaid = totalDebtBefore - totalDebtAfter;

            // 4. 상태 플래그 완전 초기화
            saveData.SeizureGracePeriodExpiryTimeUtc = null;
            saveData.IsSeizureWarningMailSent = false;

            Debug.LogWarning($"[SeizureEngine] 강제 압류 완수! 주식 청산액: +{totalLiquidationCashGained}G, 상환액: -{totalRepaid}G. 남은 빚: {totalDebtAfter}G");

            // 5. 압류 결과에 대한 상세 집행 영수 보고서 메일 발송
            string detailContent = $"귀하의 연체 유예 만료로 법무 자산 압류 및 주식 특가 매각이 기계적으로 완수되었습니다.\n\n" +
                                   $"[압류 집행 명세]\n" +
                                   $"* 압류 전 채무액: {totalDebtBefore}G\n" +
                                   $"* 주식 청산 획득액: +{totalLiquidationCashGained}G\n" +
                                   $"* 부채 강제 상환액: -{totalRepaid}G\n" +
                                   $"* 남은 잔여 채무액: {totalDebtAfter}G\n" +
                                   $"* 집행 후 계좌 잔고: {wallet.GetCash()}G\n\n" +
                                   $"[매각 세부 품목]\n" +
                                   (liquidatedStocksInfo.Count > 0 ? string.Join("\n", liquidatedStocksInfo) : "매각할 주식 자산이 존재하지 않았습니다.");

            MailSystem.Instance.SendMail(
                MailType.System,
                "대부자산관리원",
                "[보고] 법원 압류 집행 및 부채 변제 결과 서신",
                detailContent,
                0, null
            );

            // 6. 안전 강제 영속 세이브
            TriggerForceSave();
        }

        private void TriggerForceSave()
        {
            var io = IOManager.Instance;
            var wallet = WalletManager.Instance;
            if (io != null && wallet != null && wallet.ActiveSaveData != null)
            {
                int currentSlot = AutoSaveRouter.ActiveSlotIndex;
                try
                {
                    SaveMetadata meta = io.LoadMetadata(currentSlot);
                    if (meta == null)
                    {
                        meta = new SaveMetadata
                        {
                            TotalPlayTime = 0.1f,
                            LastLocation = "Home Office",
                            AppVersion = Application.version
                        };
                    }
                    else
                    {
                        meta.AppVersion = Application.version;
                    }
                    io.SaveGame(currentSlot, wallet.ActiveSaveData, meta);
                    Debug.Log($"[SeizureEngine] 압류 집행 데이터가 슬롯 {currentSlot}에 안전하게 세이브 완료되었습니다.");
                }
                catch (Exception ex)
                {
                    Debug.LogError($"[SeizureEngine] 압류 집행 세이브 시도 중 오류: {ex.Message}");
                }
            }
        }
    }
}
