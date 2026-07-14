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
        [SerializeField] private TMP_Text _changePriceText; // 등락 금액 텍스트 (예: +20G 또는 -15G)

        [Header("Icon & Background")]
        [SerializeField] private Image _logoImage;
        [SerializeField] private Image _changeRateBgImage; // 등락률 배경 이미지 (Pill 배경 등)
        [SerializeField] private Color _changeRateTextOnBgColor = Color.white; // 배경색이 변경될 때의 텍스트 색상 (선택사항)

        [Header("Colors (Standard)")]
        [SerializeField] private Color _colorGrowth = new Color(0f, 0.92f, 1f, 1f); // Neon Cyan (#00EAFF)
        [SerializeField] private Color _colorDecline = new Color(1f, 0.29f, 0.29f, 1f); // Neon Red (#FF4B4B)
        [SerializeField] private Color _colorFlat = new Color(0.67f, 0.67f, 0.67f, 1f); // Gray (#AAAAAA)

        [Header("New Recent Card Layout (Optional)")]
        [SerializeField] private GameObject _changePillContainer; // 등락을 표시할 Pill 배경 게임 오브젝트
        [SerializeField] private Image _changePillImage;          // Pill 이미지 컴포넌트 (색상 변경용)
        [SerializeField] private TMP_Text _changePillText;         // Pill 내 텍스트 (예: ▲ 1,200 또는 ▼ 1,500)
        [SerializeField] private GameObject _priceContainer;      // 평상시 가격 표시 컨테이너 (예: 918 G)
        [SerializeField] private TMP_Text _sectorText;             // 섹터 설명 텍스트 (예: Cloud Technology)
        [SerializeField] private int _historyCompareIntervalTicks = 60; // 등락 계산 비교 간격 (틱 단위, 기본 60틱 = 1분)
        
        [Header("New Recent Card Colors (Optional)")]
        [SerializeField] private Color _pillGrowthColor = new Color(0.27f, 0.83f, 0.45f, 1f);  // #46D473 (연두/초록)
        [SerializeField] private Color _pillDeclineColor = new Color(1f, 0.37f, 0.38f, 1f);  // #FF5E62 (분홍/빨강)

        /// <summary>
        /// 종목의 실시간 데이터 인스턴스를 받아와 카드의 모든 UI 요소를 갱신합니다.
        /// </summary>
        public void BindData(StockInstance stock, StockMarketAppController controller = null)
        {
            if (stock == null) return;

            // 1. 기본 텍스트 정보 바인딩
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_currentPriceText != null) _currentPriceText.text = $"{stock.CurrentPrice:N0} G";
            
            // 배경색은 코드로 임의 변경하지 않고 프리팹 원래 디자인 컬러를 유지합니다.

            if (_sectorText != null)
            {
                switch (stock.Data.sector)
                {
                    case StockSector.IT: _sectorText.text = "Cloud Technology"; break;
                    case StockSector.Bio: _sectorText.text = "Bio Technology"; break;
                    case StockSector.Energy: _sectorText.text = "Sustainable Tech"; break;
                    case StockSector.Finance: _sectorText.text = "Payment App"; break;
                    case StockSector.Entertainment: _sectorText.text = "Entertainment"; break;
                    case StockSector.Infrastructure: _sectorText.text = "Infrastructure"; break;
                    case StockSector.Retail: _sectorText.text = "Retail Market"; break;
                    case StockSector.Aerospace: _sectorText.text = "Aerospace"; break;
                    default: _sectorText.text = stock.Data.sector.ToString(); break;
                }
            }

            // 2. 등락 계산
            long delta = 0;
            double flucRate = 0.0;
            if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
            {
                // 설정된 틱 간격 이전의 가격과 비교 (데이터가 충분하지 않으면 가장 첫 번째 틱인 [0]번 데이터 참조)
                int compareIndex = Mathf.Max(0, stock.PriceHistory.Count - _historyCompareIntervalTicks);
                long prevPrice = stock.PriceHistory[compareIndex];
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

            // 최근 조회용 가로/세로 Pill 레이아웃 활성화 상태인 경우 처리
            if (_changePillContainer != null)
            {
                // 가격 텍스트는 컨테이너 활성화 여부와 상관없이 항상 업데이트
                if (_currentPriceText != null)
                {
                    _currentPriceText.text = $"{stock.CurrentPrice:N0} G";
                    _currentPriceText.color = new Color(0.24f, 0.14f, 0.09f, 1f); // #3D2417 (기본 고동색/갈색)
                }

                if (delta != 0)
                {
                    // 변동이 있으면 Pill 표시
                    _changePillContainer.SetActive(true);
                    if (_priceContainer != null) _priceContainer.SetActive(false);

                    if (_changePillText != null)
                    {
                        // 쉼표 포맷팅과 함께 변동 절대값 표시 (예: ▲ 1,200 또는 ▼ 1,500)
                        _changePillText.text = $"{indicator} {Math.Abs(delta):N0}";
                    }
                    if (_changePillImage != null)
                    {
                        _changePillImage.color = (delta > 0) ? _pillGrowthColor : _pillDeclineColor;
                    }
                }
                else
                {
                    // 변동이 없으면 Pill 숨김
                    _changePillContainer.SetActive(false);
                    if (_priceContainer != null) _priceContainer.SetActive(true);
                }

                // 퍼센트 텍스트(기존 _changeRateText 재활용)가 있으면 등락 퍼센트 표시 (예: +2.50% 또는 -1.50%)
                if (_changeRateText != null)
                {
                    _changeRateText.text = $"{sign}{flucRate:F2}%";
                    _changeRateText.color = targetColor;
                }
            }
            else
            {
                // 기존 레이아웃 분기
                if (_changeRateText != null)
                {
                    _changeRateText.text = $"{indicator} {sign}{flucRate:F2}%";
                    if (_changeRateBgImage != null)
                    {
                        _changeRateText.color = _changeRateTextOnBgColor;
                    }
                    else
                    {
                        _changeRateText.color = targetColor;
                    }
                }

                if (_changeRateBgImage != null)
                {
                    _changeRateBgImage.color = targetColor;
                }

                if (_currentPriceText != null)
                {
                    _currentPriceText.color = Color.black; // 가격은 검은색으로 고정
                }

                if (_changePriceText != null)
                {
                    _changePriceText.text = $"{sign}{delta:N0}G"; // 등락 금액 텍스트 바인딩
                    _changePriceText.color = targetColor; // 등락 금액 색상은 파랑/빨강으로 변경
                }
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
