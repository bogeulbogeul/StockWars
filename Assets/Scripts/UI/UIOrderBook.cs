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
            List<int> sellQuantities = new List<int>();
            List<int> buyQuantities = new List<int>();

            for (int i = 0; i < _orderLevels; i++)
            {
                sellQuantities.Add(Random.Range(100, 1500));
                buyQuantities.Add(Random.Range(100, 1500));
            }

            // 1. 매도 호가 (Sell Orders / Asks) - 높은 가격부터 거꾸로 생성하여 중간가 위에 오도록 배치
            for (int i = _orderLevels; i >= 1; i--)
            {
                long price = (long)System.Math.Round(currentPrice * (1.0 + _priceStepPercent * i));
                int qty = sellQuantities[i - 1];
                CreateRow(price, qty, maxQty, _sellBackgroundColor, _sellBarColor);
            }

            // 1.5. 중간 현재가 표시행 추가 (매도 호가와 매수 호가 사이)
            CreateMiddleCurrentPriceRow(currentPrice, stock);

            // 2. 매수 호가 (Buy Orders / Bids) - 현재가 바로 아래 가격부터 차례대로 생성
            for (int i = 1; i <= _orderLevels; i++)
            {
                long price = (long)System.Math.Round(currentPrice * (1.0 - _priceStepPercent * i));
                int qty = buyQuantities[i - 1];
                CreateRow(price, qty, maxQty, _buyBackgroundColor, _buyBarColor);
            }
        }

        private void CreateRow(long price, int quantity, int maxQuantity, Color bgColor, Color barColor)
        {
            GameObject rowGo = Instantiate(_rowPrefab, _contentContainer);
            _instantiatedRows.Add(rowGo);

            // 1. 가격 텍스트 설정
            Transform priceTrans = rowGo.transform.Find("Price");
            if (priceTrans != null)
            {
                TMP_Text priceText = priceTrans.GetComponent<TMP_Text>();
                if (priceText != null)
                {
                    priceText.text = $"G {price:N0}";
                    priceText.raycastTarget = false; // 배경 클릭을 방해하지 않도록 해제
                }
            }

            // 2. 수량 텍스트 설정
            Transform numTrans = rowGo.transform.Find("Number");
            if (numTrans != null)
            {
                TMP_Text numText = numTrans.GetComponent<TMP_Text>();
                if (numText != null)
                {
                    numText.text = quantity.ToString();
                    numText.raycastTarget = false; // 배경 클릭 방해 해제
                }
            }

            // 3. 수량 그래프 바 설정 (Fill Amount 및 색상)
            Transform barTrans = rowGo.transform.Find("VolumeBar");
            if (barTrans != null)
            {
                Image barImage = barTrans.GetComponent<Image>();
                if (barImage != null)
                {
                    barImage.color = barColor;
                    barImage.fillAmount = (float)quantity / maxQuantity;
                    barImage.raycastTarget = false; // 배경 클릭 방해 해제
                }
            }

            // 4. 안쪽 배경색 설정 (bgColor, BG, Background 순으로 찾음)
            Transform bgTrans = rowGo.transform.Find("bgColor");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("BG");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("Background");

            if (bgTrans != null)
            {
                Image bgImage = bgTrans.GetComponent<Image>();
                if (bgImage != null)
                {
                    bgImage.color = bgColor;
                    bgImage.raycastTarget = true; // 클릭을 받아야 하므로 활성화
                }
            }
            else
            {
                // 자식이 따로 없으면 부모의 Image에 바로 색칠 (폴백 보증)
                Image parentImage = rowGo.GetComponent<Image>();
                if (parentImage != null)
                {
                    parentImage.color = bgColor;
                    parentImage.raycastTarget = true;
                }
            }

            // 5. 호가 클릭 인터랙션 (매수/매도 버튼 노출)
            bool isSelected = (_selectedPrice.HasValue && _selectedPrice.Value == price);
            
            Transform buyBtnTrans = rowGo.transform.Find("BuyButton");
            Transform sellBtnTrans = rowGo.transform.Find("SellButton");
            
            if (buyBtnTrans != null && sellBtnTrans != null)
            {
                // 선택된 행일 때만 매수/매도 버튼 노출
                buyBtnTrans.gameObject.SetActive(isSelected);
                sellBtnTrans.gameObject.SetActive(isSelected);
                
                Button buyBtn = buyBtnTrans.GetComponent<Button>();
                if (buyBtn != null)
                {
                    buyBtn.onClick.RemoveAllListeners();
                    buyBtn.onClick.AddListener(() => ExecuteTrade(price, true));
                }
                
                Button sellBtn = sellBtnTrans.GetComponent<Button>();
                if (sellBtn != null)
                {
                    sellBtn.onClick.RemoveAllListeners();
                    sellBtn.onClick.AddListener(() => ExecuteTrade(price, false));
                }
                
                // 선택되었을 때 기존 게이지와 수량 텍스트는 숨김
                if (numTrans != null) numTrans.gameObject.SetActive(!isSelected);
                if (barTrans != null) barTrans.gameObject.SetActive(!isSelected);
            }
            else
            {
                // 버튼이 아직 프리팹에 없으면 원래 수량과 게이지는 항상 보임
                if (numTrans != null) numTrans.gameObject.SetActive(true);
                if (barTrans != null) barTrans.gameObject.SetActive(true);
            }
            
            // 배경 또는 자식 클릭 시 해당 가격 선택 토글 리스너 바인딩 (부모 rowGo에 등록하여 자식 클릭 전파 허용)
            Button rowButton = rowGo.GetComponent<Button>();
            if (rowButton == null) rowButton = rowGo.AddComponent<Button>();
            
            rowButton.transition = Selectable.Transition.None; // 불필요한 색상 하이라이트 방지
            rowButton.onClick.RemoveAllListeners();
            rowButton.onClick.AddListener(() => SelectPriceRow(price));
        }

        private void CreateMiddleCurrentPriceRow(long currentPrice, StockInstance stock)
        {
            GameObject rowGo = Instantiate(_rowPrefab, _contentContainer);
            _instantiatedRows.Add(rowGo);

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
            Color textCol = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                           (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));

            // 1. 가격 텍스트 설정 (굵고 도드라지게)
            Transform priceTrans = rowGo.transform.Find("Price");
            if (priceTrans != null)
            {
                TMP_Text priceText = priceTrans.GetComponent<TMP_Text>();
                if (priceText != null)
                {
                    priceText.text = $"<b>G {currentPrice:N0}</b>";
                    priceText.color = textCol;
                }
            }

            // 2. 수량 칸에 등락률 표시 (예: "▲ +2.30%")
            Transform numTrans = rowGo.transform.Find("Number");
            if (numTrans != null)
            {
                TMP_Text numText = numTrans.GetComponent<TMP_Text>();
                if (numText != null)
                {
                    numText.text = $"<b>{indicator} {sign}{flucRate:F2}%</b>";
                    numText.color = textCol;
                }
            }

            // 3. 수량 그래프 바 비활성화 (현재가이므로 비워둠)
            Transform barTrans = rowGo.transform.Find("VolumeBar");
            if (barTrans != null)
            {
                Image barImage = barTrans.GetComponent<Image>();
                if (barImage != null)
                {
                    barImage.fillAmount = 0f;
                }
            }

            // 4. 배경색 설정 (차분한 회색/미색으로 중간 구분선 역할)
            Color middleBgColor = new Color(0.93f, 0.93f, 0.94f, 1f); // 연회색
            Transform bgTrans = rowGo.transform.Find("bgColor");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("BG");
            if (bgTrans == null) bgTrans = rowGo.transform.Find("Background");

            if (bgTrans != null)
            {
                Image bgImage = bgTrans.GetComponent<Image>();
                if (bgImage != null)
                {
                    bgImage.color = middleBgColor;
                }
            }
            else
            {
                Image parentImage = rowGo.GetComponent<Image>();
                if (parentImage != null)
                {
                    parentImage.color = middleBgColor;
                }
            }

            // 5. 현재가(중앙) 행에서는 거래 버튼 비활성화
            Transform buyBtnTrans = rowGo.transform.Find("BuyButton");
            if (buyBtnTrans != null) buyBtnTrans.gameObject.SetActive(false);

            Transform sellBtnTrans = rowGo.transform.Find("SellButton");
            if (sellBtnTrans != null) sellBtnTrans.gameObject.SetActive(false);
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
