using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// CORE_GDD_02 [주식 거래 시스템] 상세 주문 화면 컨트롤러.
    /// 수량 조절 (+/-), 탭 전환(매수/매도), 잔고/보유수량 조회 및 최종 주문 체결을 처리합니다.
    /// 추가로 좌측에 5단계 미니 호가창을 함께 렌더링합니다.
    /// </summary>
    public class UITradePage : MonoBehaviour
    {
        [Header("Stock Info Header")]
        [SerializeField] private TMP_Text _companyNameText;
        [SerializeField] private TMP_Text _currentPriceText;
        [SerializeField] private TMP_Text _changeRateText;
        [SerializeField] private UIMiniLineChart _miniChart;

        [Header("Sector Background Customization")]
        [SerializeField] private List<Image> _sectorBackgroundImages = new List<Image>();

        [Header("Buy / Sell / Info Tabs")]
        [SerializeField] private Button _buyTabButton;
        [SerializeField] private Button _sellTabButton;
        [SerializeField] private Button _infoTabButton;
        [SerializeField] private Color _buyActiveTabColor = new Color(0.6f, 0.9f, 0.6f, 1f); // 파스텔 그린
        [SerializeField] private Color _sellActiveTabColor = new Color(0.6f, 0.8f, 0.9f, 1f); // 파스텔 블루
        [SerializeField] private Color _inactiveTabColor = new Color(0.9f, 0.9f, 0.9f, 0.6f);

        [Header("Quantity & Price Selector")]
        [SerializeField] private TMP_Text _qtyText;
        [SerializeField] private Button _minusQtyButton;
        [SerializeField] private Button _plusQtyButton;
        [SerializeField] private TMP_Text _selectedPriceText;
        [SerializeField] private Button _infoButton;

        [Header("Percentage Buttons")]
        [SerializeField] private Button _percent10Button;
        [SerializeField] private Button _percent25Button;
        [SerializeField] private Button _percent50Button;
        [SerializeField] private Button _percent100Button;

        [Header("Dynamic Action Labels")]
        [SerializeField] private TMP_Text _actionTitleText; // "구매 수량" 또는 "판매 수량"으로 자동 변경될 텍스트

        [Header("Transaction Details")]
        [SerializeField] private TMP_Text _totalValueText;
        [SerializeField] private TMP_Text _balanceText;
        [SerializeField] private TMP_Text _availableStockText;

        [Header("Execute Button")]
        [SerializeField] private Button _executeButton;
        [SerializeField] private TMP_Text _executeButtonText;
        [SerializeField] private Color _buyButtonColor = new Color(0.96f, 0.35f, 0.35f, 1f); // 매수 빨강
        [SerializeField] private Color _sellButtonColor = new Color(0.23f, 0.58f, 0.94f, 1f); // 매도 파랑

        [Header("Navigation Back Button")]
        [SerializeField] private Button _backButton;

        [Header("Mini Order Book (5 Levels)")]
        [SerializeField] private Transform _miniOrderBookContainer;
        [SerializeField] private GameObject _miniRowPrefab;

        // 거래 상태 관리 변수
        private string _targetStockId;
        private bool _isBuy = true;
        private int _qty = 1;
        private long _tradePrice;
        private List<GameObject> _instantiatedMiniRows = new List<GameObject>();

        private void Start()
        {
            // +/- 버튼 및 탭 리스너 등록
            if (_minusQtyButton != null) _minusQtyButton.onClick.AddListener(OnMinusQtyClicked);
            if (_plusQtyButton != null) _plusQtyButton.onClick.AddListener(OnPlusQtyClicked);
            
            if (_buyTabButton != null) _buyTabButton.onClick.AddListener(() => SetTab(true));
            if (_sellTabButton != null) _sellTabButton.onClick.AddListener(() => SetTab(false));
            
            if (_infoTabButton != null) _infoTabButton.onClick.AddListener(OnInfoClicked);
            if (_infoButton != null) _infoButton.onClick.AddListener(OnInfoClicked);

            if (_percent10Button != null) _percent10Button.onClick.AddListener(() => OnPercentClicked(0.10f));
            if (_percent25Button != null) _percent25Button.onClick.AddListener(() => OnPercentClicked(0.25f));
            if (_percent50Button != null) _percent50Button.onClick.AddListener(() => OnPercentClicked(0.50f));
            if (_percent100Button != null) _percent100Button.onClick.AddListener(() => OnPercentClicked(1.00f));

            if (_executeButton != null) _executeButton.onClick.AddListener(OnExecuteClicked);
            if (_backButton != null)
            {
                _backButton.onClick.AddListener(OnBackClicked);
            }
        }

        /// <summary>
        /// 상세 거래 화면을 지정된 가격 및 주문 유형(매수/매도)으로 초기 바인딩합니다.
        /// </summary>
        public void Initialize(string stockId, bool isBuy, long initialPrice)
        {
            _targetStockId = stockId;
            _isBuy = isBuy;
            _qty = 1;
            _tradePrice = initialPrice;

            UpdateUI();
        }

        /// <summary>
        /// 실시간 데이터를 바탕으로 거래 UI를 전면 새로고침합니다.
        /// </summary>
        public void UpdateUI()
        {
            if (MarketManager.Instance == null || WalletManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(_targetStockId);
            if (stock == null) return;

            // 1. 헤더 기본 주식 정보 갱신
            long delta = 0;
            double flucRate = 0.0;
            if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
            {
                long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                delta = stock.CurrentPrice - prevPrice;
                flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;
            }

            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";

            if (_changeRateText != null)
            {
                string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
                string sign = delta > 0 ? "+" : "";
                
                Color textCol = delta > 0 ? new Color(0f, 0.8f, 0.4f, 1f) : 
                               (delta < 0 ? new Color(0.9f, 0.3f, 0.3f, 1f) : new Color(0.5f, 0.5f, 0.5f, 1f));

                _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                _changeRateText.color = textCol;
            }

            // 1.5. 섹터에 맞춰 패널/헤더 배경색 변경
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

            // 1.6. 미니 라인 차트 렌더링
            if (_miniChart != null)
            {
                // 차트 색상은 등락률에 따라 녹색/적색으로 설정 (또는 테마색)
                Color chartColor = flucRate >= 0 ? new Color(0.2f, 0.8f, 0.2f, 1f) : new Color(0.9f, 0.2f, 0.2f, 1f);
                _miniChart.SetColor(chartColor);
                _miniChart.DrawChart(stock.PriceHistory.ToList());
            }

            // 2. 수량 및 거래 가격 텍스트 갱신
            if (_qtyText != null) _qtyText.text = _qty.ToString();
            if (_selectedPriceText != null) _selectedPriceText.text = $"{_tradePrice:N0} G";

            // 3. 지갑 잔고 및 보유 정보 갱신
            long cash = WalletManager.Instance.GetCash();
            if (_balanceText != null) _balanceText.text = $"{cash:N0} G";

            int ownedQty = 0;
            var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
            if (portfolio != null && portfolio.TryGetValue(_targetStockId.ToUpper(), out var holding))
            {
                ownedQty = holding.Quantity;
            }
            if (_availableStockText != null) _availableStockText.text = $"{ownedQty}주 보유 중";

            // 4. 수량과 호가 가격에 따른 총 예상 거래액 갱신 (수수료 포함)
            double baseFeeRate = 0.0015;
            double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
            double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);

            long totalValue = 0;
            if (_isBuy)
            {
                totalValue = (long)Math.Round((_qty * _tradePrice) * (1.0 + finalFeeRate));
            }
            else
            {
                totalValue = (long)Math.Round((_qty * _tradePrice) * (1.0 - finalFeeRate));
            }
            
            if (_totalValueText != null) _totalValueText.text = $"총 금액: {totalValue:N0} G";

            // 5. 탭 시각적 상태 갱신 (책갈피 효과를 위해 활성화된 탭은 색상 변경 및 가장 앞으로 렌더링)
            if (_buyTabButton != null)
            {
                var image = _buyTabButton.GetComponent<Image>();
                if (image != null) image.color = _isBuy ? _buyActiveTabColor : _inactiveTabColor;
                if (_isBuy) _buyTabButton.transform.SetAsLastSibling();
            }
            if (_sellTabButton != null)
            {
                var image = _sellTabButton.GetComponent<Image>();
                if (image != null) image.color = !_isBuy ? _sellActiveTabColor : _inactiveTabColor;
                if (!_isBuy) _sellTabButton.transform.SetAsLastSibling();
            }

            // 5.5. 라벨 및 텍스트 동적 변경 (구매 수량 / 판매 수량)
            if (_actionTitleText != null)
            {
                _actionTitleText.text = _isBuy ? "구매 수량" : "판매 수량";
            }

            // 6. 하단 최종 주문 버튼 비주얼 설정
            if (_executeButton != null)
            {
                var image = _executeButton.GetComponent<Image>();
                if (image != null)
                {
                    image.color = _isBuy ? _buyButtonColor : _sellButtonColor;
                }
            }

            if (_executeButtonText != null)
            {
                _executeButtonText.text = _isBuy ? "BUY △" : "SELL ▽";
            }

            // 7. 좌측 5단계 미니 호가창 그리기
            UpdateMiniOrderBook(stock);
        }

        /// <summary>
        /// 탭을 매수(true) 또는 매도(false)로 직접 변경합니다.
        /// </summary>
        public void SetTab(bool isBuy)
        {
            _isBuy = isBuy;
            _qty = 1;
            UpdateUI();
        }

        private void OnPlusQtyClicked()
        {
            _qty++;
            UpdateUI();
        }

        private void OnMinusQtyClicked()
        {
            if (_qty > 1)
            {
                _qty--;
                UpdateUI();
            }
        }

        private void OnBackClicked()
        {
            StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
            if (controller != null)
            {
                controller.ShowPaymentPage(_targetStockId);
            }
        }

        private void OnInfoClicked()
        {
            // 정보 탭도 클릭 시 화면 맨 앞으로 튀어나오게 (책갈피 선 덮기 효과)
            if (_infoTabButton != null) _infoTabButton.transform.SetAsLastSibling();

            // 정보 탭이나 정보 버튼을 눌렀을 때의 동작 (추후 컨트롤러와 연동)
            Debug.Log($"[UITradePage] {_targetStockId} 정보(Info) 보기 요청됨!");
            
            // 예시: StockMarketAppController에 ShowInfoPage가 있다면 아래처럼 호출
            // StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
            // if (controller != null) controller.ShowInfoPage(_targetStockId);
        }

        private void OnPercentClicked(float percent)
        {
            if (WalletManager.Instance == null || _tradePrice <= 0) return;

            if (_isBuy)
            {
                long availableCash = WalletManager.Instance.GetCash();
                double baseFeeRate = 0.0015;
                double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
                double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);

                double pricePerShare = _tradePrice * (1.0 + finalFeeRate);
                int maxBuyQty = (int)Math.Floor(availableCash / pricePerShare);

                _qty = Math.Max(1, (int)(maxBuyQty * percent));
                if (maxBuyQty == 0) _qty = 0;
            }
            else
            {
                int maxSellQty = 0;
                var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
                if (portfolio != null && portfolio.TryGetValue(_targetStockId.ToUpper(), out var holding))
                {
                    maxSellQty = holding.Quantity;
                }
                
                _qty = Math.Max(1, (int)(maxSellQty * percent));
                if (maxSellQty == 0) _qty = 0;
            }

            UpdateUI();
        }

        private void OnExecuteClicked()
        {
            if (WalletManager.Instance == null || MarketManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(_targetStockId);
            if (stock == null) return;

            double baseFeeRate = 0.0015;
            double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
            double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);

            if (_isBuy)
            {
                long availableCash = WalletManager.Instance.GetCash();
                long totalCost = (long)Math.Round((_qty * _tradePrice) * (1.0 + finalFeeRate));

                if (availableCash < totalCost)
                {
                    Debug.LogWarning($"[UITradePage] 매수 실패: 예수금이 부족합니다. 필요={totalCost}G, 보유={availableCash}G");
                    return;
                }

                if (WalletManager.Instance.SpendCash(totalCost))
                {
                    if (WalletManager.Instance.AddStockHolding(_targetStockId, _qty, _tradePrice))
                    {
                        Debug.Log($"[UITradePage] 매수 성공: {_targetStockId} {_qty}주 체결 완료! (단가: {_tradePrice}G)");
                        
                        StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
                        if (controller != null) controller.RefreshAppUI();
                        
                        UpdateUI();
                    }
                    else
                    {
                        WalletManager.Instance.AddCash(totalCost);
                    }
                }
            }
            else
            {
                var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
                bool hasHolding = portfolio != null && portfolio.TryGetValue(_targetStockId.ToUpper(), out var holding) && holding.Quantity >= _qty;

                if (!hasHolding)
                {
                    Debug.LogWarning($"[UITradePage] 매도 실패: 보유량이 부족합니다.");
                    return;
                }

                if (WalletManager.Instance.RemoveStockHolding(_targetStockId, _qty))
                {
                    long saleRevenue = (long)Math.Round((_qty * _tradePrice) * (1.0 - finalFeeRate));
                    WalletManager.Instance.AddCash(saleRevenue);
                    
                    Debug.Log($"[UITradePage] 매도 성공: {_targetStockId} {_qty}주 체결 완료! (단가: {_tradePrice}G)");

                    StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
                    if (controller != null) controller.RefreshAppUI();

                    _qty = 1; // 수량 초기화
                    UpdateUI();
                }
            }
        }

        /// <summary>
        /// 좌측에 5단계 미니 호가 데이터를 렌더링하고, 클릭 시 거래 가격에 반영되도록 리스너를 연동합니다.
        /// </summary>
        private void UpdateMiniOrderBook(StockInstance stock)
        {
            if (_miniRowPrefab == null || _miniOrderBookContainer == null) return;

            Transform actualContainer = _miniOrderBookContainer;
            
            // 만약 유저가 Scroll View 자체를 할당했다면, 자동으로 그 안의 Content를 찾아줍니다.
            UnityEngine.UI.ScrollRect scrollRect = actualContainer.GetComponent<UnityEngine.UI.ScrollRect>();
            if (scrollRect != null && scrollRect.content != null)
            {
                actualContainer = scrollRect.content;
            }

            // 기존 미니 호가 리스트 클리어
            foreach (var row in _instantiatedMiniRows)
            {
                Destroy(row);
            }
            _instantiatedMiniRows.Clear();

            // 선택된 가격(_tradePrice)을 기준으로 7단계 가격 계산 (+3틱 ~ -3틱)
            double stepPercent = 0.002; // 0.2% 간격
            long basePrice = _tradePrice > 0 ? _tradePrice : stock.CurrentPrice;

            long[] prices = new long[7];
            prices[0] = (long)Math.Round(basePrice * (1.0 + stepPercent * 3)); // 매도3
            prices[1] = (long)Math.Round(basePrice * (1.0 + stepPercent * 2)); // 매도2
            prices[2] = (long)Math.Round(basePrice * (1.0 + stepPercent * 1)); // 매도1
            prices[3] = basePrice;                                             // 기준가 (선택된 가격)
            prices[4] = (long)Math.Round(basePrice * (1.0 - stepPercent * 1)); // 매수1
            prices[5] = (long)Math.Round(basePrice * (1.0 - stepPercent * 2)); // 매수2
            prices[6] = (long)Math.Round(basePrice * (1.0 - stepPercent * 3)); // 매수3

            // 결정론적 무작위 수량 생성용 시드
            int stockSeed = stock.Data.stockId.GetHashCode();
            System.Random rand = new System.Random(stockSeed);

            for (int i = 0; i < 7; i++)
            {
                long price = prices[i];
                // UI 프리팹 생성 시 반드시 세 번째 인자를 false로 주어 스케일과 위치가 꼬이는 것을 방지합니다.
                GameObject rowGo = Instantiate(_miniRowPrefab, actualContainer, false);
                _instantiatedMiniRows.Add(rowGo);

                // 만약을 위한 강제 스케일/위치 초기화
                RectTransform rt = rowGo.GetComponent<RectTransform>();
                if (rt != null)
                {
                    rt.localScale = Vector3.one;
                    rt.localPosition = new Vector3(rt.localPosition.x, rt.localPosition.y, 0);
                }

                // 프리팹의 크기/설정 오류를 무시하고 무조건 컨테이너 안에 7줄이 맞도록 강제
                UnityEngine.UI.LayoutElement le = rowGo.GetComponent<UnityEngine.UI.LayoutElement>();
                if (le == null) le = rowGo.AddComponent<UnityEngine.UI.LayoutElement>();
                le.minHeight = 310f / 7f;
                le.preferredHeight = 310f / 7f;
                le.flexibleHeight = 1f;

                // 1 & 3. 텍스트 바인딩 (TMP_Text와 구버전 Text 모두 대응)
                TMP_Text tmpPrice = null, tmpVol = null;
                UnityEngine.UI.Text legPrice = null, legVol = null;

                foreach (var txt in rowGo.GetComponentsInChildren<TMP_Text>(true))
                {
                    if (txt.name.IndexOf("Price", System.StringComparison.OrdinalIgnoreCase) >= 0) tmpPrice = txt;
                    else if (txt.name.IndexOf("Volume", System.StringComparison.OrdinalIgnoreCase) >= 0 || txt.name.IndexOf("Number", System.StringComparison.OrdinalIgnoreCase) >= 0) tmpVol = txt;
                }
                foreach (var txt in rowGo.GetComponentsInChildren<UnityEngine.UI.Text>(true))
                {
                    if (txt.name.IndexOf("Price", System.StringComparison.OrdinalIgnoreCase) >= 0) legPrice = txt;
                    else if (txt.name.IndexOf("Volume", System.StringComparison.OrdinalIgnoreCase) >= 0 || txt.name.IndexOf("Number", System.StringComparison.OrdinalIgnoreCase) >= 0) legVol = txt;
                }

                if (tmpPrice != null) tmpPrice.text = $"{price:N0}";
                if (legPrice != null) legPrice.text = $"{price:N0}";

                // 2 & 3. 텍스트 설정 및 배경 바(Bar) 가변 사이즈 조절
                double vol = (i == 3) ? 0 : (3.0 + rand.NextDouble() * 12.0);
                string volStr = (i == 3) ? "-" : $"{vol:F1}k";

                // 가변 길이와 정렬을 위해 레이아웃 그룹 설정을 스크립트로 강제 교정 (마스크 잘림 방지)
                UnityEngine.UI.HorizontalLayoutGroup hlg = rowGo.GetComponent<UnityEngine.UI.HorizontalLayoutGroup>();
                if (hlg != null)
                {
                    hlg.childForceExpandWidth = false;
                    hlg.childControlWidth = true;
                    hlg.childAlignment = UnityEngine.TextAnchor.MiddleLeft; // 기준점을 무조건 왼쪽 끝으로 고정!
                }

                // 가격 텍스트 좌측 정렬 (캡슐이 줄어들어도 잘리지 않게)
                if (tmpPrice != null) 
                {
                    tmpPrice.alignment = TMPro.TextAlignmentOptions.Left;
                    tmpPrice.margin = new Vector4(15, 0, 0, 0); // 왼쪽 여백 살짝 띄우기
                }

                // 수량 텍스트 (오른쪽 고정, 최소 너비 지정하여 마스크에 잘리지 않게 방어)
                if (tmpVol != null || legVol != null)
                {
                    if (tmpVol != null) 
                    {
                        tmpVol.text = volStr;
                        tmpVol.enableWordWrapping = false;
                        tmpVol.alignment = TMPro.TextAlignmentOptions.Right;
                        var leVol = tmpVol.gameObject.GetComponent<UnityEngine.UI.LayoutElement>();
                        if (leVol == null) leVol = tmpVol.gameObject.AddComponent<UnityEngine.UI.LayoutElement>();
                        leVol.minWidth = 50f;
                        leVol.preferredWidth = 50f;
                        leVol.flexibleWidth = 1f; // 남는 공간 흡수하여 우측으로 쫙 밀어냄
                    }
                    if (legVol != null) 
                    {
                        legVol.text = volStr;
                        legVol.horizontalOverflow = UnityEngine.HorizontalWrapMode.Overflow;
                        legVol.alignment = UnityEngine.TextAnchor.MiddleRight;
                        var leVol = legVol.gameObject.GetComponent<UnityEngine.UI.LayoutElement>();
                        if (leVol == null) leVol = legVol.gameObject.AddComponent<UnityEngine.UI.LayoutElement>();
                        leVol.minWidth = 50f;
                        leVol.preferredWidth = 50f;
                        leVol.flexibleWidth = 1f;
                    }
                }

                // 배경(캡슐) 찾기 및 색상/크기 조절
                Image priceBg = null;
                foreach (var img in rowGo.GetComponentsInChildren<Image>(true))
                {
                    if (img.name.Contains("PriceBackground") || img.name.Contains("bgColor") || img.name.Contains("BG")) 
                    {
                        priceBg = img;
                        break;
                    }
                }
                if (priceBg == null) priceBg = rowGo.GetComponent<Image>(); // 폴백

                if (priceBg != null)
                {
                    if (i < 3) priceBg.color = new Color(1f, 0.6f, 0.6f, 1f); // 매도
                    else if (i > 3) priceBg.color = new Color(0.6f, 0.8f, 1f, 1f); // 매수
                    else priceBg.color = new Color(0.9f, 0.9f, 0.9f, 1f); // 선택가격

                    var leBg = priceBg.gameObject.GetComponent<UnityEngine.UI.LayoutElement>();
                    if (leBg == null) leBg = priceBg.gameObject.AddComponent<UnityEngine.UI.LayoutElement>();
                    leBg.flexibleWidth = 0f;
                    
                    if (i == 3) leBg.preferredWidth = 155f; // 기준가는 최대 너비 (215 - 60)
                    else leBg.preferredWidth = 65f + (90f * (float)(vol / 15.0)); // 수량에 따라 캡슐 길이 조절 (65~155)
                }

                // 4. 미니 호가 행 클릭 시 거래 예정 가격이 해당 가격으로 자동 갱신되는 편리함 추가!
                Button rowBtn = rowGo.GetComponent<Button>();
                if (rowBtn == null) rowBtn = rowGo.AddComponent<Button>();
                
                rowBtn.transition = Selectable.Transition.None;
                rowBtn.onClick.RemoveAllListeners();
                rowBtn.onClick.AddListener(() =>
                {
                    _tradePrice = price;
                    UpdateUI();
                });
            }
        }
    }
}
