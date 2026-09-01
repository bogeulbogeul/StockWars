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
        [SerializeField] private Color _activeTabColor = new Color(0.77f, 0.64f, 0.51f, 1f); // ON 색상 (탠 브라운)
        [SerializeField] private Color _inactiveTabColor = new Color(0.90f, 0.85f, 0.76f, 1f); // OFF 색상 (샌드 베이지)

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
        [SerializeField] private TMP_InputField _priceInputField;
        [SerializeField] private Button _minusPriceButton;
        [SerializeField] private Button _plusPriceButton;

        [Header("Percentage Buttons")]
        [SerializeField] private Button _percent10Button;
        [SerializeField] private Button _percent25Button;
        [SerializeField] private Button _percent50Button;
        [SerializeField] private Button _percent100Button;

        [Header("Dynamic Action Labels")]
        [SerializeField] private TMP_Text _actionTitleText; // "구매 수량" 또는 "판매 수량"으로 자동 변경될 텍스트

        [Header("Transaction Details")]
        [SerializeField] private TMP_Text _totalQtyText;
        [SerializeField] private TMP_Text _totalValueText;

        [Header("Execute Button")]
        [SerializeField] private Button _executeButton;
        [SerializeField] private TMP_Text _executeButtonText;

        [Header("Confirm Popup Bindings")]
        [SerializeField] private GameObject _confirmPopup;
        [SerializeField] private TMP_Text _confirmMessageText;
        [SerializeField] private Button _confirmYesButton;
        [SerializeField] private Button _confirmNoButton;

        [Header("Receipt Popup Bindings")]
        [SerializeField] private GameObject _receiptPopup;
        [SerializeField] private TMP_Text _receiptTitleText;
        [SerializeField] private TMP_Text _receiptStockNameText;
        [SerializeField] private TMP_Text _receiptUnitPriceText;
        [SerializeField] private TMP_Text _receiptQuantityText;
        [SerializeField] private TMP_Text _receiptTaxText;
        [SerializeField] private TMP_Text _receiptTotalPriceText;
        [SerializeField] private Button _receiptOkButton;

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

            // Price 상자 자동 탐색 (인스펙터 미할당 시 자식 Price 오브젝트 자동 바인딩)
            if (_priceInputField == null || _minusPriceButton == null || _plusPriceButton == null)
            {
                Transform priceTrans = transform.Find("TradingPanel/Price");
                if (priceTrans == null) priceTrans = transform.Find("Price");
                if (priceTrans == null && _tradingPanel != null) priceTrans = _tradingPanel.transform.Find("Price");
                if (priceTrans != null)
                {
                    if (_priceInputField == null) _priceInputField = priceTrans.GetComponentInChildren<TMP_InputField>(true);
                    var btns = priceTrans.GetComponentsInChildren<Button>(true);
                    foreach (var b in btns)
                    {
                        if ((b.name == "-" || b.name.IndexOf("Minus", StringComparison.OrdinalIgnoreCase) >= 0) && _minusPriceButton == null) _minusPriceButton = b;
                        else if ((b.name == "+" || b.name.IndexOf("Plus", StringComparison.OrdinalIgnoreCase) >= 0) && _plusPriceButton == null) _plusPriceButton = b;
                    }
                }
            }

            if (_minusPriceButton != null) _minusPriceButton.onClick.AddListener(OnMinusPriceClicked);
            if (_plusPriceButton != null) _plusPriceButton.onClick.AddListener(OnPlusPriceClicked);
            if (_priceInputField != null) _priceInputField.onValueChanged.AddListener(OnPriceInputChanged);
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

            // 4. 수량과 호가 가격에 따른 총 예상 거래액 갱신 (순수 거래금액: 수량 x 단가)
            long rawTotal = _qty * _tradePrice;

            // 한도 초과 검사 (매수 시 보유 현금 초과, 매도 시 보유 수량 초과)
            bool isValid = true;
            if (_isBuy)
            {
                isValid = rawTotal <= cash;
            }
            else
            {
                isValid = _qty <= ownedQty;
            }

            if (_totalQtyText != null)
            {
                _totalQtyText.text = $"({(_isBuy ? "구매 개수" : "판매 개수")}: {_qty:N0}개)";
            }

            if (_totalValueText != null)
            {
                _totalValueText.text = $"총 금액: {rawTotal:N0} G";
                _totalValueText.color = isValid ? new Color(0.15f, 0.15f, 0.15f, 1f) : new Color(0.9f, 0.25f, 0.25f, 1f);
            }

            // 5. 탭 시각적 상태 갱신 (책갈피 효과를 위해 활성화된 탭은 색상 변경 및 가장 앞으로 렌더링)
            bool isBuyActive = _isBuy && !_isInfoActive;
            bool isSellActive = !_isBuy && !_isInfoActive;
            bool isInfoActive = _isInfoActive;

            if (_buyTabButton != null)
            {
                var image = _buyTabButton.GetComponent<Image>();
                if (image != null) image.color = isBuyActive ? _activeTabColor : _inactiveTabColor;
                if (isBuyActive) _buyTabButton.transform.SetAsLastSibling();
            }
            if (_sellTabButton != null)
            {
                var image = _sellTabButton.GetComponent<Image>();
                if (image != null) image.color = isSellActive ? _activeTabColor : _inactiveTabColor;
                if (isSellActive) _sellTabButton.transform.SetAsLastSibling();
            }
            if (_infoTabButton != null)
            {
                var image = _infoTabButton.GetComponent<Image>();
                if (image != null) image.color = isInfoActive ? _activeTabColor : _inactiveTabColor;
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
            if (_infoPanel != null)
            {
                _infoPanel.SetActive(isInfoActive);
                if (isInfoActive) UpdateInfoPanel(stock);
            }

            // 5.5. 라벨 및 텍스트 동적 변경 (구매 개수 / 판매 개수)
            if (_actionTitleText != null)
            {
                _actionTitleText.text = _isBuy ? "구매 개수" : "판매 개수";
            }

            // 6. 하단 최종 주문 버튼 비주얼 설정 (버튼 기본 색상 유지, 글자만 매수/매도 변경)
            if (_executeButton != null)
            {
                _executeButton.interactable = isValid;
            }

            if (_executeButtonText != null)
            {
                _executeButtonText.text = _isBuy ? "매수하기" : "매도하기";
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

        private void OnMinusPriceClicked()
        {
            double stepPercent = 0.002;
            long tick = Math.Max(1, (long)Math.Round(_tradePrice * stepPercent));
            _tradePrice = Math.Max(1, _tradePrice - tick);
            if (_priceInputField != null && _priceInputField.text != _tradePrice.ToString())
            {
                _priceInputField.text = _tradePrice.ToString();
            }
            UpdateTotalValueOnly();
        }

        private void OnPlusPriceClicked()
        {
            double stepPercent = 0.002;
            long tick = Math.Max(1, (long)Math.Round(_tradePrice * stepPercent));
            _tradePrice += tick;
            if (_priceInputField != null && _priceInputField.text != _tradePrice.ToString())
            {
                _priceInputField.text = _tradePrice.ToString();
            }
            UpdateTotalValueOnly();
        }

        private void OnPriceInputChanged(string text)
        {
            if (long.TryParse(text, out long val))
            {
                _tradePrice = Math.Max(1, val);
            }
            UpdateTotalValueOnly();
        }

        /// <summary>
        /// 정보 탭 활성화 시 전담 독립 스크립트 UIStockInfoPanel로 업데이트를 위임합니다.
        /// </summary>
        private void UpdateInfoPanel(StockInstance stock)
        {
            if (_infoPanel == null || stock == null) return;

            UIStockInfoPanel infoScript = _infoPanel.GetComponent<UIStockInfoPanel>();
            if (infoScript == null) infoScript = _infoPanel.AddComponent<UIStockInfoPanel>();

            infoScript.SetStock(stock);
        }

        private void UpdateTotalValueOnly()
        {
            if (MarketManager.Instance == null || WalletManager.Instance == null) return;

            long rawTotal = _qty * _tradePrice;

            if (_priceInputField != null && _priceInputField.text != _tradePrice.ToString() && !_priceInputField.isFocused)
            {
                _priceInputField.text = _tradePrice.ToString();
            }
            if (_pricePerShareText != null)
            {
                _pricePerShareText.text = $"{_tradePrice:N0} G";
            }

            if (_totalQtyText != null)
            {
                _totalQtyText.text = $"({(_isBuy ? "구매 개수" : "판매 개수")}: {_qty:N0}개)";
            }

            if (_totalValueText != null)
            {
                _totalValueText.text = $"총 금액: {rawTotal:N0} G";
            }

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
                isValid = rawTotal <= cash;
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
                int maxBuyQty = (int)Math.Floor((double)availableCash / _tradePrice);

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

        private void OnEnable()
        {
            if (StockWars.Network.StockWarsNetworkClient.Instance != null)
            {
                StockWars.Network.StockWarsNetworkClient.Instance.OnOrderResultReceived += OnServerOrderResultReceived;
            }
        }

        private void OnDisable()
        {
            if (StockWars.Network.StockWarsNetworkClient.Instance != null)
            {
                StockWars.Network.StockWarsNetworkClient.Instance.OnOrderResultReceived -= OnServerOrderResultReceived;
            }
        }

        /// <summary>
        /// C++ 서버에서 매수/매도 체결 결과 수신 시 호출되는 이벤트 핸들러
        /// </summary>
        private void OnServerOrderResultReceived(StockWars.Network.OrderResultData result)
        {
            if (result == null || WalletManager.Instance == null) return;

            if (result.Success)
            {
                bool isBuy = result.OrderType == "BuyOrder";
                if (isBuy)
                {
                    WalletManager.Instance.SpendCash(result.TotalCost);
                    WalletManager.Instance.AddStockHolding(result.StockCode, result.Quantity, result.Price);
                }
                else
                {
                    WalletManager.Instance.RemoveStockHolding(result.StockCode, result.Quantity);
                    WalletManager.Instance.AddCash(result.TotalCost);
                }

                Debug.Log($"<color=#00FF7F><b>[UITradePage C++ 체결 반영 성공]:</b></color> {result.Message}");

                StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
                if (controller != null) controller.RefreshAppUI();

                UpdateUI();
            }
            else
            {
                Debug.LogWarning($"[UITradePage C++ 체결 실패]: {result.Message}");
            }
        }

        private void OnExecuteClicked()
        {
            if (WalletManager.Instance == null || MarketManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(_targetStockId);
            if (stock == null) return;

            // C++ 서버가 연결되어 있다면 C++ 서버로 실시간 매수/매도 주문 패킷 전송!
            if (StockWars.Network.StockWarsNetworkClient.Instance != null && StockWars.Network.StockWarsNetworkClient.Instance.IsConnected)
            {
                _ = StockWars.Network.StockWarsNetworkClient.Instance.SendOrderRequestAsync(_isBuy, _targetStockId, _qty, _tradePrice);
                return;
            }

            // 사전 검증 (예수금 / 보유량 확인)
            double baseFeeRate = 0.0015;
            double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
            double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);
            long subtotal = _qty * _tradePrice;
            long fee = (long)Math.Round(subtotal * finalFeeRate);

            if (_isBuy)
            {
                long availableCash = WalletManager.Instance.GetCash();
                long totalCost = subtotal + fee;
                if (availableCash < totalCost)
                {
                    Debug.LogWarning($"[UITradePage] 매수 실패: 예수금이 부족합니다. 필요={totalCost}G, 보유={availableCash}G");
                    return;
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
            }

            // 1단계: 주문 체결 확인 팝업(ShowConfirmPopup) 먼저 호출!
            ShowConfirmPopup(stock);
        }

        /// <summary>
        /// 매수/매도 체결 전 사용자 확인 팝업(Popup_TradeConfirm)을 표시합니다.
        /// </summary>
        private void ShowConfirmPopup(StockInstance stock)
        {
            if (_confirmPopup == null)
            {
                var found = transform.parent != null ? transform.parent.GetComponentsInChildren<Transform>(true) : GetComponentsInChildren<Transform>(true);
                foreach (var t in found)
                {
                    if (t.name.IndexOf("Popup_TradeConfirm", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        t.name.IndexOf("Popup_Confirm", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        t.name.IndexOf("ConfirmPopup", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        _confirmPopup = t.gameObject;
                        break;
                    }
                }
            }

            // 만약 확인 팝업이 하이라키에 배치되어 있지 않다면 폴백으로 즉시 체결 진행
            if (_confirmPopup == null)
            {
                ExecuteTradeActual(stock);
                return;
            }

            TMP_Text msg = _confirmMessageText;
            Button yesBtn = _confirmYesButton, noBtn = _confirmNoButton;

            if (msg == null)
            {
                var texts = _confirmPopup.GetComponentsInChildren<TMP_Text>(true);
                foreach (var txt in texts)
                {
                    if (txt.name.IndexOf("ConfirmText", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        txt.name.IndexOf("Message", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        msg = txt;
                        break;
                    }
                }
                if (msg == null && texts.Length > 0) msg = texts[0];
            }

            if (yesBtn == null || noBtn == null)
            {
                var btns = _confirmPopup.GetComponentsInChildren<Button>(true);
                foreach (var btn in btns)
                {
                    string n = btn.name;
                    if (yesBtn == null && (n.IndexOf("Yes", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Confirm", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("OK", StringComparison.OrdinalIgnoreCase) >= 0)) yesBtn = btn;
                    else if (noBtn == null && (n.IndexOf("No", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Cancel", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Close", StringComparison.OrdinalIgnoreCase) >= 0)) noBtn = btn;
                }

                if (yesBtn == null && btns.Length >= 1) yesBtn = btns[0];
                if (noBtn == null && btns.Length >= 2) noBtn = btns[1];
            }

            long subtotal = _qty * _tradePrice;
            string actionText = _isBuy ? "매수" : "매도";

            // 확인 팝업 내 텍스트들을 탐색하여 매수하시겠습니까? / 매도하시겠습니까? 동적 전환
            var allTmpTexts = _confirmPopup.GetComponentsInChildren<TMP_Text>(true);
            foreach (var txt in allTmpTexts)
            {
                // 확인 / 취소 버튼 글씨는 변경 제외
                if (txt.transform.parent != null && txt.transform.parent.GetComponent<Button>() != null) continue;

                string n = txt.name;
                if (n.IndexOf("ConfirmText", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    n.IndexOf("Title", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    txt.text.Contains("하시겠습니까"))
                {
                    txt.text = $"{actionText}하시겠습니까?";
                }
                else if (n.IndexOf("Detail", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("Desc", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("Sub", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"[{stock.Data.name}] {_qty:N0}주 (총 {subtotal:N0} G)";
                }
            }

            var allLegTexts = _confirmPopup.GetComponentsInChildren<UnityEngine.UI.Text>(true);
            foreach (var txt in allLegTexts)
            {
                if (txt.transform.parent != null && txt.transform.parent.GetComponent<Button>() != null) continue;

                string n = txt.name;
                if (n.IndexOf("ConfirmText", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    n.IndexOf("Title", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    txt.text.Contains("하시겠습니까"))
                {
                    txt.text = $"{actionText}하시겠습니까?";
                }
            }

            if (noBtn != null)
            {
                noBtn.onClick.RemoveAllListeners();
                noBtn.onClick.AddListener(() =>
                {
                    _confirmPopup.SetActive(false);
                });
            }

            if (yesBtn != null)
            {
                yesBtn.onClick.RemoveAllListeners();
                yesBtn.onClick.AddListener(() =>
                {
                    _confirmPopup.SetActive(false);
                    ExecuteTradeActual(stock);
                });
            }

            _confirmPopup.SetActive(true);
            _confirmPopup.transform.SetAsLastSibling();
        }

        /// <summary>
        /// 확인 팝업 승인 후 실제 체결 로직을 수행하고 영수증 팝업(ShowReceiptPopup)을 띄웁니다.
        /// </summary>
        private void ExecuteTradeActual(StockInstance stock)
        {
            double baseFeeRate = 0.0015;
            double feeDiscount = StatCore.Instance != null ? StatCore.Instance.GetTradingFeeDiscount() : 0.0;
            double finalFeeRate = Math.Max(0.0, baseFeeRate - feeDiscount);

            if (_isBuy)
            {
                long availableCash = WalletManager.Instance.GetCash();
                long subtotal = _qty * _tradePrice;
                long fee = (long)Math.Round(subtotal * finalFeeRate);
                long totalCost = subtotal + fee;

                if (availableCash < totalCost) return;

                if (WalletManager.Instance.SpendCash(totalCost))
                {
                    if (WalletManager.Instance.AddStockHolding(_targetStockId, _qty, _tradePrice))
                    {
                        Debug.Log($"[UITradePage] 매수 성공: {_targetStockId} {_qty}주 체결 완료! (단가: {_tradePrice}G)");
                        
                        StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
                        if (controller != null) controller.RefreshAppUI();
                        
                        ShowReceiptPopup(stock, true, _tradePrice, _qty, fee, totalCost);
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

                if (!hasHolding) return;

                if (WalletManager.Instance.RemoveStockHolding(_targetStockId, _qty))
                {
                    long subtotal = _qty * _tradePrice;
                    long fee = (long)Math.Round(subtotal * finalFeeRate);
                    long saleRevenue = subtotal - fee;
                    WalletManager.Instance.AddCash(saleRevenue);
                    
                    Debug.Log($"[UITradePage] 매도 성공: {_targetStockId} {_qty}주 체결 완료! (단가: {_tradePrice}G)");

                    StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
                    if (controller != null) controller.RefreshAppUI();

                    ShowReceiptPopup(stock, false, _tradePrice, _qty, fee, saleRevenue);
                    _qty = 1; // 수량 초기화
                    UpdateUI();
                }
            }
        }

        /// <summary>
        /// 매수/매도 성공 시 영수증 팝업(Popup_TradeReceipt)에 체결 정보를 렌더링하고 표시합니다.
        /// </summary>
        private void ShowReceiptPopup(StockInstance stock, bool isBuy, long unitPrice, int qty, long fee, long totalCost)
        {
            if (_receiptPopup == null)
            {
                var found = transform.parent != null ? transform.parent.GetComponentsInChildren<Transform>(true) : GetComponentsInChildren<Transform>(true);
                foreach (var t in found)
                {
                    if (t.name.IndexOf("Popup_TradeReceipt", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        _receiptPopup = t.gameObject;
                        break;
                    }
                }
            }

            if (_receiptPopup == null)
            {
                Debug.LogWarning("[UITradePage] ShowReceiptPopup: Popup_TradeReceipt를 찾을 수 없습니다.");
                return;
            }

            TMP_Text title = _receiptTitleText, stockName = _receiptStockNameText, unitP = _receiptUnitPriceText;
            TMP_Text quant = _receiptQuantityText, tax = _receiptTaxText, totalP = _receiptTotalPriceText;
            Button okBtn = _receiptOkButton;

            var texts = _receiptPopup.GetComponentsInChildren<TMP_Text>(true);
            foreach (var txt in texts)
            {
                string n = txt.name;
                if (title == null && n.IndexOf("TitleText", StringComparison.OrdinalIgnoreCase) >= 0) title = txt;
                else if (stockName == null && n.IndexOf("StockName", StringComparison.OrdinalIgnoreCase) >= 0) stockName = txt;
                else if (unitP == null && n.IndexOf("UnitPrice", StringComparison.OrdinalIgnoreCase) >= 0) unitP = txt;
                else if (quant == null && (n.IndexOf("Quantity", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Quantitiy", StringComparison.OrdinalIgnoreCase) >= 0)) quant = txt;
                else if (tax == null && (n.IndexOf("Tax", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Fee", StringComparison.OrdinalIgnoreCase) >= 0)) tax = txt;
                else if (totalP == null && n.IndexOf("TotalPrice", StringComparison.OrdinalIgnoreCase) >= 0) totalP = txt;
            }

            if (okBtn == null)
            {
                okBtn = _receiptPopup.GetComponentInChildren<Button>(true);
            }

            if (title != null) title.text = isBuy ? "매수 체결 영수증" : "매도 체결 영수증";
            if (stockName != null) stockName.text = $"종목 이름: {stock.Data.name}";
            if (unitP != null) unitP.text = $"종목 당 가격: {unitPrice:N0}G";
            if (quant != null) quant.text = $"{(isBuy ? "구매 개수" : "판매 개수")}: {qty:N0}개";
            if (tax != null) tax.text = $"세금: {fee:N0}G";
            if (totalP != null) totalP.text = $"총 금액: {totalCost:N0}G";

            if (okBtn != null)
            {
                okBtn.onClick.RemoveAllListeners();
                okBtn.onClick.AddListener(() =>
                {
                    _receiptPopup.SetActive(false);
                });
            }

            _receiptPopup.SetActive(true);
            _receiptPopup.transform.SetAsLastSibling(); // 팝업을 최상단으로 렌더링
        }

        /// <summary>
        /// 좌측에 5단계 미니 호가 데이터를 렌더링하고, 클릭 시 거래 가격에 반영되도록 리스너를 연동합니다.
        /// </summary>
        private void UpdateMiniOrderBook(StockInstance stock)
        {
            if (_miniRowPrefab == null || _miniOrderBookContainer == null)
            {
                Debug.LogWarning($"[UITradePage] UpdateMiniOrderBook 실행 불가: _miniRowPrefab={(_miniRowPrefab != null ? _miniRowPrefab.name : "NULL")}, _miniOrderBookContainer={(_miniOrderBookContainer != null ? _miniOrderBookContainer.name : "NULL")}");
                return;
            }

            Transform actualContainer = _miniOrderBookContainer;
            
            // 1. ScrollRect: 가로 스크롤 차단, 세로 스크롤 부드럽게 허용!
            UnityEngine.UI.ScrollRect scrollRect = _miniOrderBookContainer.GetComponentInParent<UnityEngine.UI.ScrollRect>();
            if (scrollRect != null)
            {
                if (scrollRect.content != null) actualContainer = scrollRect.content;
                scrollRect.enabled = true;
                scrollRect.horizontal = false; // 가로 이동 차단
                scrollRect.vertical = true;    // 세로 스크롤 허용
                scrollRect.movementType = UnityEngine.UI.ScrollRect.MovementType.Elastic;
                scrollRect.inertia = true;
                scrollRect.decelerationRate = 0.135f;
                scrollRect.scrollSensitivity = 15f;
            }

            // 스크롤 정규화 위치(0.0~1.0) 보존 로직 (화면 밖 튕김/사라짐 현상 100% 방지)
            float savedNormPos = 1f;
            bool shouldRestoreScroll = (_instantiatedMiniRows.Count > 0 && scrollRect != null);
            if (shouldRestoreScroll)
            {
                savedNormPos = Mathf.Clamp01(scrollRect.verticalNormalizedPosition);
            }

            // 2. ScrollView 상위의 Frame, bgColor, Viewport 등이 클릭 이벤트를 막지 못하게 raycastTarget = false 처리
            Transform scrollViewTrans = scrollRect != null ? scrollRect.transform : actualContainer.parent;
            if (scrollViewTrans != null)
            {
                foreach (var img in scrollViewTrans.GetComponentsInChildren<UnityEngine.UI.Image>(true))
                {
                    if (img.gameObject.name.IndexOf("Frame", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        img.gameObject.name.IndexOf("bgColor", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        img.gameObject.name.IndexOf("Viewport", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        img.raycastTarget = false; // 클릭 레이캐스트 방해 차단!
                    }
                }
            }

            // 3. Viewport 마스크 영역을 둥근 프레임 안쪽에 맞춰 깔끔하게 세로 스크롤 클리핑
            Transform viewportTrans = actualContainer.parent;
            if (viewportTrans != null)
            {
                UnityEngine.UI.Mask vpMask = viewportTrans.GetComponent<UnityEngine.UI.Mask>();
                if (vpMask != null) vpMask.enabled = false;

                UnityEngine.UI.RectMask2D vpRectMask = viewportTrans.GetComponent<UnityEngine.UI.RectMask2D>();
                if (vpRectMask == null) vpRectMask = viewportTrans.gameObject.AddComponent<UnityEngine.UI.RectMask2D>();
                vpRectMask.enabled = true;

                RectTransform vpRt = viewportTrans.GetComponent<RectTransform>();
                if (vpRt != null)
                {
                    vpRt.anchorMin = new Vector2(0f, 0f);
                    vpRt.anchorMax = new Vector2(1f, 1f);
                    vpRt.offsetMin = new Vector2(4f, 4f);
                    vpRt.offsetMax = new Vector2(-4f, -4f);
                }
            }

            RectTransform containerRt = actualContainer.GetComponent<RectTransform>();
            if (containerRt != null)
            {
                containerRt.anchorMin = new Vector2(0f, 1f);
                containerRt.anchorMax = new Vector2(1f, 1f);
                containerRt.pivot = new Vector2(0.5f, 1f);
                containerRt.anchoredPosition = Vector2.zero; // 기본 (0,0) 상단 고정
            }

            // 4. VerticalLayoutGroup & ContentSizeFitter (확실한 6px 행 간격 및 동일한 상하 여백 6px 적용)
            UnityEngine.UI.VerticalLayoutGroup vlg = actualContainer.GetComponent<UnityEngine.UI.VerticalLayoutGroup>();
            if (vlg != null)
            {
                vlg.childAlignment = TextAnchor.UpperCenter;
                vlg.childControlWidth = true;
                vlg.childControlHeight = true;
                vlg.childForceExpandWidth = true;
                vlg.childForceExpandHeight = false;
                vlg.spacing = 6f; // 행 사이 6px 세로 간격
                vlg.padding = new RectOffset(2, 2, 6, 6);
            }

            UnityEngine.UI.ContentSizeFitter csf = actualContainer.GetComponent<UnityEngine.UI.ContentSizeFitter>();
            if (csf == null) csf = actualContainer.gameObject.AddComponent<UnityEngine.UI.ContentSizeFitter>();
            csf.horizontalFit = UnityEngine.UI.ContentSizeFitter.FitMode.Unconstrained;
            csf.verticalFit = UnityEngine.UI.ContentSizeFitter.FitMode.PreferredSize;

            // 기존 자식 오브젝트 즉시 전면 삭제
            for (int k = actualContainer.childCount - 1; k >= 0; k--)
            {
                GameObject childGo = actualContainer.GetChild(k).gameObject;
                if (Application.isPlaying) Destroy(childGo);
                else DestroyImmediate(childGo);
            }
            _instantiatedMiniRows.Clear();

            // 실시간 현재가(stock.CurrentPrice)를 기준으로 9단계 가격 계산 (+4틱 ~ -4틱)
            double stepPercent = 0.002; // 0.2% 간격
            long basePrice = stock.CurrentPrice;
            long tickSize = Math.Max(1, (long)Math.Round(basePrice * stepPercent));

            long[] prices = new long[9];
            prices[0] = basePrice + tickSize * 4; // 매도4
            prices[1] = basePrice + tickSize * 3; // 매도3
            prices[2] = basePrice + tickSize * 2; // 매도2
            prices[3] = basePrice + tickSize * 1; // 매도1
            prices[4] = basePrice;                // 기준가 (선택된 가격)
            prices[5] = basePrice - tickSize * 1; // 매수1
            prices[6] = basePrice - tickSize * 2; // 매수2
            prices[7] = basePrice - tickSize * 3; // 매수3
            prices[8] = basePrice - tickSize * 4; // 매수4

            int stockSeed = stock.Data.stockId.GetHashCode() ^ System.Environment.TickCount;
            System.Random rand = new System.Random(stockSeed);

            for (int i = 0; i < 9; i++)
            {
                long price = prices[i];
                GameObject rowGo = Instantiate(_miniRowPrefab, actualContainer, false);
                rowGo.SetActive(true);
                _instantiatedMiniRows.Add(rowGo);

                // 스케일 및 RectTransform 기본값 보장
                RectTransform rt = rowGo.GetComponent<RectTransform>();
                if (rt != null)
                {
                    rt.localScale = Vector3.one;
                    rt.localPosition = new Vector3(rt.localPosition.x, rt.localPosition.y, 0);
                }

                // LayoutElement 높이 확대 (38px로 넉넉하게 확대하여 하단 행 잘림 연출)
                UnityEngine.UI.LayoutElement le = rowGo.GetComponent<UnityEngine.UI.LayoutElement>();
                if (le == null) le = rowGo.AddComponent<UnityEngine.UI.LayoutElement>();
                le.minHeight = 36f;
                le.preferredHeight = 38f;
                le.flexibleHeight = 0f;

                // 프리팹 내부 Frame 및 자식 높이를 38px로 동시 확대
                foreach (RectTransform childRt in rowGo.GetComponentsInChildren<RectTransform>(true))
                {
                    if (childRt == rt) continue;
                    Vector2 sz = childRt.sizeDelta;
                    sz.y = 38f;
                    childRt.sizeDelta = sz;
                }

                // 텍스트 탐색 (이름 기반 + 순서 기반 폴백)
                TMP_Text tmpPrice = null, tmpVol = null;
                var tmpTexts = rowGo.GetComponentsInChildren<TMP_Text>(true);
                if (tmpTexts != null && tmpTexts.Length > 0)
                {
                    foreach (var txt in tmpTexts)
                    {
                        if (txt.name.IndexOf("Price", StringComparison.OrdinalIgnoreCase) >= 0) tmpPrice = txt;
                        else if (txt.name.IndexOf("Volume", StringComparison.OrdinalIgnoreCase) >= 0 || txt.name.IndexOf("Number", StringComparison.OrdinalIgnoreCase) >= 0) tmpVol = txt;
                    }

                    if (tmpPrice == null && tmpTexts.Length >= 1) tmpPrice = tmpTexts[0];
                    if (tmpVol == null && tmpTexts.Length >= 2) tmpVol = tmpTexts[1];
                }

                UnityEngine.UI.Text legPrice = null, legVol = null;
                var legTexts = rowGo.GetComponentsInChildren<UnityEngine.UI.Text>(true);
                if (legTexts != null && legTexts.Length > 0)
                {
                    foreach (var txt in legTexts)
                    {
                        if (txt.name.IndexOf("Price", StringComparison.OrdinalIgnoreCase) >= 0) legPrice = txt;
                        else if (txt.name.IndexOf("Volume", StringComparison.OrdinalIgnoreCase) >= 0 || txt.name.IndexOf("Number", StringComparison.OrdinalIgnoreCase) >= 0) legVol = txt;
                    }
                    if (legPrice == null && legTexts.Length >= 1) legPrice = legTexts[0];
                    if (legVol == null && legTexts.Length >= 2) legVol = legTexts[1];
                }

                if (tmpPrice != null)
                {
                    tmpPrice.text = $"{price:N0}";
                    tmpPrice.color = new Color(0.24f, 0.17f, 0.12f, 1f);
                    tmpPrice.fontSize = 13f;
                    tmpPrice.raycastTarget = false; // 클릭 이벤트 하위 통과
                }
                if (legPrice != null)
                {
                    legPrice.text = $"{price:N0}";
                    legPrice.color = new Color(0.24f, 0.17f, 0.12f, 1f);
                    legPrice.fontSize = 13;
                    legPrice.raycastTarget = false;
                }

                int qty = (i == 4) ? 0 : rand.Next(50, 15000);
                string volStr = (qty <= 0) ? "-" : (qty >= 1000 ? $"{qty / 1000f:F1}k" : qty.ToString());

                if (tmpVol != null)
                {
                    tmpVol.text = volStr;
                    tmpVol.color = new Color(0.24f, 0.17f, 0.12f, 1f);
                    tmpVol.fontSize = 13f;
                    tmpVol.raycastTarget = false; // 클릭 이벤트 하위 통과
                }
                if (legVol != null)
                {
                    legVol.text = volStr;
                    legVol.color = new Color(0.24f, 0.17f, 0.12f, 1f);
                    legVol.fontSize = 13;
                    legVol.raycastTarget = false;
                }

                // 행 루트 투명 이미지 (터치 감지용 raycastTarget = true)
                Image rootImg = rowGo.GetComponent<Image>();
                if (rootImg == null) rootImg = rowGo.AddComponent<Image>();
                rootImg.color = new Color(0, 0, 0, 0.001f); // 투명하지만 터치는 100% 감지!
                rootImg.raycastTarget = true;

                // 내적 PriceText & Number 카드 배경 이미지에 은은한 색상 적용 (i<4: 매도 모카, i>4: 매수 베이지, i==4: 기준가 탠)
                Color targetBgColor = (i < 4) ? new Color(0.85f, 0.77f, 0.68f, 1f) : 
                                     ((i > 4) ? new Color(0.92f, 0.87f, 0.79f, 1f) : new Color(0.78f, 0.66f, 0.54f, 1f));

                if (tmpPrice != null)
                {
                    Image pBg = tmpPrice.transform.parent != null ? tmpPrice.transform.parent.GetComponent<Image>() : tmpPrice.GetComponent<Image>();
                    if (pBg != null && pBg.gameObject != rowGo)
                    {
                        pBg.color = targetBgColor;
                        pBg.raycastTarget = false; // 터치가 버튼으로 흡수되도록 설정
                    }
                }
                if (tmpVol != null)
                {
                    Image vBg = tmpVol.transform.parent != null ? tmpVol.transform.parent.GetComponent<Image>() : tmpVol.GetComponent<Image>();
                    if (vBg != null && vBg.gameObject != rowGo)
                    {
                        vBg.color = targetBgColor;
                        vBg.raycastTarget = false; // 터치가 버튼으로 흡수되도록 설정
                    }
                }

                // 미니 호가 행 클릭 시 거래 단가 및 총금액 즉시 반영 (ScrollRect 드래그와 100% 호환되는 Button.onClick 사용)
                long selectedPrice = price;

                // EventTrigger가 드래그 이벤트를 낚아채서 스크롤을 방해하지 않도록 기존 EventTrigger 제거
                UnityEngine.EventSystems.EventTrigger trigger = rowGo.GetComponent<UnityEngine.EventSystems.EventTrigger>();
                if (trigger != null) Destroy(trigger);

                Button rowBtn = rowGo.GetComponent<Button>();
                if (rowBtn == null) rowBtn = rowGo.AddComponent<Button>();
                rowBtn.targetGraphic = rootImg;
                rowBtn.transition = Selectable.Transition.ColorTint;

                ColorBlock colors = rowBtn.colors;
                colors.normalColor = Color.white;
                colors.highlightedColor = new Color(0.95f, 0.90f, 0.80f, 1f);
                colors.pressedColor = new Color(0.75f, 0.65f, 0.55f, 1f);
                rowBtn.colors = colors;

                rowBtn.onClick.RemoveAllListeners();
                rowBtn.onClick.AddListener(() =>
                {
                    Debug.Log($"<color=#FFD700>[호가 선택 성공!] 선택 단가: {selectedPrice:N0} G -> 총금액 갱신!</color>");
                    _tradePrice = selectedPrice;
                    UpdateTotalValueOnly();
                });

                if (i == 0)
                {
                    Debug.Log($"<color=#00FF7F>[진단] 호가행0: active={rowGo.activeInHierarchy}, Pos={rt.anchoredPosition}, Size={rt.rect.size}, PriceTxt={tmpPrice?.text}({tmpPrice?.gameObject.name}), VolTxt={tmpVol?.text}({tmpVol?.gameObject.name})</color>");
                }
            }

            // 스크롤 정규화 위치 안전 복원 (0.0 ~ 1.0 범위 내로 안전 고정하여 화면 이탈 100% 방지)
            if (shouldRestoreScroll && scrollRect != null)
            {
                scrollRect.verticalNormalizedPosition = savedNormPos;
            }
            else if (scrollRect != null)
            {
                scrollRect.verticalNormalizedPosition = 1f; // 최초 생성 시 맨 위(1.0f) 상단 고정
            }

            Debug.Log($"<color=#00FF7F>[UITradePage] 미니 호가창 9개 행 생성 완료! 컨테이너={actualContainer.name}, 자식수={actualContainer.childCount}</color>");
        }
    }
}
