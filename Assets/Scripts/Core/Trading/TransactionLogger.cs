using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 [주식 거래 시스템] 전역 거래 체결 일지 기록기 (TransactionLogger).
    /// <para>
    /// 플레이어의 모든 매수 및 매도 트랜잭션을 실시간으로 감청하여
    /// 전역 거래 일지 세이브 데이터(ActiveSaveData.TradeLogs)에 시간, 단가, 수량, 수수료 정보를 누적 기록합니다.
    /// </para>
    /// <para>
    /// **고급 성능 및 파일 수명 최적화:**
    /// - 무제한 로그 축적으로 인한 세이브 파일 용량 비대화(Save Bloat) 및 역직렬화 지연을 차단하기 위해
    ///   최대 로그 개수(기본 500개) 제한 규칙(FIFO)을 완벽히 시행합니다.
    /// </para>
    /// </summary>
    public class TransactionLogger : Singleton<TransactionLogger>
    {
        [Header("Logger Constraints")]
        [Tooltip("세이브 데이터 용량 방지를 위한 최대 유지 로그 개수")]
        public int maxLogLimit = 500;

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 지갑 매니저의 전역 거래 완결 이벤트 구독
            EventBus.Subscribe<StockTransactionEvent>(OnStockTransaction);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<StockTransactionEvent>(OnStockTransaction);
        }

        /// <summary>
        /// 주식 거래 발생 이벤트를 수신하여 전역 거래 일지에 영속적으로 기록합니다.
        /// </summary>
        private void OnStockTransaction(StockTransactionEvent e)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null)
            {
                Debug.LogError("[TransactionLogger] WalletManager 인프라가 없어 거래 기록을 남길 수 없습니다.");
                return;
            }

            var saveData = wallet.ActiveSaveData;
            if (saveData == null) return;

            // 1. 수수료 역산 (매수일 시 협상력 스탯 할인율 적용, 매도 시에는 수수료 면제 또는 별도 세율 반영 가능)
            long feeCalculated = 0;
            if (e.IsBuy)
            {
                double baseFeeRate = 0.0015; // 기본 0.15%
                double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
                double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);
                feeCalculated = (long)Math.Round(e.TotalAmount * finalFeeRate);
            }

            // 2. 종목명 조회 (Rich Log 연출을 위해 표시용 디스플레이 네임 병합)
            string displayName = e.StockId;
            if (MarketManager.Instance != null)
            {
                var stock = MarketManager.Instance.GetStock(e.StockId);
                if (stock != null && stock.Data != null)
                {
                    displayName = stock.Data.displayName;
                }
            }

            // 3. 거래 로그 엔트리 조립
            TradeLogEntry entry = new TradeLogEntry
            {
                TimestampUtc = DateTime.UtcNow.ToString("o"), // ISO 8601 표준 타임스탬프 포맷
                StockId = e.StockId,
                StockName = displayName,
                IsBuy = e.IsBuy,
                Quantity = e.Quantity,
                Price = e.Price,
                Fee = feeCalculated,
                TotalAmount = e.IsBuy ? e.TotalAmount + feeCalculated : e.TotalAmount - feeCalculated
            };

            // 4. 세이브 데이터 리스트 추가 (FIFO 용량 제어 포함)
            var logList = saveData.TradeLogs;
            logList.Add(entry);

            // 세이브 파일 용량 비대화 방지 (FIFO 초과분 제거)
            while (logList.Count > maxLogLimit)
            {
                logList.RemoveAt(0);
            }

            Debug.Log($"[TransactionLogger] 거래 일지 기록 완료: {e.StockId} | {(e.IsBuy ? "매수" : "매도")} | {e.Quantity}주 | 총액: {entry.TotalAmount:N0}G (수수료: {feeCalculated:N0}G)");

            // 전역 거래 로그 갱신 완료 이벤트 발행 (UI 실시간 갱신 트리거)
            EventBus.Publish(new TradeLogUpdatedEvent
            {
                NewEntry = entry,
                TotalLogCount = logList.Count
            });
        }

        /// <summary>
        /// 현재까지 기록된 전역 거래 기록 리스트를 안전하게 읽어옵니다.
        /// </summary>
        public List<TradeLogEntry> GetTradeLogs()
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return new List<TradeLogEntry>();
            }
            return WalletManager.Instance.ActiveSaveData.TradeLogs;
        }

        /// <summary>
        /// [디버그/관리용] 전체 거래 기록 일지를 소거합니다.
        /// </summary>
        public void ClearTradeLogs()
        {
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.TradeLogs.Clear();
                Debug.LogWarning("[TransactionLogger] 전체 거래 기록 일지가 초기화되었습니다.");
                
                EventBus.Publish(new TradeLogUpdatedEvent
                {
                    NewEntry = null,
                    TotalLogCount = 0
                });
            }
        }
    }

    #region Transaction Logger Events

    /// <summary>
    /// 전역 거래 일지 데이터에 신규 항목이 영속 기록되고 갱신 완료되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct TradeLogUpdatedEvent
    {
        public TradeLogEntry NewEntry; // 신규 기록된 항목 (소거 시 null)
        public int TotalLogCount;      // 현재 저장된 누적 로그 총량
    }

    #endregion
}
