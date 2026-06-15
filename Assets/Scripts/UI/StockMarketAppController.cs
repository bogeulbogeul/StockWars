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
        [Header("Pages (Navigation)")]
        [SerializeField] private GameObject _pageHome;
        [SerializeField] private GameObject _pageMarket;
        [SerializeField] private GameObject _pagePaymentMain;
        [SerializeField] private GameObject _pageTrade;

        [Header("Home: Recent Watchlist UI")]
        [SerializeField] private Transform _recentCardsContainer;
        [SerializeField] private GameObject _recentCardPrefab; // 홈 화면용 네모난 프리팹 (StockCard_01)
        private List<StockCardUI> _instantiatedRecentCards = new List<StockCardUI>();

        // 섹터 필터 상태 (null이면 '전체')
        private StockSector? _currentSectorFilter = null;

        [Header("Dashboard Header UI")]
        [SerializeField] private TMP_Text _profileGreetingText;
        [SerializeField] private TMP_Text _cipherIndexText; // 글로벌 사이퍼 지수 (네온 스타일)

        [Header("Portfolio Card UI")]
        [SerializeField] private TMP_Text _portfolioTotalText;
        [SerializeField] private TMP_Text _portfolioTodayText;
        [SerializeField] private TMP_Text _portfolioStocksText;
        [SerializeField] private TMP_Text _portfolioCashText;
        [SerializeField] private UIMiniLineChart _netWorthChart;

        [Header("Watchlist ScrollView UI")]
        [SerializeField] private Transform _cardsContainer;
        [SerializeField] private GameObject _stockCardPrefab; // 프로젝트 창에 있는 StockList 프리팹
        private List<StockCardUI> _instantiatedCards = new List<StockCardUI>();

        private float _updateInterval = 1f; // 1초마다 갱신
        private float _timeSinceLastUpdate = 0f;

        private void Start()
        {
            // 앱 시작 시 홈 화면부터 보여주기
            ShowHome();

            // 1. 프리팹을 이용해 상장된 모든 주식 카드를 동적으로 72개 생성!
            if (_stockCardPrefab != null && _cardsContainer != null && MarketManager.Instance != null)
            {
                var listedStocks = MarketManager.Instance.GetListedStocks();
                foreach (var stock in listedStocks)
                {
                    GameObject cardObj = Instantiate(_stockCardPrefab, _cardsContainer);
                    StockCardUI cardUI = cardObj.GetComponent<StockCardUI>();
                    if (cardUI != null)
                    {
                        _instantiatedCards.Add(cardUI);
                        cardUI.BindData(stock, this);
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
            UpdateRecentWatchlist();

            if (_pageTrade != null && _pageTrade.activeSelf)
            {
                UITradePage tradePage = GetComponentInChildren<UITradePage>(true);
                if (tradePage != null) tradePage.UpdateUI();
            }
        }

        #region Navigation Methods
        /// <summary>
        /// 홈 탭 버튼 클릭 시 호출
        /// </summary>
        public void ShowHome()
        {
            if (_pageHome != null) _pageHome.SetActive(true);
            if (_pageMarket != null) _pageMarket.SetActive(false);
            if (_pagePaymentMain != null) _pagePaymentMain.SetActive(false);
            if (_pageTrade != null) _pageTrade.SetActive(false);

            RefreshAppUI();
        }

        /// <summary>
        /// 마켓 탭 버튼 클릭 시 호출
        /// </summary>
        public void ShowMarket()
        {
            if (_pageHome != null) _pageHome.SetActive(false);
            if (_pageMarket != null) _pageMarket.SetActive(true);
            if (_pagePaymentMain != null) _pagePaymentMain.SetActive(false);
            if (_pageTrade != null) _pageTrade.SetActive(false);
        }

        /// <summary>
        /// 특정 주식 종목을 클릭했을 때 거래/호가창 화면으로 전환합니다.
        /// </summary>
        public void ShowPaymentPage(string stockId)
        {
            if (_pageHome != null) _pageHome.SetActive(false);
            if (_pageMarket != null) _pageMarket.SetActive(false);
            if (_pagePaymentMain != null) _pagePaymentMain.SetActive(true);
            if (_pageTrade != null) _pageTrade.SetActive(false);

            // 최근 조회 목록(Recent Watchlist) 갱신
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                var recentIds = WalletManager.Instance.ActiveSaveData.RecentViewedStockIds;
                if (recentIds != null)
                {
                    recentIds.Remove(stockId);
                    recentIds.Insert(0, stockId);
                    if (recentIds.Count > 3)
                    {
                        recentIds.RemoveRange(3, recentIds.Count - 3);
                    }
                }
            }

            // 호가창 컴포넌트를 찾아서 데이터 로드
            UIOrderBook orderBook = GetComponentInChildren<UIOrderBook>(true);
            if (orderBook == null && _pagePaymentMain != null)
            {
                orderBook = _pagePaymentMain.GetComponentInChildren<UIOrderBook>(true);
            }

            if (orderBook != null)
            {
                orderBook.SetTargetStock(stockId);
            }
        }

        /// <summary>
        /// 호가 클릭 시 수량 선택 및 주문 거래 실행이 가능한 거래 전용 상세 페이지로 전환합니다.
        /// </summary>
        /// <param name="stockId">거래할 상장 주식 ID</param>
        /// <param name="isBuy">true면 매수 탭 활성화, false면 매도 탭 활성화</param>
        /// <param name="targetPrice">예상 거래 단가 (클릭된 호가 가격)</param>
        public void ShowTradePage(string stockId, bool isBuy, long targetPrice)
        {
            if (_pageHome != null) _pageHome.SetActive(false);
            if (_pageMarket != null) _pageMarket.SetActive(false);
            if (_pagePaymentMain != null) _pagePaymentMain.SetActive(false);
            if (_pageTrade != null) _pageTrade.SetActive(true);

            UITradePage tradePage = GetComponentInChildren<UITradePage>(true);
            if (tradePage == null && _pageTrade != null)
            {
                tradePage = _pageTrade.GetComponentInChildren<UITradePage>(true);
            }

            if (tradePage != null)
            {
                tradePage.Initialize(stockId, isBuy, targetPrice);
            }
            else
            {
                Debug.LogWarning("[StockMarketAppController] Page_Trade가 켜졌으나 UITradePage 컴포넌트를 찾을 수 없습니다.");
            }
        }

        /// <summary>
        /// 섹터 버튼 클릭 시 호출 (유니티 버튼의 OnClick에서 int 매개변수 사용)
        /// -1: 전체, 0: IT, 1: 엔터테인먼트, 2: 인프라 ...
        /// </summary>
        public void FilterBySector(int sectorIndex)
        {
            if (sectorIndex < 0)
            {
                _currentSectorFilter = null; // 전체 보기
            }
            else
            {
                _currentSectorFilter = (StockSector)sectorIndex;
            }
            
            // 필터가 변경되었으므로 리스트를 즉시 새로고침합니다.
            UpdateWatchlist();
        }
        #endregion

        /// <summary>
        /// GDD 규격에 맞춰 72개 상장 종목의 평균 등락 가중치로 종합 사이퍼 지수를 계산하여 바인딩합니다.
        /// </summary>
        private void UpdateCipherIndex()
        {
            if (MarketManager.Instance == null || _cipherIndexText == null) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            if (listedStocks == null || listedStocks.Count == 0)
            {
                _cipherIndexText.text = " 글로벌 사이퍼 지수: <color=#AAAAAA>2,500.00 (+0.00%) →</color>";
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

            string indicator = "-";
            string colorHex = "AAAAAA"; // 보합 회색

            if (delta > 0)
            {
                indicator = "▲";
                colorHex = "00EAFF"; // 네온 Cyan
            }
            else if (delta < 0)
            {
                indicator = "▼";
                colorHex = "FF4B4B"; // 네온 Red
            }

            string flucSign = delta > 0 ? "+" : "";
            _cipherIndexText.text = $" 글로벌 사이퍼 지수: <color=#{colorHex}><b>{currentIndex:N2} ({flucSign}{flucRate:F2}%) {indicator}</b></color>";
        }

        /// <summary>
        /// 플레이어 지갑 정보와 포트폴리오를 기반으로 총 순자산, 주식/현금 비율, 그리고 오늘의 수익률을 갱신합니다.
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

            if (_profileGreetingText != null)
            {
                // TODO: 실제 플레이어 이름 연동, 현재는 하드코딩
                _profileGreetingText.text = "Hello,\nHana!";
            }

            if (_portfolioTotalText != null)
            {
                _portfolioTotalText.text = $"<color=#FFD700>G</color> {netWorth:N0}";
            }

            Color targetColor = new Color(0.58f, 0.64f, 0.72f, 1f); // default gray (#94A3B8)
            string sign = "";
            if (profit > 0)
            {
                targetColor = new Color(0.13f, 0.77f, 0.37f, 1f); // green (#22C55E)
                sign = "+";
            }
            else if (profit < 0)
            {
                targetColor = new Color(0.94f, 0.27f, 0.27f, 1f); // red (#EF4444)
            }

            if (_portfolioTodayText != null)
            {
                _portfolioTodayText.color = targetColor;
                _portfolioTodayText.text = $"Today\n{sign}G {profit:N0} ({sign}{profitRate:F2}%)";
            }

            if (_portfolioStocksText != null)
            {
                _portfolioStocksText.text = $"Stocks: <color=#D4AF37>G</color> {portfolioValue:N0}";
            }

            if (_portfolioCashText != null)
            {
                _portfolioCashText.text = $"Cash: <color=#D4AF37>G</color> {cash:N0}";
            }

            // ── 순자산 미니 선형 차트 실시간 렌더링 ──
            if (_netWorthChart == null && _portfolioTodayText != null)
            {
                Transform parent = _portfolioTodayText.transform.parent; // AccountCard
                Transform existingChart = parent.Find("NetWorthChart");
                if (existingChart != null)
                {
                    _netWorthChart = existingChart.GetComponent<UIMiniLineChart>();
                }
                else
                {
                    GameObject chartGo = new GameObject("NetWorthChart", typeof(RectTransform), typeof(UIMiniLineChart));
                    chartGo.transform.SetParent(parent, false);

                    RectTransform rt = chartGo.GetComponent<RectTransform>();
                    rt.anchorMin = _portfolioTodayText.rectTransform.anchorMin;
                    rt.anchorMax = _portfolioTodayText.rectTransform.anchorMax;
                    rt.pivot = new Vector2(0.5f, 0.5f);

                    // Today 텍스트 위치 기준 48픽셀 하단 배치
                    Vector2 todayPos = _portfolioTodayText.rectTransform.anchoredPosition;
                    rt.anchoredPosition = new Vector2(todayPos.x, todayPos.y - 48f);
                    rt.sizeDelta = new Vector2(100f, 32f);

                    _netWorthChart = chartGo.GetComponent<UIMiniLineChart>();
                }
            }

            if (_netWorthChart != null && WalletManager.Instance.ActiveSaveData != null)
            {
                var history = WalletManager.Instance.ActiveSaveData.NetWorthHistory;
                if (history != null)
                {
                    // 데이터가 비었거나 단일값인 경우 현재 순자산으로 최소 2개 채워 렌더링 보장
                    while (history.Count < 2)
                    {
                        history.Add(netWorth);
                    }

                    _netWorthChart.SetColor(targetColor);
                    _netWorthChart.DrawChart(history);
                }
            }
        }

        /// <summary>
        /// 스크롤 뷰 내 카드 리스트에 실제 실시간 주식 데이터를 바인딩합니다.
        /// </summary>
        private void UpdateWatchlist()
        {
            if (MarketManager.Instance == null || _instantiatedCards.Count == 0) return;

            var listedStocks = MarketManager.Instance.GetListedStocks();
            if (listedStocks == null || listedStocks.Count == 0) return;

            // 현재 선택된 섹터가 있다면 필터링합니다.
            var filteredStocks = listedStocks;
            if (_currentSectorFilter.HasValue)
            {
                filteredStocks = listedStocks.FindAll(s => s.Data.sector == _currentSectorFilter.Value);
            }

            // 필터링된 주식 개수에 맞춰 카드를 활성화하고 데이터를 씌웁니다.
            for (int i = 0; i < _instantiatedCards.Count; i++)
            {
                if (i < filteredStocks.Count)
                {
                    _instantiatedCards[i].gameObject.SetActive(true);
                    _instantiatedCards[i].BindData(filteredStocks[i], this);
                }
                else
                {
                    // 필터링되어 남는 카드는 임시로 숨깁니다.
                    _instantiatedCards[i].gameObject.SetActive(false);
                }
            }
        }

        /// <summary>
        /// 홈 화면의 최근 조회 목록을 업데이트합니다.
        /// </summary>
        private void UpdateRecentWatchlist()
        {
            if (_recentCardPrefab == null || _recentCardsContainer == null || MarketManager.Instance == null) return;
            if (WalletManager.Instance == null) return;

            var recentIds = WalletManager.Instance.ActiveSaveData?.RecentViewedStockIds;
            if (recentIds == null) return;

            // 아직 상세 조회(클릭) 기능이 없으므로, 최근 조회가 비어있다면 임시로 샘플 종목 3개를 넣어줍니다.
            if (recentIds.Count == 0)
            {
                recentIds.Add("C001");
                recentIds.Add("C002");
                recentIds.Add("E001");
            }

            // 기존 카드 재활용 또는 부족하면 생성
            for (int i = 0; i < recentIds.Count; i++)
            {
                if (i >= _instantiatedRecentCards.Count)
                {
                    GameObject cardObj = Instantiate(_recentCardPrefab, _recentCardsContainer);
                    StockCardUI cardUI = cardObj.GetComponent<StockCardUI>();
                    if (cardUI != null) _instantiatedRecentCards.Add(cardUI);
                }
                
                var stock = MarketManager.Instance.GetStock(recentIds[i]);
                if (stock != null)
                {
                    _instantiatedRecentCards[i].gameObject.SetActive(true);
                    _instantiatedRecentCards[i].BindData(stock, this);
                }
            }

            // 남는 카드는 숨김 처리
            for (int i = recentIds.Count; i < _instantiatedRecentCards.Count; i++)
            {
                _instantiatedRecentCards[i].gameObject.SetActive(false);
            }
        }
    }
}
