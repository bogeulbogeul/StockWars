using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 주식의 현재가를 기준으로 매도 호가 6줄, 매수 호가 6줄을 동적으로 생성하고
    /// 가격, 수량, 게이지 바를 실시간 갱신하는 호가창(Order Book) 컨트롤러입니다.
    /// </summary>
    public class UIOrderBook : MonoBehaviour
    {
        [Header("Prefabs & Containers")]
        [Tooltip("방금 만든 호가창 한 줄 프리팹 (OrderBookRow)")]
        [SerializeField] private GameObject _rowPrefab;

        [Tooltip("호가 줄들이 생성될 Scroll View의 Content 트랜스폼")]
        [SerializeField] private Transform _contentContainer;

        [Tooltip("중간에 현재가를 표시할 텍스트 컴포넌트 (선택 사항)")]
        [SerializeField] private TMP_Text _middlePriceText;

        [Header("Header UI Bindings")]
        [Tooltip("상단 헤더의 종목명 TextMeshPro")]
        [SerializeField] private TMP_Text _headerCompanyNameText;

        [Tooltip("상단 헤더의 현재가 TextMeshPro")]
        [SerializeField] private TMP_Text _headerCurrentPriceText;

        [Tooltip("상단 헤더의 전일대비 등락률 TextMeshPro")]
        [SerializeField] private TMP_Text _headerChangeRateText;

        [Tooltip("상단 헤더의 실시간 미니 차트 컴포넌트")]
        [SerializeField] private UIMiniLineChart _miniChart;

        [Header("Sector Background Customization")]
        [Tooltip("주식 섹터 색상에 따라 배경색이 바뀔 이미지들 (예: 페이지 배경, HeadPanel bgColor 등)")]
        [SerializeField] private List<Image> _sectorBackgroundImages = new List<Image>();

        [Header("Colors (Sell / Ask - 매도)")]
        [SerializeField] private Color _sellBackgroundColor = new Color(0.99f, 0.82f, 0.83f, 1f); // 선명한 분홍 (#FEE2E2 계열)
        [SerializeField] private Color _sellBarColor = new Color(0.96f, 0.35f, 0.35f, 0.65f);        // 진한 빨간색

        [Header("Colors (Buy / Bid - 매수)")]
        [SerializeField] private Color _buyBackgroundColor = new Color(0.82f, 0.91f, 0.99f, 1f);  // 선명한 연하늘 (#DBEAFE 계열)
        [SerializeField] private Color _buyBarColor = new Color(0.23f, 0.58f, 0.94f, 0.65f);        // 진한 파란색

        [Header("Settings")]
        [Tooltip("호가 단계 수 (기본 6줄)")]
        [SerializeField] private int _orderLevels = 6;

        [Tooltip("호가 간격 비율 (예: 0.001 = 0.1% 간격)")]
        [SerializeField] private float _priceStepPercent = 0.002f;

        private string _targetStockId = "CLOUDBERRY"; // 기본 타겟 종목
        private List<GameObject> _instantiatedRows = new List<GameObject>();
        private long? _selectedPrice = null; // 현재 선택된 호가 가격
        private long? _basePrice = null;     // 호가 고정을 위한 기준 가격 (현재가가 범위를 벗어나면 갱신)
        private float _updateInterval = 1f;
        private float _timeSinceLastUpdate = 0f;

        private void Start()
        {
            RefreshOrderBook();
        }

        private void Update()
        {
            _timeSinceLastUpdate += Time.deltaTime;
            if (_timeSinceLastUpdate >= _updateInterval)
            {
                _timeSinceLastUpdate = 0f;
                RefreshOrderBook();
            }
        }

        /// <summary>
        /// 특정 주식 종목으로 호가창의 타겟을 변경합니다.
        /// </summary>
        public void SetTargetStock(string stockId)
        {
            _targetStockId = stockId;
            _selectedPrice = null; // 종목이 변경되면 선택 정보 초기화
            _basePrice = null;     // 종목이 변경되면 기준 가격 초기화
            RefreshOrderBook();
        }

        /// <summary>
        /// 호가 데이터를 시뮬레이션하여 화면에 그립니다.
        /// </summary>
        public void RefreshOrderBook()
        {
            if (_rowPrefab == null || _contentContainer == null) return;
            if (MarketManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(_targetStockId);
            if (stock == null) return;

            long currentPrice = stock.CurrentPrice;

            // 0. 상단 헤더 정보 바인딩 ("New Text" 자동 치환)
            if (_headerCompanyNameText != null)
            {
                _headerCompanyNameText.text = stock.Data.companyName;
            }

            if (_headerCurrentPriceText != null)
            {
                _headerCurrentPriceText.text = $"{currentPrice:N0} G";
            }

            if (_headerChangeRateText != null)
            {
                long delta = 0;
                double flucRate = 0.0;
                if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
                {
                    long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                    delta = currentPrice - prevPrice;
                    flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;
                }

                string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
                string sign = delta > 0 ? "+" : "";
                
                // Neon Cyan (#00EAFF) / Neon Red (#FF4B4B) / Gray (#AAAAAA) 매칭
                Color textCol = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                               (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));

                _headerChangeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                _headerChangeRateText.color = textCol;
            }

            if (_miniChart != null && stock.PriceHistory != null && stock.PriceHistory.Count > 0)
            {
                // 주가 등락 트렌드에 따라 차트 선 색상 연동
                long delta = 0;
                if (stock.PriceHistory.Count >= 2)
                {
                    delta = currentPrice - stock.PriceHistory[stock.PriceHistory.Count - 2];
                }
                Color chartColor = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                                  (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));
                
                _miniChart.SetColor(chartColor);
                _miniChart.DrawChart(stock.PriceHistory.ToList());
            }

            // 0.1. 섹터에 맞춰 패널 배경색 변경
            if (_sectorBackgroundImages != null && _sectorBackgroundImages.Count > 0)
            {
                Color sectorColor = Color.white;
                switch (stock.Data.sector)
                {
                    case StockSector.IT: sectorColor = new Color(0.88f, 0.95f, 1f, 1f); break; // 파스텔 블루
                    case StockSector.Bio: sectorColor = new Color(0.88f, 1f, 0.88f, 1f); break; // 파스텔 그린
                    case StockSector.Energy: sectorColor = new Color(1f, 0.98f, 0.85f, 1f); break; // 파스텔 옐로우
                    case StockSector.Finance: sectorColor = new Color(1f, 0.92f, 0.85f, 1f); break; // 파스텔 오렌지
                    case StockSector.Aerospace: sectorColor = new Color(0.93f, 0.88f, 1f, 1f); break; // 파스텔 퍼플
                    case StockSector.Entertainment: sectorColor = new Color(1f, 0.88f, 0.95f, 1f); break; // 파스텔 핑크
                    case StockSector.Infrastructure: sectorColor = new Color(0.94f, 0.90f, 0.85f, 1f); break; // 파스텔 베이지
                    case StockSector.Retail: sectorColor = new Color(0.85f, 0.98f, 0.95f, 1f); break; // 파스텔 민트
                }
                foreach (var bgImage in _sectorBackgroundImages)
                {
                    if (bgImage != null)
                    {
                        bgImage.color = sectorColor;
                    }
                }
            }

            // 기존 호가 줄 삭제
            foreach (var row in _instantiatedRows)
            {
                Destroy(row);
            }
            _instantiatedRows.Clear();

            // 중간 현재가 표시
            if (_middlePriceText != null)
            {
                _middlePriceText.text = $"Current Price: <color=#FFD700>G</color> {currentPrice:N0}";
            }

            // 시뮬레이션을 위한 랜덤성 시드
            Random.InitState((int)(currentPrice ^ System.DateTime.Now.Ticks));

            // 최대 수량 기준치 (바 비율용)
            int maxQty = 1500;

            long tickSize = System.Math.Max(1, (long)System.Math.Round(currentPrice * _priceStepPercent));

            // 만약 basePrice가 없거나, 현재가가 표시 범위(_orderLevels)를 벗어나면 중앙 정렬을 위해 갱신합니다.
            if (!_basePrice.HasValue || System.Math.Abs(currentPrice - _basePrice.Value) > (_orderLevels - 1) * tickSize)
            {
                _basePrice = currentPrice;
            }

            long basePrice = _basePrice.Value;

            // 높은 가격(위)부터 낮은 가격(아래) 순서대로 13개(2 * _orderLevels + 1)의 호가 줄을 일괄 생성
            for (int i = _orderLevels; i >= -_orderLevels; i--)
            {
                long price = basePrice + (tickSize * i);
                int qty = Random.Range(100, 1500);
                CreateRow(price, qty, maxQty, currentPrice, stock);
            }
        }

        private void CreateRow(long price, int quantity, int maxQuantity, long currentPrice, StockInstance stock)
        {
            GameObject rowGo = Instantiate(_rowPrefab, _contentContainer);
            _instantiatedRows.Add(rowGo);

            bool isSelected = (_selectedPrice.HasValue && _selectedPrice.Value == price);
            bool isCurrentPrice = (price == currentPrice);

            // 가로 레이아웃 그룹의 유동적인 너비 변화로 인한 텍스트 흔들림(Jittering) 방지
            HorizontalLayoutGroup hlg = rowGo.GetComponent<HorizontalLayoutGroup>();
            if (hlg != null) hlg.enabled = false;

            // 등락 정보 계산
            long prevPrice = (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
                ? stock.PriceHistory[stock.PriceHistory.Count - 2]
                : currentPrice;
            long delta = currentPrice - prevPrice;
            double flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;

            Color growthColor = new Color(0f, 0.92f, 1f, 1f);      // Neon Cyan
            Color declineColor = new Color(1f, 0.29f, 0.29f, 1f);    // Neon Red
            Color flatColor = new Color(0.67f, 0.67f, 0.67f, 1f);   // Gray

            // 행 가격의 색상은 전일대비(prevPrice 대비) 등락으로 색상 결정
            Color priceColor = flatColor;
            if (price > prevPrice) priceColor = growthColor;
            else if (price < prevPrice) priceColor = declineColor;

            Color trendColor = delta > 0 ? growthColor : (delta < 0 ? declineColor : flatColor);
            string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
            string sign = delta > 0 ? "+" : "";

            // 1. 가격 텍스트 설정 (항상 중앙 열)
            Transform priceTrans = rowGo.transform.Find("Price");
            if (priceTrans != null)
            {
                TMP_Text priceText = priceTrans.GetComponent<TMP_Text>();
                if (priceText != null)
                {
                    priceText.raycastTarget = false;
                    RectTransform rt = priceText.rectTransform;

                    priceText.color = new Color(0.15f, 0.15f, 0.15f, 1f); // 검은색/어두운 회색으로 고정

                    if (isCurrentPrice)
                    {
                        priceText.text = $"<b>G {price:N0}</b>";
                    }
                    else
                    {
                        priceText.text = $"G {price:N0}";
                    }

                    if (isSelected)
                    {
                        rt.anchorMin = new Vector2(0.5f, 0.5f);
                        rt.anchorMax = new Vector2(0.5f, 0.5f);
                        rt.pivot = new Vector2(0.5f, 0.5f);
                        rt.anchoredPosition = new Vector2(0f, 0f);
                        rt.sizeDelta = new Vector2(120f, 30f);
                        priceText.alignment = TextAlignmentOptions.Center;
                    }
                    else
                    {
                        rt.anchorMin = new Vector2(0.35f, 0.5f);
                        rt.anchorMax = new Vector2(0.65f, 0.5f);
                        rt.pivot = new Vector2(0.5f, 0.5f);
                        rt.anchoredPosition = Vector2.zero;
                        rt.sizeDelta = Vector2.zero;
                        priceText.alignment = TextAlignmentOptions.Center;
                    }
                }
            }

            // 2. 수량/등락률 텍스트 및 3. 수량 그래프 바 설정 (좌/우 열 분기 처리)
            Transform numTrans = rowGo.transform.Find("Number");
            Transform barTrans = rowGo.transform.Find("VolumeBar");

            TMP_Text numText = numTrans != null ? numTrans.GetComponent<TMP_Text>() : null;
            Image barImage = barTrans != null ? barTrans.GetComponent<Image>() : null;

            if (numText != null) numText.raycastTarget = false;
            if (barImage != null) barImage.raycastTarget = false;

            if (isCurrentPrice)
            {
                // 현재가 행: 우측 열에 등락률 노출, 바 숨김
                if (numText != null)
                {
                    RectTransform rt = numText.rectTransform;
                    rt.anchorMin = new Vector2(0.65f, 0.5f);
                    rt.anchorMax = new Vector2(1f, 0.5f);
                    rt.pivot = new Vector2(1f, 0.5f);
                    rt.anchoredPosition = new Vector2(-25f, 0f);
                    rt.sizeDelta = new Vector2(100f, 30f);
                    numText.alignment = TextAlignmentOptions.Right;
                    numText.text = $"<b>{indicator} {sign}{flucRate:F2}%</b>";
                    numText.color = trendColor;
                }
                if (barImage != null)
                {
                    barImage.fillAmount = 0f;
                }
            }
            else if (price > currentPrice)
            {
                // 매도 호가 (위쪽): 좌측 열에 수량 및 바 노출
                if (numText != null)
                {
                    RectTransform rt = numText.rectTransform;
                    rt.anchorMin = new Vector2(0f, 0.5f);
                    rt.anchorMax = new Vector2(0.35f, 0.5f);
                    rt.pivot = new Vector2(0f, 0.5f);
                    rt.anchoredPosition = new Vector2(25f, 0f);
                    rt.sizeDelta = new Vector2(100f, 30f);
                    numText.alignment = TextAlignmentOptions.Left;
                    numText.text = quantity.ToString();
                    numText.color = new Color(0.15f, 0.15f, 0.15f, 1f); // 차분한 검은색/어두운 회색
                }
                if (barImage != null)
                {
                    RectTransform rt = barImage.rectTransform;
                    rt.anchorMin = new Vector2(0f, 0.5f);
                    rt.anchorMax = new Vector2(0.35f, 0.5f);
                    rt.pivot = new Vector2(0f, 0.5f);
                    rt.anchoredPosition = new Vector2(25f, 0f);
                    rt.sizeDelta = new Vector2(-25f, 12f);
                    barImage.fillAmount = isSelected ? 0f : (float)quantity / maxQuantity;
                    barImage.color = _sellBarColor;
                }
            }
            else
            {
                // 매수 호가 (아래쪽): 우측 열에 수량 및 바 노출
                if (numText != null)
                {
                    RectTransform rt = numText.rectTransform;
                    rt.anchorMin = new Vector2(0.65f, 0.5f);
                    rt.anchorMax = new Vector2(1f, 0.5f);
                    rt.pivot = new Vector2(1f, 0.5f);
                    rt.anchoredPosition = new Vector2(-25f, 0f);
                    rt.sizeDelta = new Vector2(100f, 30f);
                    numText.alignment = TextAlignmentOptions.Right;
                    numText.text = quantity.ToString();
                    numText.color = new Color(0.15f, 0.15f, 0.15f, 1f);
                }
                if (barImage != null)
                {
                    RectTransform rt = barImage.rectTransform;
                    rt.anchorMin = new Vector2(0.65f, 0.5f);
                    rt.anchorMax = new Vector2(1f, 0.5f);
                    rt.pivot = new Vector2(1f, 0.5f);
                    rt.anchoredPosition = new Vector2(-25f, 0f);
                    rt.sizeDelta = new Vector2(-25f, 12f);
                    barImage.fillAmount = isSelected ? 0f : (float)quantity / maxQuantity;
                    barImage.color = _buyBarColor;
                }
            }

            // 4. 배경 및 네모틀(Outline) 설정
            Transform bgTrans = rowGo.transform.Find("bgColor");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("BG");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("Background");

            Image bgImage = bgTrans != null ? bgTrans.GetComponent<Image>() : rowGo.GetComponent<Image>();
            if (bgImage != null)
            {
                bgImage.raycastTarget = true;

                if (isCurrentPrice)
                {
                    bgImage.color = new Color(0.95f, 0.95f, 0.96f, 1f);
                }
                else
                {
                    bgImage.color = price > currentPrice ? _sellBackgroundColor : _buyBackgroundColor;
                }

                Outline outline = bgImage.gameObject.GetComponent<Outline>();
                if (isCurrentPrice)
                {
                    if (outline == null) outline = bgImage.gameObject.AddComponent<Outline>();
                    outline.effectColor = new Color(0.2f, 0.2f, 0.2f, 1f); // 스크린샷과 동일한 깔끔한 검은색/어두운 회색 테두리
                    outline.effectDistance = new Vector2(3f, 3f);
                }
                else
                {
                    if (outline != null) Destroy(outline);
                }
            }

            // 5. 매수/매도 버튼 처리
            Transform buyBtnTrans = rowGo.transform.Find("BuyButton");
            if (buyBtnTrans == null) buyBtnTrans = rowGo.transform.Find("BuyBtn");
            if (buyBtnTrans == null) buyBtnTrans = rowGo.transform.Find("buyButton");
            if (buyBtnTrans == null) buyBtnTrans = rowGo.transform.Find("buyBtn");

            Transform sellBtnTrans = rowGo.transform.Find("SellButton");
            if (sellBtnTrans == null) sellBtnTrans = rowGo.transform.Find("SellBtn");
            if (sellBtnTrans == null) sellBtnTrans = rowGo.transform.Find("sellButton");
            if (sellBtnTrans == null) sellBtnTrans = rowGo.transform.Find("sellBtn");

            bool hasSubButtons = (buyBtnTrans != null || sellBtnTrans != null);
            if (hasSubButtons)
            {
                if (isCurrentPrice)
                {
                    if (buyBtnTrans != null) buyBtnTrans.gameObject.SetActive(false);
                    if (sellBtnTrans != null) sellBtnTrans.gameObject.SetActive(false);
                }
                else
                {
                    if (buyBtnTrans != null)
                    {
                        buyBtnTrans.gameObject.SetActive(isSelected);
                        Button buyBtn = buyBtnTrans.GetComponent<Button>();
                        if (buyBtn != null)
                        {
                            buyBtn.onClick.RemoveAllListeners();
                            buyBtn.onClick.AddListener(() => ExecuteTrade(price, true));
                        }
                    }
                    if (sellBtnTrans != null)
                    {
                        sellBtnTrans.gameObject.SetActive(isSelected);
                        Button sellBtn = sellBtnTrans.GetComponent<Button>();
                        if (sellBtn != null)
                        {
                            sellBtn.onClick.RemoveAllListeners();
                            sellBtn.onClick.AddListener(() => ExecuteTrade(price, false));
                        }
                    }

                    if (numTrans != null) numTrans.gameObject.SetActive(!isSelected);
                    if (barTrans != null) barTrans.gameObject.SetActive(!isSelected);
                }
            }
            else
            {
                if (numTrans != null) numTrans.gameObject.SetActive(true);
                if (barTrans != null) barTrans.gameObject.SetActive(true);
            }

            // 6. 클릭 리스너 설정 (현재가 행이 아닐 때만 선택 가능)
            Button rowButton = rowGo.GetComponent<Button>();
            if (rowButton == null) rowButton = rowGo.AddComponent<Button>();

            rowButton.transition = Selectable.Transition.None;
            rowButton.onClick.RemoveAllListeners();
            if (!isCurrentPrice)
            {
                rowButton.onClick.AddListener(() => SelectPriceRow(price));
            }
        }

        /// <summary>
        /// 특정 가격 행을 클릭했을 때 선택 상태를 토글합니다.
        /// </summary>
        public void SelectPriceRow(long price)
        {
            Debug.Log($"[UIOrderBook] 호가 행 클릭됨: 가격 = {price}");
            if (_selectedPrice == price)
            {
                _selectedPrice = null; // 이미 선택된 상태면 선택 취소
            }
            else
            {
                _selectedPrice = price; // 새로 선택
            }
            RefreshOrderBook();
        }

        /// <summary>
        /// 매수 / 매도 버튼 클릭 시 거래 페이지(Page_Trade)로 가격과 주문 타입을 연동하여 전환합니다.
        /// </summary>
        public void ExecuteTrade(long price, bool isBuy)
        {
            Debug.Log($"[UIOrderBook] ExecuteTrade 호출 시도: 가격 = {price}, isBuy = {isBuy}");
            StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
            if (controller == null)
            {
                controller = FindAnyObjectByType<StockMarketAppController>();
            }

            if (controller != null)
            {
                Debug.Log($"[UIOrderBook] ShowTradePage 호출: stockId = {_targetStockId}, isBuy = {isBuy}, price = {price}");
                controller.ShowTradePage(_targetStockId, isBuy, price);
            }
            else
            {
                Debug.LogWarning("[UIOrderBook] StockMarketAppController를 찾을 수 없어 거래 페이지로 전환할 수 없습니다.");
            }
        }
    }
}
