using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_02 신규 IPO 상장 대체 서비스.
    /// DelistingMonitor로부터 상장폐지 완료 이벤트(StockDelistedEvent)를 수신하여,
    /// 공석이 발생한 동일한 산업군(Sector)의 IPO 대기 풀에서 후보군을 선별하여 즉각 대체 상장시킵니다.
    /// 이를 통해 게임 내 8개 섹터별 상장 종목이 상시 정확히 9개로 유지되도록 밸런스를 통제합니다.
    /// </summary>
    public class IPO_Service : Singleton<IPO_Service>
    {
        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            // 상장폐지 이벤트 전역 구독
            EventBus.Subscribe<StockDelistedEvent>(OnStockDelisted);
        }

        private void OnDisable()
        {
            // 이벤트 구독 해제
            EventBus.Unsubscribe<StockDelistedEvent>(OnStockDelisted);
        }

        /// <summary>
        /// 특정 주식의 상장폐지 퇴출을 감지하고, 동일 섹터의 IPO 대기 기업을 등판시킵니다.
        /// </summary>
        private void OnStockDelisted(StockDelistedEvent e)
        {
            Debug.LogWarning($"[IPO_Service] 상장폐지 공석 발생 감지: 종목={e.StockId}, 섹터={e.Sector}. 즉각 대체 상장(IPO) 프로세스를 가동합니다.");

            if (MarketManager.Instance == null)
            {
                Debug.LogError("[IPO_Service] MarketManager 인스턴스를 찾을 수 없어 IPO 대체 프로세스를 중단합니다.");
                return;
            }

            // ── 1. 해당 섹터의 미상장 IPO 대기 주식 풀 탐색 ─────────────────────────────
            List<StockInstance> candidates = new List<StockInstance>();
            var allIpos = MarketManager.Instance.GetIpoCandidates();

            foreach (var ipo in allIpos)
            {
                // 동일 섹터이고 아직 상장되지 않은 IPO 준비 상태 후보 필터링
                if (ipo.Data.sector == e.Sector && ipo.IsIpoReady && !ipo.IsListed)
                {
                    candidates.Add(ipo);
                }
            }

            if (candidates.Count == 0)
            {
                Debug.LogError($"[IPO_Service] 심각한 경고: {e.Sector} 섹터에 남아있는 신규 IPO 상장 대기 후보 기업이 존재하지 않습니다! (섹터 9종 균형 일시 붕괴)");
                return;
            }

            // ── 2. 결정론적 시드 일관성을 보장하기 위해 RNG_System을 통한 후보군 랜덤 선정 ─────
            int chosenIndex = 0;
            if (RNG_System.Instance != null)
            {
                // RNG_System 기반의 난수를 통해 동적 선출 (세이브 로드 시 동일 난수 흐름 보장)
                chosenIndex = RNG_System.Instance.NextInt($"IPO_{e.Sector}_{e.StockId}", 0, candidates.Count);
            }
            else
            {
                chosenIndex = UnityEngine.Random.Range(0, candidates.Count);
            }

            StockInstance selectedCandidate = candidates[chosenIndex];

            // ── 3. 선출된 후보 기업의 실시간 상장 상태 갱신 및 수치 리셋 ─────────────────
            ExecuteIpoListing(selectedCandidate);
        }

        /// <summary>
        /// 선정된 IPO 후보 주식을 정식 상장하고 데이원 초기 규격으로 완전 리셋합니다.
        /// </summary>
        private void ExecuteIpoListing(StockInstance candidate)
        {
            Debug.LogWarning($"[IPO_Service] 🚀 신규 상장 확정: {candidate.StockId} ({candidate.Data.companyName}) 기업이 {candidate.Data.sector} 섹터의 새 상장주로 공식 등판합니다!");

            // 1. 상태 전환: 대기 봉인 해제 및 활성 상장 활성화
            candidate.IsListed = true;
            candidate.IsIpoReady = false;

            // 2. 가격 및 런타임 물리 계량 수치 Day-1 스펙으로 완전 청소 및 리셋
            long startPrice = candidate.Data.listingPrice;
            candidate.CurrentPrice = startPrice;
            candidate.AvailableVolume = candidate.Data.floatingSupply;
            candidate.PeakPrice = startPrice;
            candidate.DailyHigh = startPrice;
            candidate.DailyLow = startPrice;
            candidate.SplitCount = 0;

            // 3. 시간 및 특수 타이머 초기화 (안전장치)
            candidate.BelowOnePercentStartTimeUtc = null;
            candidate.TradingHaltEndTimeUtc = null;
            candidate.IsLiquidationPeriod = false;
            candidate.LiquidationEndTimeUtc = null;

            // 4. 차트 연속성을 위한 가격 히스토리 청소 후 첫 상장가 1틱 누적
            candidate.PriceHistory.Clear();
            candidate.AddPriceToHistory(startPrice);

            Debug.Log($"[IPO_Service] {candidate.StockId} 상장 세부 리셋 완료. 상장가={startPrice}G, 유통주수={candidate.AvailableVolume}주");

            // 5. 신규 상장 전역 이벤트 퍼블리싱 (차트 초기화, 브로커 알림, 뉴스 속보 UI 연동)
            EventBus.Publish(new StockIpoListedEvent
            {
                StockId = candidate.StockId,
                CompanyName = candidate.Data.companyName,
                Sector = candidate.Data.sector,
                ListingPrice = startPrice
            });
        }
    }

    #region IPO Events (신규 상장 전역 이벤트 구조체)

    /// <summary>
    /// 대기 풀에 있던 신규 IPO 기업이 최종적으로 정식 시장 상장에 완수되었을 때 발행되는 이벤트.
    /// 뉴스 센터, 거래창 종목 리스트 갱신, 차트 리프레시 뷰 등에서 수신합니다.
    /// </summary>
    public struct StockIpoListedEvent
    {
        /// <summary>새로 상장된 종목 ID</summary>
        public string StockId;

        /// <summary>상장된 회사 이름</summary>
        public string CompanyName;

        /// <summary>소속 산업군 섹터</summary>
        public StockSector Sector;

        /// <summary>최초 상장 시작가 (Gold)</summary>
        public long ListingPrice;
    }

    #endregion
}
