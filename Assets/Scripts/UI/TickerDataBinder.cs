using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
#if TMPRO_PRESENT || true // TextMeshPro가 로드되지 않았을 시의 컴파일 안전장치
using TMPro;
#endif

namespace StockWars.UI
{
    using StockWars.Core;

    /// <summary>
    /// CORE_GDD_05 [씬 기획 및 UI/UX 인터페이스] 실시간 주식 데이터 티커 바인더 (안전성 및 고성능 최적화 버전).
    /// <para>
    /// 전광판(Ticker) UI 텍스트 컴포넌트에 실시간 상장 주식들의 현재가 및 등락률을 바인딩하고
    /// 상승 시 Cyan(#00EAFF), 하락 시 Red(#FF4B4B) 색상을 적용한 리치 텍스트 스크롤링 연출을 수행합니다.
    /// </para>
    /// </summary>
    [RequireComponent(typeof(RectTransform))]
    public class TickerDataBinder : MonoBehaviour
    {
        [Header("Text Components (Assign One)")]
        [Tooltip("유니티 기본 UI Text 컴포넌트")]
        public Text textComponent;

        [Tooltip("TextMeshPro UI Text 컴포넌트")]
        public TMP_Text tmpTextComponent;

        [Header("Scrolling Marquee Settings")]
        [Tooltip("좌우 전광판 스크롤 활성화 여부")]
        public bool enableScrolling = true;

        [Tooltip("초당 스크롤 이동 속도 (픽셀)")]
        public float scrollSpeed = 60f;

        [Tooltip("티커 반복 표시 간격 (구분자)")]
        public string separator = "    |    ";

        [Tooltip("개별 주식 간격 공백")]
        public string itemSpacer = "   ";

        [Header("Colors (CORE_GDD_05 Standard)")]
        [Tooltip("상승 색상 (Cyan)")]
        public Color colorGrowth = new Color(0.035f, 0.353f, 0.906f, 1f); // #095ae7ff

        [Tooltip("하락 색상 (Red)")]
        public Color colorDecline = new Color(1f, 0.29f, 0.29f, 1f); // #FF4B4B

        [Tooltip("보합 색상 (Gray)")]
        public Color colorFlat = new Color(0.67f, 0.67f, 0.67f, 1f); // #AAAAAA

        // 내부 주식 정보 캐시용 임시 클래스
        private class TickerStockState
        {
            public string StockId;
            public long CurrentPrice;
            public long Delta;
            public double FlucRate;
        }

        private readonly Dictionary<string, TickerStockState> _tickerData = new(StringComparer.OrdinalIgnoreCase);
        private readonly List<string> _orderedStockIds = new();
        
        private RectTransform _rectTransform;
        private Vector2 _initialPosition;
        
        private float _textWidth = 0f;
        private float _containerWidth = 0f;
        
        private bool _isInitialized = false;
        private bool _isDirty = false; // 성능 최적화를 위한 더티 플래그

        // 매번 파싱하여 생기는 문자열 가비지를 방지하기 위한 컬러 16진수 캐시
        private string _growthHex;
        private string _declineHex;
        private string _flatHex;

        private void Awake()
        {
            _rectTransform = GetComponent<RectTransform>();
            _initialPosition = _rectTransform.anchoredPosition;

            // 컴포넌트 자동 탐색 (수동 할당이 누락되었을 때)
            if (textComponent == null && tmpTextComponent == null)
            {
                textComponent = GetComponent<Text>();
                tmpTextComponent = GetComponent<TMP_Text>();
            }
        }

        private void Start()
        {
            CacheHexColors();
            InitializeTickerData();
            
            // 초기 텍스트 렌더링 및 바운드 설정
            RebuildTickerImmediate();
            
            _isInitialized = true;
        }

        private void OnEnable()
        {
            // 실시간 주가 갱신 이벤트 구독
            EventBus.Subscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<StockPriceUpdatedEvent>(OnStockPriceUpdated);
        }

        private void Update()
        {
            if (!_isInitialized) return;

            // 1. 성능 최적화: 주가 갱신 요청이 들어온 경우 프레임당 최대 1회만 일괄 재빌드
            if (_isDirty)
            {
                RebuildTickerImmediate();
                _isDirty = false;
            }

            // 2. 부드러운 스크롤 이동 처리
            if (enableScrolling && _textWidth > 0f)
            {
                ScrollMarquee();
            }
        }

        /// <summary>
        /// 인스펙터 색상이 실시간으로 변경될 것에 대비해 16진수 문자열 캐싱을 수행합니다.
        /// </summary>
        private void CacheHexColors()
        {
            _growthHex = ColorUtility.ToHtmlStringRGB(colorGrowth);
            _declineHex = ColorUtility.ToHtmlStringRGB(colorDecline);
            _flatHex = ColorUtility.ToHtmlStringRGB(colorFlat);
        }

        /// <summary>
        /// 초기 시장 데이터로부터 티커 목록을 로드합니다.
        /// </summary>
        private void InitializeTickerData()
        {
            _tickerData.Clear();
            _orderedStockIds.Clear();

            if (MarketManager.Instance == null)
            {
                Debug.LogWarning("[TickerDataBinder] MarketManager 인스턴스를 찾을 수 없습니다. 빈 상태로 초기화합니다.");
                return;
            }

            var listedStocks = MarketManager.Instance.GetListedStocks();
            foreach (var stock in listedStocks)
            {
                string id = stock.StockId;
                long curPrice = stock.CurrentPrice;

                // 직전 틱 대비 변동량 복원 계산 (PriceHistory의 마지막 2개 값을 확인)
                long delta = 0;
                double flucRate = 0.0;

                if (stock.PriceHistory != null && stock.PriceHistory.Count >= 2)
                {
                    long prevPrice = stock.PriceHistory[stock.PriceHistory.Count - 2];
                    delta = curPrice - prevPrice;
                    if (prevPrice != 0)
                    {
                        flucRate = (double)delta / prevPrice * 100.0;
                    }
                }

                _tickerData[id] = new TickerStockState
                {
                    StockId = id,
                    CurrentPrice = curPrice,
                    Delta = delta,
                    FlucRate = flucRate
                };
                _orderedStockIds.Add(id);
            }
        }

        /// <summary>
        /// 실시간 주가 변동 이벤트를 수신하여 캐시를 부분 갱신하고 더티 플래그를 활성화합니다.
        /// </summary>
        private void OnStockPriceUpdated(StockPriceUpdatedEvent e)
        {
            if (string.IsNullOrEmpty(e.StockId)) return;

            string id = e.StockId;
            long newPrice = e.NewPrice;
            long delta = e.Delta;

            if (_tickerData.TryGetValue(id, out var state))
            {
                state.CurrentPrice = newPrice;
                state.Delta = delta;
                
                long prevPrice = newPrice - delta;
                state.FlucRate = prevPrice != 0 ? (double)delta / prevPrice * 100.0 : 0.0;
            }
            else
            {
                // 새로 상장되거나 누락되었던 종목 추가
                long prevPrice = newPrice - delta;
                _tickerData[id] = new TickerStockState
                {
                    StockId = id,
                    CurrentPrice = newPrice,
                    Delta = delta,
                    FlucRate = prevPrice != 0 ? (double)delta / prevPrice * 100.0 : 0.0
                };
                _orderedStockIds.Add(id);
            }

            // 실시간 호출 즉시 빌드를 하지 않고, Update 루프에서 1회 모아서 일괄 처리 (GC 최적화 핵심)
            _isDirty = true;
        }

        /// <summary>
        /// 더티 상태를 해소하며 즉시 텍스트 재조립 및 렌더러 레이아웃 갱신을 원자적으로 수행합니다.
        /// </summary>
        private void RebuildTickerImmediate()
        {
            CacheHexColors(); // 에디터 인스펙터 색상 실시간 변동 대비
            UpdateTickerText();
            RecalculateBounds();
        }

        /// <summary>
        /// 캐시된 모든 상장 주식 정보를 토대로 리치 텍스트 포맷의 문자열을 작성해 바인딩합니다.
        /// </summary>
        private void UpdateTickerText()
        {
            if (_orderedStockIds.Count == 0) return;

            var sb = new StringBuilder();
            
            // 전광판 자연스러운 루프 스크롤링 연출을 위해 목록을 3회 반복 배치하여 빈 공간을 채워줍니다.
            int repeats = enableScrolling ? 3 : 1;

            for (int r = 0; r < repeats; r++)
            {
                for (int i = 0; i < _orderedStockIds.Count; i++)
                {
                    string id = _orderedStockIds[i];
                    if (!_tickerData.TryGetValue(id, out var state)) continue;

                    string indicator = "-";
                    string colorHex = _flatHex;

                    if (state.Delta > 0)
                    {
                        indicator = "▲";
                        colorHex = _growthHex;
                    }
                    else if (state.Delta < 0)
                    {
                        indicator = "▼";
                        colorHex = _declineHex;
                    }

                    // 포맷: ▲ STOCK_ID PRICEG (FLUC_RATE%)
                    string flucSign = state.Delta > 0 ? "+" : "";
                    string stockText = $"{indicator} {state.StockId} {state.CurrentPrice:N0}G ({flucSign}{state.FlucRate:F2}%)";
                    
                    sb.Append("<color=#").Append(colorHex).Append(">").Append(stockText).Append("</color>");

                    if (i < _orderedStockIds.Count - 1 || r < repeats - 1)
                    {
                        sb.Append(separator);
                    }
                }
            }

            string finalText = sb.ToString();

            if (tmpTextComponent != null)
            {
                tmpTextComponent.text = finalText;
            }
            else if (textComponent != null)
            {
                textComponent.text = finalText;
            }
        }

        /// <summary>
        /// 텍스트 컴포넌트의 렌더링 너비를 계산하고 스크롤 임계점을 설정합니다.
        /// </summary>
        public void RecalculateBounds()
        {
            // 부모 마스크 영역 또는 컨테이너의 가로 크기 측정
            var parent = transform.parent as RectTransform;
            if (parent != null)
            {
                _containerWidth = parent.rect.width;
            }
            else
            {
                _containerWidth = Screen.width; // 폴백
            }

            // 렌더링 메시 강제 업데이트로 레이아웃 크기 측정 오차 원천 방지
            if (tmpTextComponent != null)
            {
                tmpTextComponent.ForceMeshUpdate();
                _textWidth = tmpTextComponent.preferredWidth;
            }
            else if (textComponent != null)
            {
                Canvas.ForceUpdateCanvases(); // 레거시 UI 강제 갱신
                _textWidth = textComponent.preferredWidth;
            }
        }

        /// <summary>
        /// 매 프레임 anchoredPosition.x 값을 변화시켜 실시간으로 텍스트를 좌측으로 흐르게 만듭니다.
        /// 리피트 지점에 도달하면 부드럽게 초기 위치로 롤백 연출합니다.
        /// </summary>
        private void ScrollMarquee()
        {
            Vector2 pos = _rectTransform.anchoredPosition;
            pos.x -= scrollSpeed * Time.deltaTime;

            // 텍스트 총 너비의 1/3 (반복 단위의 하나분) 만큼 이동 완료 시 루프 원복하여 끊김 없는 무한 스크롤 완성
            float singleLoopWidth = (_textWidth / 3f);
            
            if (pos.x <= _initialPosition.x - singleLoopWidth)
            {
                // 소수점 잔여분을 포함한 초과 이동 거리를 더하여 팅김(Jittering)을 완벽히 제거
                float overshoot = (_initialPosition.x - singleLoopWidth) - pos.x;
                pos.x = _initialPosition.x - overshoot;
            }

            _rectTransform.anchoredPosition = pos;
        }

        /// <summary>
        /// 외부에서 수동으로 스크롤을 트리거하거나 리셋하고자 할 때 사용 가능한 공용 API
        /// </summary>
        public void ResetPosition()
        {
            if (_rectTransform != null)
            {
                _rectTransform.anchoredPosition = _initialPosition;
            }
        }
    }
}
