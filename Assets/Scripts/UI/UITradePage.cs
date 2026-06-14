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

        [Header("Buy / Sell Tabs")]
        [SerializeField] private Button _buyTabButton;
        [SerializeField] private Button _sellTabButton;
        [SerializeField] private Color _activeTabColor = Color.white;
        [SerializeField] private Color _inactiveTabColor = new Color(0.9f, 0.9f, 0.9f, 0.6f);

        [Header("Quantity & Price Selector")]
        [SerializeField] private TMP_Text _qtyText;
        [SerializeField] private Button _minusQtyButton;
        [SerializeField] private Button _plusQtyButton;
        [SerializeField] private TMP_Text _selectedPriceText;

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
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";

            if (_changeRateText != null)
            {
                long delta = 0;
                double flucRate = 0.0;
                if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
                {
                    long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                    delta = stock.CurrentPrice - prevPrice;
                    flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;
                }

                string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
                string sign = delta > 0 ? "+" : "";
                
                Color textCol = delta > 0 ? new Color(0f, 0.8f, 0.4f, 1f) : 
                               (delta < 0 ? new Color(0.9f, 0.3f, 0.3f, 1f) : new Color(0.5f, 0.5f, 0.5f, 1f));

                _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                _changeRateText.color = textCol;
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
            
            if (_totalValueText != null) _totalValueText.text = $"{totalValue:N0} G";

            // 5. 탭 시각적 상태 갱신
            if (_buyTabButton != null)
            {
                var image = _buyTabButton.GetComponent<Image>();
                if (image != null) image.color = _isBuy ? _activeTabColor : _inactiveTabColor;
            }
            if (_sellTabButton != null)
            {
                var image = _sellTabButton.GetComponent<Image>();
                if (image != null) image.color = !_isBuy ? _activeTabColor : _inactiveTabColor;
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
            if (_miniOrderBookContainer == null || _miniRowPrefab == null) return;

            // 기존 미니 호가 리스트 클리어
            foreach (var row in _instantiatedMiniRows)
            {
                Destroy(row);
            }
            _instantiatedMiniRows.Clear();

            // 5단계 가격 계산 (+2틱, +1틱, 0틱, -1틱, -2틱)
            double stepPercent = 0.002; // 0.2% 간격
            long currentPrice = stock.CurrentPrice;

            long[] prices = new long[5];
            prices[0] = (long)Math.Round(currentPrice * (1.0 + stepPercent * 2)); // 매도2
            prices[1] = (long)Math.Round(currentPrice * (1.0 + stepPercent * 1)); // 매도1
            prices[2] = currentPrice;                                             // 현재가
            prices[3] = (long)Math.Round(currentPrice * (1.0 - stepPercent * 1)); // 매수1
            prices[4] = (long)Math.Round(currentPrice * (1.0 - stepPercent * 2)); // 매수2

            // 결정론적 무작위 수량 생성용 시드
            int stockSeed = stock.Data.id.GetHashCode();
            System.Random rand = new System.Random(stockSeed);

            for (int i = 0; i < 5; i++)
            {
                long price = prices[i];
                GameObject rowGo = Instantiate(_miniRowPrefab, _miniOrderBookContainer);
                _instantiatedMiniRows.Add(rowGo);

                // 1. 가격 바인딩
                Transform priceTrans = rowGo.transform.Find("Price");
                if (priceTrans != null)
                {
                    TMP_Text priceText = priceTrans.GetComponent<TMP_Text>();
                    if (priceText != null) priceText.text = $"{price:N0}";
                }

                // 2. 매도 잔량 (왼쪽 분홍색) - i < 2 일 때 노출
                Transform askTrans = rowGo.transform.Find("AskVolume");
                if (askTrans != null)
                {
                    if (i < 2)
                    {
                        askTrans.gameObject.SetActive(true);
                        TMP_Text askText = askTrans.GetComponentInChildren<TMP_Text>();
                        if (askText != null)
                        {
                            double vol = 3.0 + rand.NextDouble() * 12.0;
                            askText.text = $"{vol:F1}";
                        }
                    }
                    else
                    {
                        askTrans.gameObject.SetActive(false);
                    }
                }

                // 3. 매수 잔량 (오른쪽 파란색) - i > 2 일 때 노출
                Transform bidTrans = rowGo.transform.Find("BidVolume");
                if (bidTrans != null)
                {
                    if (i > 2)
                    {
                        bidTrans.gameObject.SetActive(true);
                        TMP_Text bidText = bidTrans.GetComponentInChildren<TMP_Text>();
                        if (bidText != null)
                        {
                            double vol = 3.0 + rand.NextDouble() * 12.0;
                            bidText.text = $"{vol:F1}";
                        }
                    }
                    else
                    {
                        bidTrans.gameObject.SetActive(false);
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
