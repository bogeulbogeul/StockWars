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
        [SerializeField] private TMP_Text _stockCodeText;
        [SerializeField] private TMP_Text _currentPriceText;
        [SerializeField] private TMP_Text _changeRateText;
        [SerializeField] private TMP_Text _sectorText;

        [Header("Icon Component")]
        [SerializeField] private Image _logoImage;

        [Header("Colors (Standard)")]
        [SerializeField] private Color _colorGrowth = new Color(0f, 0.92f, 1f, 1f); // Neon Cyan (#00EAFF)
        [SerializeField] private Color _colorDecline = new Color(1f, 0.29f, 0.29f, 1f); // Neon Red (#FF4B4B)
        [SerializeField] private Color _colorFlat = new Color(0.67f, 0.67f, 0.67f, 1f); // Gray (#AAAAAA)

        /// <summary>
        /// 종목의 실시간 데이터 인스턴스를 받아와 카드의 모든 UI 요소를 갱신합니다.
        /// </summary>
        public void BindData(StockInstance stock)
        {
            if (stock == null) return;

            // 1. 기본 텍스트 정보 바인딩
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_stockCodeText != null) _stockCodeText.text = stock.StockId;
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";
            
            // 섹터 정보 매핑 (Enum -> 예쁜 문자열 표기)
            if (_sectorText != null) 
            {
                switch (stock.Data.sector)
                {
                    case StockSector.IT: _sectorText.text = "Cloud Technology"; break;
                    case StockSector.Finance: _sectorText.text = "Payment App"; break;
                    case StockSector.Aerospace: _sectorText.text = "Space Tech"; break;
                    case StockSector.Bio: _sectorText.text = "Bio & Health"; break;
                    case StockSector.Energy: _sectorText.text = "Sustainable Tech"; break;
                    case StockSector.Entertainment: _sectorText.text = "Media & Ent."; break;
                    case StockSector.Infrastructure: _sectorText.text = "Infrastructure"; break;
                    case StockSector.Retail: _sectorText.text = "Retail Market"; break;
                    default: _sectorText.text = stock.Data.sector.ToString(); break;
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
        }
    }
}
