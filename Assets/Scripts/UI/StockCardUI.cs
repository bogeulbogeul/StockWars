using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 개별 주식 카드의 UI 요소 바인딩 및 런타임 값 렌더링을 담당하는 컴포넌트입니다.
    /// </summary>
    public class StockCardUI : MonoBehaviour
    {
        [Header("Text Components")]
        [SerializeField] private TMP_Text _companyNameText;
        [SerializeField] private TMP_Text _currentPriceText;
        [SerializeField] private TMP_Text _changeRateText;

        [Header("Icon & Background")]
        [SerializeField] private Image _logoImage;
        [SerializeField] private Image _bgColor;

        [Header("Colors (Standard)")]
        [SerializeField] private Color _colorGrowth = new Color(0f, 0.92f, 1f, 1f); // Neon Cyan (#00EAFF)
        [SerializeField] private Color _colorDecline = new Color(1f, 0.29f, 0.29f, 1f); // Neon Red (#FF4B4B)
        [SerializeField] private Color _colorFlat = new Color(0.67f, 0.67f, 0.67f, 1f); // Gray (#AAAAAA)

        /// <summary>
        /// 종목의 실시간 데이터 인스턴스를 받아와 카드의 모든 UI 요소를 갱신합니다.
        /// </summary>
        public void BindData(StockInstance stock, StockMarketAppController controller = null)
        {
            if (stock == null) return;

            // 1. 기본 텍스트 정보 바인딩
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";
            
            // 섹터별 파스텔 배경색 매핑
            if (_bgColor != null)
            {
                switch (stock.Data.sector)
                {
                    case StockSector.IT: _bgColor.color = new Color(0.88f, 0.95f, 1f, 1f); break; // 파스텔 블루
                    case StockSector.Bio: _bgColor.color = new Color(0.88f, 1f, 0.88f, 1f); break; // 파스텔 그린
                    case StockSector.Energy: _bgColor.color = new Color(1f, 0.98f, 0.85f, 1f); break; // 파스텔 옐로우
                    case StockSector.Finance: _bgColor.color = new Color(1f, 0.92f, 0.85f, 1f); break; // 파스텔 오렌지
                    case StockSector.Aerospace: _bgColor.color = new Color(0.93f, 0.88f, 1f, 1f); break; // 파스텔 퍼플
                    case StockSector.Entertainment: _bgColor.color = new Color(1f, 0.88f, 0.95f, 1f); break; // 파스텔 핑크
                    case StockSector.Infrastructure: _bgColor.color = new Color(0.94f, 0.90f, 0.85f, 1f); break; // 파스텔 베이지
                    case StockSector.Retail: _bgColor.color = new Color(0.85f, 0.98f, 0.95f, 1f); break; // 파스텔 민트
                    default: _bgColor.color = Color.white; break;
                }
            }

            // 2. 등락 계산
            long delta = 0;
            double flucRate = 0.0;
            if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
            {
                long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                delta = stock.CurrentPrice - prevPrice;
                flucRate = prevPrice != 0 ? ((double)delta / prevPrice) * 100.0 : 0.0;
            }

            // 3. 등락 비주얼 연출 (아이콘 표시 및 색상 매칭)
            string indicator = "-";
            Color targetColor = _colorFlat;
            string sign = "";

            if (delta > 0)
            {
                indicator = "▲";
                targetColor = _colorGrowth;
                sign = "+";
            }
            else if (delta < 0)
            {
                indicator = "▼";
                targetColor = _colorDecline;
            }

            if (_changeRateText != null)
            {
                _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                _changeRateText.color = targetColor;
            }

            // 주가 텍스트 색상도 등락 색상에 조화롭게 매칭 (원할 시)
            if (_currentPriceText != null)
            {
                _currentPriceText.color = targetColor;
            }

            // 4. 회사 로고 로드 및 설정 (폴백 시스템 적용)
            if (_logoImage != null)
            {
                // Resources 폴더 내 로고 이미지 로드 시도
                Sprite logoSprite = Resources.Load<Sprite>($"Sprites/Logos/{stock.StockId}");
                if (logoSprite != null)
                {
                    _logoImage.sprite = logoSprite;
                    _logoImage.color = Color.white;
                }
                else
                {
                    // 로드 실패 시 기본 하얀색 또는 투명화 처리
                    _logoImage.color = new Color(1f, 1f, 1f, 0.2f); // 연한 실루엣 폴백
                }
            }

            // 5. 클릭 이벤트 연결 (클릭 시 해당 종목 거래 화면으로 이동)
            if (controller != null)
            {
                Button button = GetComponent<Button>();
                if (button != null)
                {
                    button.onClick.RemoveAllListeners();
                    button.onClick.AddListener(() =>
                    {
                        controller.ShowPaymentPage(stock.StockId);
                    });
                }
            }
        }
    }
}
