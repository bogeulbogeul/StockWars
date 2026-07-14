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
        [SerializeField] private Image _logoImage;                    // 회사 로고 이미지
        [SerializeField] private Image _changeRateBgImage;             // 등락률 배경 캡슐 이미지 (색상 변경용)
        [SerializeField] private UIStockChart _miniChart;

        [Header("Sector Background Customization")]
        [SerializeField] private List<Image> _sectorBackgroundImages = new List<Image>();

        [Header("Buy / Sell / Info Tabs")]
        [SerializeField] private Button _buyTabButton;
        [SerializeField] private Button _sellTabButton;
        [SerializeField] private Button _infoTabButton;
        [SerializeField] private Color _buyActiveTabColor = new Color(0.6f, 0.9f, 0.6f, 1f); // 파스텔 그린
        [SerializeField] private Color _sellActiveTabColor = new Color(0.6f, 0.8f, 0.9f, 1f); // 파스텔 블루
        [SerializeField] private Color _inactiveTabColor = new Color(0.9f, 0.9f, 0.9f, 0.6f);

        [Header("Tab ON/OFF Objects")]
        [SerializeField] private GameObject _buyTabOn;
        [SerializeField] private GameObject _buyTabOff;
        [SerializeField] private GameObject _sellTabOn;
        [SerializeField] private GameObject _sellTabOff;
        [SerializeField] private GameObject _infoTabOn;
        [SerializeField] private GameObject _infoTabOff;

        [Header("Trading & Info Sub Panels")]
        [SerializeField] private GameObject _tradingPanel;
        [SerializeField] private GameObject _infoPanel;

        [Header("Quantity & Price Selector")]
        [SerializeField] private TMP_InputField _qtyText;
        [SerializeField] private Button _minusQtyButton;
        [SerializeField] private Button _plusQtyButton;
        [Tooltip("1주당 가격을 표시할 TextMeshPro 텍스트")]
        [SerializeField] private TMP_Text _pricePerShareText;

        [Header("Percentage Buttons")]
        [SerializeField] private Button _percent10Button;
        [SerializeField] private Button _percent25Button;
        [SerializeField] private Button _percent50Button;
        [SerializeField] private Button _percent100Button;

        [Header("Dynamic Action Labels")]
        [SerializeField] private TMP_Text _actionTitleText; // "구매 수량" 또는 "판매 수량"으로 자동 변경될 텍스트

        [Header("Transaction Details")]
        [SerializeField] private TMP_Text _totalValueText;

        [Header("Execute Button")]
        [SerializeField] private Button _executeButton;
        [SerializeField] private TMP_Text _executeButtonText;
        [SerializeField] private Color _buyButtonColor = new Color(0.96f, 0.35f, 0.35f, 1f); // 매수 빨강
        [SerializeField] private Color _sellButtonColor = new Color(0.23f, 0.58f, 0.94f, 1f); // 매도 파랑

        [Header("Mini Order Book (5 Levels)")]
        [SerializeField] private Transform _miniOrderBookContainer;
        [SerializeField] private GameObject _miniRowPrefab;

        // 거래 상태 관리 변수
        private string _targetStockId;
        private bool _isBuy = true;
        private bool _isInfoActive = false;
        private int _qty = 1;
        private long _tradePrice;
        private List<GameObject> _instantiatedMiniRows = new List<GameObject>();

        [Header("Realtime Update Settings")]
        [SerializeField] private float _updateInterval = 1f;
        private float _timeSinceLastUpdate = 0f;

        private void Update()
        {
            if (string.IsNullOrEmpty(_targetStockId)) return;

            _timeSinceLastUpdate += Time.deltaTime;
            if (_timeSinceLastUpdate >= _updateInterval)
            {
                _timeSinceLastUpdate = 0f;
                UpdateUI();
            }
        }

        private void RegisterTabButtonListener(Button btn, UnityEngine.Events.UnityAction action)
        {
            if (btn == null) return;
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(action);
        }

        private void RegisterTabButtonListener(GameObject go, UnityEngine.Events.UnityAction action)
        {
            if (go == null) return;
            Button btn = go.GetComponent<Button>();
            if (btn != null)
            {
                btn.onClick.RemoveAllListeners();
                btn.onClick.AddListener(action);
            }
        }

        private void Start()
        {
            // +/- 버튼 및 탭 리스너 등록
            if (_minusQtyButton != null) _minusQtyButton.onClick.AddListener(OnMinusQtyClicked);
            if (_plusQtyButton != null) _plusQtyButton.onClick.AddListener(OnPlusQtyClicked);
            
            RegisterTabButtonListener(_buyTabButton, () => SetTab(true));
            RegisterTabButtonListener(_buyTabOn, () => SetTab(true));
            RegisterTabButtonListener(_buyTabOff, () => SetTab(true));

            RegisterTabButtonListener(_sellTabButton, () => SetTab(false));
            RegisterTabButtonListener(_sellTabOn, () => SetTab(false));
            RegisterTabButtonListener(_sellTabOff, () => SetTab(false));

            RegisterTabButtonListener(_infoTabButton, OnInfoClicked);
            RegisterTabButtonListener(_infoTabOn, OnInfoClicked);
            RegisterTabButtonListener(_infoTabOff, OnInfoClicked);

            if (_percent10Button != null) _percent10Button.onClick.AddListener(() => OnPercentClicked(0.10f));
            if (_percent25Button != null) _percent25Button.onClick.AddListener(() => OnPercentClicked(0.25f));
            if (_percent50Button != null) _percent50Button.onClick.AddListener(() => OnPercentClicked(0.50f));
            if (_percent100Button != null) _percent100Button.onClick.AddListener(() => OnPercentClicked(1.00f));

            if (_executeButton != null) _executeButton.onClick.AddListener(OnExecuteClicked);

            if (_qtyText != null)
            {
                _qtyText.onValueChanged.AddListener(OnQtyInputChanged);
            }
        }

        /// <summary>
        /// 상세 거래 화면을 지정된 가격 및 주문 유형(매수/매도)으로 초기 바인딩합니다.
        /// </summary>
        public void Initialize(string stockId, bool isBuy, long initialPrice)
        {
            _targetStockId = stockId;
            _isBuy = isBuy;
            _isInfoActive = false;
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

            Color flucColor = delta > 0 ? new Color(0.27f, 0.83f, 0.45f, 1f) : // #46D473 (초록)
                             (delta < 0 ? new Color(1f, 0.37f, 0.38f, 1f) : new Color(0.5f, 0.5f, 0.5f, 1f));

            if (_changeRateText != null)
            {
                string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
                string sign = delta > 0 ? "+" : "";
                _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";

                if (_changeRateBgImage != null)
                {
                    _changeRateBgImage.color = flucColor;
                    _changeRateText.color = Color.white; // 캡슐 배경이 칠해진 경우 흰색 텍스트로 고대비 가독성 확보
                }
                else
                {
                    _changeRateText.color = flucColor;
                }
            }

            // 로고 이미지 동적 로드
            if (_logoImage != null)
            {
                Sprite logoSprite = Resources.Load<Sprite>($"Sprites/Logos/{stock.StockId}");
                if (logoSprite != null)
                {
                    _logoImage.sprite = logoSprite;
                    _logoImage.color = Color.white;
                }
                else
                {
                    _logoImage.color = new Color(1f, 1f, 1f, 0.2f); // 기본 실루엣 폴백
                }
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

            // 1.6. 통합 라인/영역 차트 렌더링
            if (_miniChart != null)
            {
                // 차트 색상은 등락률에 따라 하늘색(상승) / 빨간색(하락) / 회색(보합)으로 설정
                Color chartColor = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                                   (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));
                
                Color topGrad = chartColor;
                topGrad.a = 0.35f;
                Color bottomGrad = chartColor;
                bottomGrad.a = 0f;

                _miniChart.SetColor(chartColor, topGrad, bottomGrad);
                _miniChart.DrawChart(_targetStockId, stock.PriceHistory.ToList());
            }

            // 2. 수량 및 텍스트 갱신
            if (_qtyText != null && _qtyText.text != _qty.ToString()) _qtyText.text = _qty.ToString();
            if (_pricePerShareText != null) _pricePerShareText.text = $"1주 금액: {_tradePrice:N0} G";

            // 3. 지갑 잔고 및 보유 정보 가져오기
            long cash = WalletManager.Instance.GetCash();

            int ownedQty = 0;
            var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
            if (portfolio != null && portfolio.TryGetValue(_targetStockId.ToUpper(), out var holding))
            {
                ownedQty = holding.Quantity;
            }

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

            // 한도 초과 검사 (매수 시 보유 현금 초과, 매도 시 보유 수량 초과)
            bool isValid = true;
            if (_isBuy)
            {
                isValid = totalValue <= cash;
            }
            else
            {
                isValid = _qty <= ownedQty;
            }

            if (_totalValueText != null)
            {
                _totalValueText.text = $"총 금액: {totalValue:N0} G";
                _totalValueText.color = isValid ? new Color(0.15f, 0.15f, 0.15f, 1f) : new Color(0.9f, 0.25f, 0.25f, 1f);
            }

            // 5. 탭 시각적 상태 갱신 (책갈피 효과를 위해 활성화된 탭은 색상 변경 및 가장 앞으로 렌더링)
            bool isBuyActive = _isBuy && !_isInfoActive;
            bool isSellActive = !_isBuy && !_isInfoActive;
            bool isInfoActive = _isInfoActive;

            if (_buyTabButton != null)
            {
                var image = _buyTabButton.GetComponent<Image>();
                if (image != null) image.color = isBuyActive ? _buyActiveTabColor : _inactiveTabColor;
                if (isBuyActive) _buyTabButton.transform.SetAsLastSibling();
            }
            if (_sellTabButton != null)
            {
                var image = _sellTabButton.GetComponent<Image>();
                if (image != null) image.color = isSellActive ? _sellActiveTabColor : _inactiveTabColor;
                if (isSellActive) _sellTabButton.transform.SetAsLastSibling();
            }
            if (_infoTabButton != null)
            {
                var image = _infoTabButton.GetComponent<Image>();
                if (image != null) image.color = isInfoActive ? _buyActiveTabColor : _inactiveTabColor;
                if (isInfoActive) _infoTabButton.transform.SetAsLastSibling();
            }

            // ON/OFF 오브젝트 활성화 상태 제어
            if (_buyTabOn != null) _buyTabOn.SetActive(isBuyActive);
            if (_buyTabOff != null) _buyTabOff.SetActive(!isBuyActive);

            if (_sellTabOn != null) _sellTabOn.SetActive(isSellActive);
            if (_sellTabOff != null) _sellTabOff.SetActive(!isSellActive);

            if (_infoTabOn != null) _infoTabOn.SetActive(isInfoActive);
            if (_infoTabOff != null) _infoTabOff.SetActive(!isInfoActive);

            // TradingPanel 및 InfoPanel 활성화 상태 제어
            if (_tradingPanel != null) _tradingPanel.SetActive(!isInfoActive);
            if (_infoPanel != null) _infoPanel.SetActive(isInfoActive);

            // 5.5. 라벨 및 텍스트 동적 변경 (구매 수량 / 판매 수량)
            if (_actionTitleText != null)
            {
                _actionTitleText.text = _isBuy ? "구매 수량" : "판매 수량";
            }

            // 6. 하단 최종 주문 버튼 비주얼 설정 (한도 초과 시 비활성화 및 회색 버튼 변경)
            if (_executeButton != null)
            {
                _executeButton.interactable = isValid;
                Transform bgColorTrans = _executeButton.transform.Find("bgColor");
                Image image = bgColorTrans != null ? bgColorTrans.GetComponent<Image>() : _executeButton.GetComponent<Image>();
                if (image != null)
                {
                    image.color = isValid ? (_isBuy ? _buyButtonColor : _sellButtonColor) : new Color(0.75f, 0.75f, 0.75f, 1f);
                }
            }

            if (_executeButtonText != null)
            {
                _executeButtonText.text = _isBuy ? "매수" : "매도";
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
            _isInfoActive = false; // 매수/매도 탭 선택 시 정보 탭 비활성화
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

        private void OnQtyInputChanged(string text)
        {
            if (int.TryParse(text, out int val))
            {
                _qty = Mathf.Max(1, val);
            }
            else
            {
                _qty = 1;
            }

            if (_qtyText != null && _qtyText.text != _qty.ToString())
            {
                _qtyText.text = _qty.ToString();
            }

            UpdateTotalValueOnly();
        }

        private void UpdateTotalValueOnly()
        {
            if (MarketManager.Instance == null || WalletManager.Instance == null) return;

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

            long cash = WalletManager.Instance.GetCash();
            int ownedQty = 0;
            var portfolio = WalletManager.Instance.ActiveSaveData?.Portfolio;
            if (portfolio != null && portfolio.TryGetValue(_targetStockId.ToUpper(), out var holding))
            {
                ownedQty = holding.Quantity;
            }

            bool isValid = true;
            if (_isBuy)
            {
                isValid = totalValue <= cash;
            }
            else
            {
                isValid = _qty <= ownedQty;
            }

            if (_totalValueText != null)
            {
                _totalValueText.color = isValid ? new Color(0.15f, 0.15f, 0.15f, 1f) : new Color(0.9f, 0.25f, 0.25f, 1f);
            }

            if (_executeButton != null)
            {
                _executeButton.interactable = isValid;
                Transform bgColorTrans = _executeButton.transform.Find("bgColor");
                Image image = bgColorTrans != null ? bgColorTrans.GetComponent<Image>() : _executeButton.GetComponent<Image>();
                if (image != null)
                {
                    image.color = isValid ? (_isBuy ? _buyButtonColor : _sellButtonColor) : new Color(0.75f, 0.75f, 0.75f, 1f);
                }
            }
        }

        private void OnInfoClicked()
        {
            _isInfoActive = true;
            UpdateUI();

            // 정보 탭도 클릭 시 화면 맨 앞으로 튀어나오게 (책갈피 선 덮기 효과)
            if (_infoTabButton != null) _infoTabButton.transform.SetAsLastSibling();

            // 정보 탭이나 정보 버튼을 눌렀을 때의 동작 (추후 컨트롤러와 연동)
            Debug.Log($"[UITradePage] {_targetStockId} 정보(Info) 보기 요청됨!");
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

            // 실시간 현재가(stock.CurrentPrice)를 기준으로 7단계 가격 계산 (+3틱 ~ -3틱)
            double stepPercent = 0.002; // 0.2% 간격
            long basePrice = stock.CurrentPrice;
            long tickSize = Math.Max(1, (long)Math.Round(basePrice * stepPercent));

            long[] prices = new long[7];
            prices[0] = basePrice + tickSize * 3; // 매도3
            prices[1] = basePrice + tickSize * 2; // 매도2
            prices[2] = basePrice + tickSize * 1; // 매도1
            prices[3] = basePrice;                // 기준가 (선택된 가격)
            prices[4] = basePrice - tickSize * 1; // 매수1
            prices[5] = basePrice - tickSize * 2; // 매수2
            prices[6] = basePrice - tickSize * 3; // 매수3

            // 실시간 변동을 시각화하기 위해 시간(TickCount)을 시드에 혼합
            int stockSeed = stock.Data.stockId.GetHashCode() ^ System.Environment.TickCount;
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
                int qty = (i == 3) ? 0 : rand.Next(50, 15000);
                double vol = qty / 1000.0;
                string volStr;
                if (qty <= 0)
                {
                    volStr = "-";
                }
                else if (qty >= 1000000)
                {
                    volStr = $"{qty / 1000000f:F1}M";
                }
                else if (qty >= 1000)
                {
                    volStr = $"{qty / 1000f:F1}k";
                }
                else
                {
                    volStr = qty.ToString();
                }

                // 1. 가격 텍스트를 바(PriceBackground)의 자식에서 꺼내어 행(MiniOrderRow)의 직속 자식으로 설정
                // 이렇게 해야 바가 움직여도 가격 글씨가 흔들리거나 같이 움직이지 않습니다.
                if (tmpPrice != null) tmpPrice.transform.SetParent(rowGo.transform);
                if (legPrice != null) legPrice.transform.SetParent(rowGo.transform);

                // 레이아웃 자동 정렬 해제 (직접 절대 위치 지정을 위해)
                UnityEngine.UI.HorizontalLayoutGroup hlg = rowGo.GetComponent<HorizontalLayoutGroup>();
                if (hlg != null) hlg.enabled = false;

                // 가격 텍스트 배치 (매수 레이블의 왼쪽 끝에 맞추어 좌측 정렬 배치)
                if (tmpPrice != null) 
                {
                    tmpPrice.alignment = TMPro.TextAlignmentOptions.Left;
                    tmpPrice.margin = new Vector4(0, 0, 0, 0);
                    
                    RectTransform priceRt = tmpPrice.rectTransform;
                    if (priceRt != null)
                    {
                        priceRt.anchorMin = new Vector2(0f, 0.5f);
                        priceRt.anchorMax = new Vector2(0f, 0.5f); // 좌측 끝 기준
                        priceRt.pivot = new Vector2(0f, 0.5f); // 좌측 피벗
                        priceRt.anchoredPosition = new Vector2(15f, 0f); // 좌측 끝에서 15px 오른쪽 시작 (매수 탭 왼쪽 라인과 정렬)
                        priceRt.sizeDelta = new Vector2(80f, 30f);
                    }
                }
                if (legPrice != null)
                {
                    legPrice.alignment = TextAnchor.MiddleLeft;
                    
                    RectTransform priceRt = legPrice.GetComponent<RectTransform>();
                    if (priceRt != null)
                    {
                        priceRt.anchorMin = new Vector2(0f, 0.5f);
                        priceRt.anchorMax = new Vector2(0f, 0.5f);
                        priceRt.pivot = new Vector2(0f, 0.5f);
                        priceRt.anchoredPosition = new Vector2(15f, 0f);
                        priceRt.sizeDelta = new Vector2(80f, 30f);
                    }
                }

                // 수량 텍스트 활성화 및 우측 끝 고정 배치 (잔량 숫자 연동)
                if (tmpVol != null) 
                {
                    tmpVol.gameObject.SetActive(true);
                    tmpVol.text = volStr;
                    tmpVol.alignment = TMPro.TextAlignmentOptions.Right;
                    tmpVol.margin = new Vector4(0, 0, 0, 0);

                    tmpVol.transform.SetParent(rowGo.transform);
                    RectTransform volRt = tmpVol.rectTransform;
                    if (volRt != null)
                    {
                        volRt.anchorMin = new Vector2(1f, 0.5f);
                        volRt.anchorMax = new Vector2(1f, 0.5f);
                        volRt.pivot = new Vector2(1f, 0.5f);
                        volRt.anchoredPosition = new Vector2(-5f, 0f); // 우측 끝에서 5px 고정 (충분한 공간 확보)
                        volRt.sizeDelta = new Vector2(80f, 30f); // 60f -> 80f로 확장하여 글자 잘림 방지
                    }
                }
                if (legVol != null)
                {
                    legVol.gameObject.SetActive(true);
                    legVol.text = volStr;
                    legVol.alignment = TextAnchor.MiddleRight;

                    legVol.transform.SetParent(rowGo.transform);
                    RectTransform volRt = legVol.GetComponent<RectTransform>();
                    if (volRt != null)
                    {
                        volRt.anchorMin = new Vector2(1f, 0.5f);
                        volRt.anchorMax = new Vector2(1f, 0.5f);
                        volRt.pivot = new Vector2(1f, 0.5f);
                        volRt.anchoredPosition = new Vector2(-5f, 0f);
                        volRt.sizeDelta = new Vector2(80f, 30f);
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

                    // 수량 바 배치 (좌측 가격 글자 바로 우측에서 시작하여 늘어나도록 설정)
                    RectTransform bgRt = priceBg.rectTransform;
                    if (bgRt != null)
                    {
                        bgRt.anchorMin = new Vector2(0.35f, 0.5f); // 가격 글자(0~35%) 바로 다음 시작
                        bgRt.anchorMax = new Vector2(0.35f, 0.5f);
                        bgRt.pivot = new Vector2(0f, 0.5f); // 좌측 피벗 (오른쪽으로 늘어남)
                        bgRt.anchoredPosition = new Vector2(5f, 0f); // 약간의 마진만 두고 시작
                        
                        float targetWidth;
                        if (i == 3) targetWidth = 100f; // 기준가는 고정 너비
                        else targetWidth = 30f + (70f * (float)(vol / 15.0)); // 30~100px 범위
                        
                        bgRt.sizeDelta = new Vector2(targetWidth, 20f); // 바 높이 20px로 고정
                    }
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
