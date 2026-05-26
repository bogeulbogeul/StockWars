using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 플레이어의 실시간 가용 현금(Gold), 미지급 배당금, 누적 이자를 총괄하고 
    /// 원자적 트랜잭션을 보장하는 코어 지갑 매니저 싱글톤.
    /// </summary>
    public class WalletManager : Singleton<WalletManager>
    {
        private SaveDataDTO _activeSaveData;

        /// <summary>
        /// 활성화된 세이브 데이터 참조. 
        /// null 참조 예외를 방지하기 위해 미지정 시 Failsafe용 임시 객체를 생성하여 반환합니다.
        /// </summary>
        public SaveDataDTO ActiveSaveData
        {
            get
            {
                if (_activeSaveData == null)
                {
                    Debug.LogWarning("[WalletManager] ActiveSaveData가 지정되지 않아 임시 DTO 객체를 생성합니다.");
                    _activeSaveData = new SaveDataDTO();
                }
                return _activeSaveData;
            }
            private set => _activeSaveData = value;
        }

        protected override void Awake()
        {
            base.Awake();
        }

        /// <summary>
        /// 세이브 로드 시 호출되어 활성 데이터 컨텍스트를 바인딩합니다.
        /// </summary>
        public void Initialize(SaveDataDTO saveData)
        {
            if (saveData == null) throw new ArgumentNullException(nameof(saveData));
            _activeSaveData = saveData;
            Debug.Log("[WalletManager] 세이브 데이터 컨텍스트가 바인딩되었습니다.");
        }

        #region Cash (가용 현금 - Gold) API

        /// <summary>
        /// 현재 가용 현금 잔고를 조회합니다.
        /// </summary>
        public long GetCash()
        {
            return ActiveSaveData.Gold;
        }

        /// <summary>
        /// 가용 현금을 입금(추가)합니다.
        /// </summary>
        public void AddCash(long amount)
        {
            if (amount < 0)
            {
                Debug.LogError("[WalletManager] 음수 액수는 입금할 수 없습니다.");
                return;
            }

            long prev = ActiveSaveData.Gold;
            ActiveSaveData.Gold = Math.Clamp(ActiveSaveData.Gold + amount, 0L, long.MaxValue);

            EventBus.Publish(new CashChangedEvent
            {
                PreviousCash = prev,
                NewCash = ActiveSaveData.Gold,
                Delta = amount
            });
        }

        /// <summary>
        /// 가용 현금을 출금(사용)합니다. 잔고 부족 시 출금은 실패합니다.
        /// </summary>
        /// <param name="amount">사용할 액수</param>
        /// <returns>트랜잭션 성공 여부 (잔고가 충분하면 true, 부족하면 false)</returns>
        public bool SpendCash(long amount)
        {
            if (amount < 0)
            {
                Debug.LogError("[WalletManager] 음수 액수는 출금할 수 없습니다.");
                return false;
            }

            if (ActiveSaveData.Gold < amount)
            {
                Debug.LogWarning($"[WalletManager] 출금 실패 (잔고 부족): 필요={amount}G, 보유={ActiveSaveData.Gold}G");
                return false;
            }

            long prev = ActiveSaveData.Gold;
            ActiveSaveData.Gold -= amount;

            EventBus.Publish(new CashChangedEvent
            {
                PreviousCash = prev,
                NewCash = ActiveSaveData.Gold,
                Delta = -amount
            });

            return true;
        }

        #endregion

        #region Dividends (미지급 배당금) API

        /// <summary>
        /// 현재 누적되어 정산 대기 중인 미지급 배당금을 조회합니다.
        /// </summary>
        public long GetAccumulatedDividends()
        {
            return ActiveSaveData.AccumulatedDividends;
        }

        /// <summary>
        /// 미지급 배당금을 누적 추가합니다.
        /// </summary>
        public void AddDividends(long amount)
        {
            if (amount <= 0) return;

            long prev = ActiveSaveData.AccumulatedDividends;
            ActiveSaveData.AccumulatedDividends = Math.Clamp(ActiveSaveData.AccumulatedDividends + amount, 0L, long.MaxValue);

            EventBus.Publish(new DividendsChangedEvent
            {
                PreviousDividends = prev,
                NewDividends = ActiveSaveData.AccumulatedDividends,
                Delta = amount
            });
        }

        /// <summary>
        /// 미지급 배당금을 가용 현금(Gold)으로 일괄 정산 및 이관(인출)합니다.
        /// </summary>
        /// <returns>인출된 총 배당금 액수</returns>
        public long ClaimDividends()
        {
            long claimAmount = ActiveSaveData.AccumulatedDividends;
            if (claimAmount <= 0)
            {
                Debug.LogWarning("[WalletManager] 청구 가능한 미지급 배당금이 없습니다.");
                return 0;
            }

            ActiveSaveData.AccumulatedDividends = 0;
            AddCash(claimAmount);

            EventBus.Publish(new DividendsClaimedEvent
            {
                ClaimedAmount = claimAmount
            });

            Debug.Log($"[WalletManager] 배당금 일괄 인출 완료: {claimAmount}G가 가용 현금으로 이관되었습니다.");
            return claimAmount;
        }

        #endregion

        #region Interest (누적 이자) API

        /// <summary>
        /// 현재 누적된 이자를 조회합니다.
        /// </summary>
        public long GetAccumulatedInterest()
        {
            return ActiveSaveData.AccumulatedInterest;
        }

        /// <summary>
        /// 이자를 누적 추가합니다.
        /// </summary>
        public void AddInterest(long amount)
        {
            if (amount <= 0) return;

            long prev = ActiveSaveData.AccumulatedInterest;
            ActiveSaveData.AccumulatedInterest = Math.Clamp(ActiveSaveData.AccumulatedInterest + amount, 0L, long.MaxValue);

            EventBus.Publish(new InterestChangedEvent
            {
                PreviousInterest = prev,
                NewInterest = ActiveSaveData.AccumulatedInterest,
                Delta = amount
            });
        }

        /// <summary>
        /// 누적된 이자를 납부(차감)합니다.
        /// </summary>
        public bool PayInterest(long amount)
        {
            if (amount <= 0) return false;

            if (ActiveSaveData.AccumulatedInterest < amount)
            {
                Debug.LogWarning($"[WalletManager] 이자 납부 초과: 납부요청={amount}, 누적이자={ActiveSaveData.AccumulatedInterest}");
                return false;
            }

            long prev = ActiveSaveData.AccumulatedInterest;
            ActiveSaveData.AccumulatedInterest -= amount;

            EventBus.Publish(new InterestChangedEvent
            {
                PreviousInterest = prev,
                NewInterest = ActiveSaveData.AccumulatedInterest,
                Delta = -amount
            });

            return true;
        }

        #endregion

        #region Stock Holdings (보유 주식 포트폴리오 제어) API

        /// <summary>
        /// 주식을 매수했을 때 포트폴리오 수량, 평균 단가, 그리고 배당 정산용 구매 이력(PurchaseChunks)을 원자적으로 추가합니다.
        /// 거래 정지(Trading Halt) 상태일 경우 매수는 차단됩니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <param name="quantity">매수 수량 (양수)</param>
        /// <param name="purchasePrice">매수 단가 (Gold)</param>
        /// <returns>매수 트랜잭션 성공 여부 (거래 정지 상태이거나 오류 시 false)</returns>
        public bool AddStockHolding(string stockId, int quantity, double purchasePrice)
        {
            if (string.IsNullOrEmpty(stockId)) return false;
            if (quantity <= 0)
            {
                Debug.LogError("[WalletManager] 매수 수량은 0보다 커야 합니다.");
                return false;
            }

            string targetId = stockId.ToUpper();

            // ── 거래 정지(Trading Halt) 또는 정리매매(Liquidation) 상태 감시 및 거래 차단 Failsafe ──
            var stock = MarketManager.Instance.GetStock(targetId);
            if (stock != null)
            {
                if (stock.IsLiquidationPeriod)
                {
                    Debug.LogWarning($"[WalletManager] 주식 매수 실패 (정리매매 기간): {targetId} (정리매매 기간에는 신규 매수가 전면 금지됩니다.)");
                    return false;
                }
                if (stock.TradingHaltEndTimeUtc.HasValue && DateTime.UtcNow < stock.TradingHaltEndTimeUtc.Value)
                {
                    Debug.LogWarning($"[WalletManager] 주식 매수 실패 (거래 정지 상태): {targetId} (해제 예정: {stock.TradingHaltEndTimeUtc.Value:yyyy-MM-dd HH:mm:ss} UTC)");
                    return false;
                }
            }

            var portfolio = ActiveSaveData.Portfolio;

            if (!portfolio.TryGetValue(targetId, out var holding))
            {
                holding = new StockHoldingsDTO
                {
                    StockId = targetId,
                    Quantity = 0,
                    AveragePurchasePrice = 0.0,
                    PurchaseChunks = new System.Collections.Generic.List<PurchaseChunkDTO>()
                };
                portfolio[targetId] = holding;
            }

            // 1. 평균 매수 단가 및 전체 수량 업데이트 (소수점 정밀도 유지)
            long oldQty = holding.Quantity;
            double oldAvg = holding.AveragePurchasePrice;
            
            holding.Quantity += quantity;
            holding.AveragePurchasePrice = ((oldQty * oldAvg) + (quantity * purchasePrice)) / holding.Quantity;

            // 2. 배당 정산용 실시간 구매 이력(Lot) 추가 (UTC 일시 기록)
            holding.PurchaseChunks.Add(new PurchaseChunkDTO
            {
                Quantity = quantity,
                PurchaseTimeUtc = DateTime.UtcNow,
                PurchasePrice = purchasePrice
            });

            Debug.Log($"[WalletManager] 주식 매수 반영 완료: {targetId} +{quantity}주 (단가: {purchasePrice:F1}G, 현재 총 보유: {holding.Quantity}주, 평단: {holding.AveragePurchasePrice:F1}G)");
            return true;
        }

        /// <summary>
        /// 주식을 매도했을 때 포트폴리오 보유량을 차감하고, 배당 정산용 구매 이력(PurchaseChunks)을 선입선출(FIFO) 방식으로 원자적으로 소거합니다.
        /// 거래 정지(Trading Halt) 상태일 경우 매도는 차단됩니다.
        /// </summary>
        /// <param name="stockId">종목 ID</param>
        /// <param name="quantity">매도 수량 (양수)</param>
        /// <returns>매도 트랜잭션 성공 여부 (보유량이 부족하거나 거래 정지 상태일 시 false)</returns>
        public bool RemoveStockHolding(string stockId, int quantity)
        {
            if (string.IsNullOrEmpty(stockId)) return false;
            if (quantity <= 0)
            {
                Debug.LogError("[WalletManager] 매도 수량은 0보다 커야 합니다.");
                return false;
            }

            string targetId = stockId.ToUpper();

            // ── 거래 정지(Trading Halt) 상태 감시 및 거래 차단 Failsafe ─────────────
            var stock = MarketManager.Instance.GetStock(targetId);
            if (stock != null && stock.TradingHaltEndTimeUtc.HasValue && DateTime.UtcNow < stock.TradingHaltEndTimeUtc.Value)
            {
                Debug.LogWarning($"[WalletManager] 주식 매도 실패 (거래 정지 상태): {targetId} (해제 예정: {stock.TradingHaltEndTimeUtc.Value:yyyy-MM-dd HH:mm:ss} UTC)");
                return false;
            }

            var portfolio = ActiveSaveData.Portfolio;

            if (!portfolio.TryGetValue(targetId, out var holding) || holding.Quantity < quantity)
            {
                Debug.LogWarning($"[WalletManager] 주식 매도 실패 (보유량 부족): {targetId} 필요={quantity}주, 보유={(holding != null ? holding.Quantity : 0)}주");
                return false;
            }

            // 1. 전체 수량 차감
            holding.Quantity -= quantity;

            // 2. 선입선출(FIFO) 기반으로 가장 오래된 구매 이력(Chunk)부터 순차 소거
            int remainingToDeduct = quantity;
            while (remainingToDeduct > 0 && holding.PurchaseChunks.Count > 0)
            {
                var oldestChunk = holding.PurchaseChunks[0];
                if (oldestChunk.Quantity <= remainingToDeduct)
                {
                    remainingToDeduct -= oldestChunk.Quantity;
                    holding.PurchaseChunks.RemoveAt(0);
                }
                else
                {
                    oldestChunk.Quantity -= remainingToDeduct;
                    remainingToDeduct = 0;
                }
            }

            // 3. 보유 물량이 0이 되면 포트폴리오에서 깔끔하게 삭제
            if (holding.Quantity <= 0)
            {
                portfolio.Remove(targetId);
                Debug.Log($"[WalletManager] {targetId} 잔고가 0이 되어 포트폴리오에서 완전히 삭제되었습니다.");
            }
            else
            {
                Debug.Log($"[WalletManager] 주식 매도 반영 완료: {targetId} -{quantity}주 (현재 총 보유: {holding.Quantity}주, 평단: {holding.AveragePurchasePrice:F1}G)");
            }

            return true;
        }

        #endregion
    }

    #region Wallet Events (지갑 전역 이벤트 구조체)

    /// <summary>
    /// 가용 현금 잔고가 변동되었을 때 발행되는 이벤트.
    /// </summary>
    public struct CashChangedEvent
    {
        public long PreviousCash;
        public long NewCash;
        public long Delta; // 양수(입금), 음수(출금)
    }

    /// <summary>
    /// 미지급 배당금 잔고가 변동되었을 때 발행되는 이벤트.
    /// </summary>
    public struct DividendsChangedEvent
    {
        public long PreviousDividends;
        public long NewDividends;
        public long Delta;
    }

    /// <summary>
    /// 누적 이자가 변동되었을 때 발행되는 이벤트.
    /// </summary>
    public struct InterestChangedEvent
    {
        public long PreviousInterest;
        public long NewInterest;
        public long Delta;
    }

    /// <summary>
    /// 미지급 배당금을 일괄 현금화 정산 완료했을 때 발행되는 이벤트.
    /// </summary>
    public struct DividendsClaimedEvent
    {
        public long ClaimedAmount;
    }

    #endregion
}
