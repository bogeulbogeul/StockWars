using System;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 사이버넷(주식 마켓) 앱의 홈 화면 데이터 바인딩 및 실시간 갱신을 제어하는 컨트롤러입니다.
    /// GDD에 명시된 72종 상장 데이터를 기반으로 종합 사이퍼 지수(Global Cipher Index) 및 계좌 정보를 바인딩합니다.
    /// </summary>
    public class StockMarketAppController : MonoBehaviour
    {
        [Header("Global Cipher Index UI")]
        [SerializeField] private TMP_Text _cipherIndexText;

        [Header("Account UI (AccountCard)")]
        [SerializeField] private TMP_Text _netWorthValueText;
        [SerializeField] private TMP_Text _profitsValueText;

        [Header("Watchlist ScrollView UI")]
        [SerializeField] private Transform _cardsContainer;
        [SerializeField] private List<StockCardUI> _staticCards = new List<StockCardUI>();

        private float _updateInterval = 1f; // 1초마다 갱신
        private float _timeSinceLastUpdate = 0f;

        private void Start()
        {
            // 컨테이너 하위의 카드들에서 StockCardUI 컴포넌트 자동 수집 (수동 등록 보조)
            if (_staticCards.Count == 0 && _cardsContainer != null)
            {
                foreach (Transform child in _cardsContainer)
                {
                    var cardUI = child.GetComponent<StockCardUI>();
                    if (cardUI != null)
                    {
                        _staticCards.Add(cardUI);
                    }
                }
            }

            RefreshAppUI();
        }

        private void Update()
        {
            _timeSinceLastUpdate += Time.deltaTime;
            if (_timeSinceLastUpdate >= _updateInterval)
            {
                _timeSinceLastUpdate = 0f;
                RefreshAppUI();
            }
        }

        /// <summary>
        /// 앱의 전체 UI(사이퍼 지수, 자산 현황, 종목 리스트)를 새로고침합니다.
        /// </summary>
        public void RefreshAppUI()
        {
            UpdateCipherIndex();
            UpdateAccountInfo();
            UpdateWatchlist();
        }

        /// <summary>
        /// GDD 규격에 맞춰 72개 상장 종목의 평균 등락 가중치로 종합 사이퍼 지수를 계산하여 바인딩합니다.
        /// </summary>
        private void UpdateCipherIndex()
        {
            if (MarketManager.Instance == null || _cipherIndexText == null) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            if (listedStocks == null || listedStocks.Count == 0)
            {
                _cipherIndexText.text = "Global Cipher Index: <color=#AAAAAA>2,500.00 (+0.00%) →</color>";
                return;
            }

            double sumCurrent = 0;
            double sumListing = 0;
            double sumPrev = 0;

            foreach (var stock in listedStocks)
            {
                sumCurrent += stock.CurrentPrice;
                sumListing += stock.Data.listingPrice;

                // 직전 틱 가격 복원
                long prevPrice = stock.CurrentPrice;
                if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
                {
                    prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                }
                sumPrev += prevPrice;
            }

            // 초기 상장 기준점(2500pt) 대비 종합 인덱스 스케일링
            double currentIndex = (sumCurrent / sumListing) * 2500.0;
            double prevIndex = (sumPrev / sumListing) * 2500.0;
            double delta = currentIndex - prevIndex;
            double flucRate = prevIndex != 0 ? (delta / prevIndex) * 100.0 : 0.0;

            string indicator = "→";
            string colorHex = "AAAAAA"; // 보합 회색

            if (delta > 0)
            {
                indicator = "▲";
                colorHex = "00EAFF"; // 상승 Cyan
            }
            else if (delta < 0)
            {
                indicator = "▼";
                colorHex = "FF4B4B"; // 하락 Red
            }

            string flucSign = delta > 0 ? "+" : "";
            _cipherIndexText.text = $"Global Cipher Index: <color=#{colorHex}><b>{currentIndex:N2} ({flucSign}{flucRate:F2}%) {indicator}</b></color>";
        }

        /// <summary>
        /// 플레이어 지갑 정보와 포트폴리오를 기반으로 총 순자산 및 평가손익률을 갱신합니다.
        /// </summary>
        private void UpdateAccountInfo()
        {
            if (WalletManager.Instance == null) return;

            long cash = WalletManager.Instance.GetCash();
            long portfolioValue = 0;
            long totalCost = 0;

            // 포트폴리오 평가금액 계산
            var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
            if (portfolio != null && MarketManager.Instance != null)
            {
                foreach (var kvp in portfolio)
                {
                    string stockId = kvp.Key;
                    var holding = kvp.Value;
                    if (holding.Quantity <= 0) continue;

                    var stock = MarketManager.Instance.GetStock(stockId);
                    if (stock != null)
                    {
                        portfolioValue += holding.Quantity * stock.CurrentPrice;
                        totalCost += (long)Math.Round(holding.Quantity * holding.AveragePurchasePrice);
                    }
                }
            }

            long netWorth = cash + portfolioValue;
            long profit = portfolioValue - totalCost;
            double profitRate = totalCost != 0 ? ((double)profit / totalCost) * 100.0 : 0.0;

            if (_netWorthValueText != null)
            {
                _netWorthValueText.text = $"{netWorth:N0} G";
            }

            if (_profitsValueText != null)
            {
                string colorHex = "AAAAAA";
                string sign = "";
                if (profit > 0)
                {
                    colorHex = "00EAFF"; // Cyan
                    sign = "+";
                }
                else if (profit < 0)
                {
                    colorHex = "FF4B4B"; // Red
                }

                _profitsValueText.text = $"Profits: <color=#{colorHex}><b>{sign}{profit:N0} G ({sign}{profitRate:F2}%)</b></color>";
            }
        }

        /// <summary>
        /// 스크롤 뷰 내 카드 리스트에 실제 실시간 주식 데이터를 바인딩합니다.
        /// </summary>
        private void UpdateWatchlist()
        {
            if (MarketManager.Instance == null || _staticCards.Count == 0) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            if (listedStocks == null || listedStocks.Count == 0) return;

            // 최대 바인딩 개수는 배치된 카드 숫자 또는 상장 종목 수 중 작은 값
            int bindCount = Math.Min(_staticCards.Count, listedStocks.Count);
            for (int i = 0; i < bindCount; i++)
            {
                _staticCards[i].BindData(listedStocks[i]);
            }

            // 남은 자식 카드들은 데이터가 없으므로 비활성화 처리
            for (int i = bindCount; i < _staticCards.Count; i++)
            {
                _staticCards[i].gameObject.SetActive(false);
            }
        }
    }
}
