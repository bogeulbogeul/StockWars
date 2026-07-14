using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 차트를 탭했을 때 노출되는 '상세 주가 그래프 팝업창'의 데이터 관리자입니다.
    /// 더 크고 세분화된 가격 선/영역 그래프 및 종목 정보를 표시합니다.
    /// </summary>
    public class UIDetailedChartPopup : MonoBehaviour
    {
        [Header("Stock Information")]
        [SerializeField] private TMP_Text _companyNameText;
        [SerializeField] private TMP_Text _stockCodeText;
        [SerializeField] private TMP_Text _currentPriceText;
        [SerializeField] private TMP_Text _changeRateText;
        [SerializeField] private Image _logoImage;

        [Header("Detailed Chart Component")]
        [SerializeField] private UIStockChart _detailedChart;

        [Header("Interaction Buttons")]
        [SerializeField] private Button _closeButton;

        private string _targetStockId;

        private void Start()
        {
            if (_closeButton != null)
            {
                _closeButton.onClick.RemoveAllListeners();
                _closeButton.onClick.AddListener(ClosePopup);
            }
        }

        /// <summary>
        /// 팝업창을 열고 대상 종목의 실시간 상세 차트 데이터를 갱신합니다.
        /// </summary>
        public void OpenPopup(string stockId)
        {
            _targetStockId = stockId;
            gameObject.SetActive(true);
            RefreshPopupUI();
        }

        /// <summary>
        /// 팝업창을 닫습니다.
        /// </summary>
        public void ClosePopup()
        {
            gameObject.SetActive(false);
        }

        public void RefreshPopupUI()
        {
            if (string.IsNullOrEmpty(_targetStockId) || MarketManager.Instance == null) return;

            var stock = MarketManager.Instance.GetStock(_targetStockId);
            if (stock == null) return;

            // 1. 헤더 텍스트 정보 매핑
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_stockCodeText != null) _stockCodeText.text = stock.StockId.ToUpper();
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";

            // 2. 등락 정보 및 색상 계산
            long delta = 0;
            double flucRate = 0.0;
            if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
            {
                long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                delta = stock.CurrentPrice - prevPrice;
                flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;
            }

            if (_changeRateText != null)
            {
                string indicator = delta > 0 ? "▲" : (delta < 0 ? "▼" : "-");
                string sign = delta > 0 ? "+" : "";
                
                Color textCol = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                               (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));

                _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                _changeRateText.color = textCol;
            }

            // 3. 로고 이미지 바인딩 (폴백 지원)
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
                    _logoImage.color = new Color(1f, 1f, 1f, 0.15f);
                }
            }

            // 4. 대형 상세 차트 그리기
            if (_detailedChart != null && stock.PriceHistory != null)
            {
                // 상승 시 하늘색, 하락 시 빨간색 테마 적용
                Color chartColor = delta > 0 ? new Color(0f, 0.92f, 1f, 1f) : 
                                   (delta < 0 ? new Color(1f, 0.29f, 0.29f, 1f) : new Color(0.67f, 0.67f, 0.67f, 1f));

                Color topGrad = chartColor;
                topGrad.a = 0.35f; // 반투명 채우기
                Color bottomGrad = chartColor;
                bottomGrad.a = 0f;

                _detailedChart.SetColor(chartColor, topGrad, bottomGrad);
                _detailedChart.DrawChart(_targetStockId, stock.PriceHistory.ToList());
            }
        }
    }
}
