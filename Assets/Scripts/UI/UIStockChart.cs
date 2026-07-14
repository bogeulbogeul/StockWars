using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;

namespace StockWars.UI
{
    /// <summary>
    /// 그라데이션 영역 채우기(UIGradientAreaChart), 주가 실선 그리기, Y축/X축 라벨 및 그리드 라인을
    /// 원스톱으로 관리하여 고품격 주식 그래프를 렌더링하고, 클릭 시 상세 팝업을 띄우는 통합 컴포넌트입니다.
    /// </summary>
    public class UIStockChart : MonoBehaviour, IPointerClickHandler
    {
        [Header("Components")]
        [Tooltip("차트 하단 그라데이션 채우기 컴포넌트")]
        [SerializeField] private UIGradientAreaChart _areaChart;

        [Tooltip("선 세그먼트 이미지들이 생성될 컨테이너 (비워두면 본인 오브젝트 아래에 생성)")]
        [SerializeField] private RectTransform _lineChartParent;

        [Header("Axes & Labels (Optional)")]
        [Tooltip("Y축 가격 라벨들 (아래에서 위 순서대로 배치 권장)")]
        [SerializeField] private List<TMP_Text> _yLabels = new List<TMP_Text>();

        [Tooltip("X축 시간 라벨들 (왼쪽에서 오른쪽 순서대로 배치 권장)")]
        [SerializeField] private List<TMP_Text> _xLabels = new List<TMP_Text>();

        [Tooltip("X축 라벨 간의 시간 간격 (분)")]
        [SerializeField] private float _timeSpacingMinutes = 15f;

        [Header("Line Visual Settings")]
        [SerializeField] private Color _lineColor = new Color(0.13f, 0.77f, 0.37f, 1f); // 기본 상승 초록
        [SerializeField] private float _thickness = 3f;

        [Header("Area Gradient Settings")]
        [SerializeField] private Color _gradientTopColor = new Color(0.13f, 0.77f, 0.37f, 0.35f);
        [SerializeField] private Color _gradientBottomColor = new Color(0.13f, 0.77f, 0.37f, 0f);

        [Header("Padding Settings")]
        [Range(0f, 0.3f)]
        [SerializeField] private float _verticalPaddingPercent = 0.12f; // 상하 여백 12%
        [Range(0f, 0.3f)]
        [SerializeField] private float _leftPaddingPercent = 0.14f;     // 좌측 여백 14% (Y축 가격 라벨 침범 방지)
        [Range(0f, 0.3f)]
        [SerializeField] private float _rightPaddingPercent = 0.04f;    // 우측 여백 4%

        private List<Image> _activeSegments = new List<Image>();
        private List<Image> _segmentPool = new List<Image>();
        private Sprite _lineSprite;
        private string _currentStockId;
        private List<long> _currentDataPoints = new List<long>();

        private void Awake()
        {
            if (_lineChartParent == null)
            {
                _lineChartParent = GetComponent<RectTransform>();
            }

            if (_areaChart == null)
            {
                _areaChart = GetComponentInChildren<UIGradientAreaChart>(true);
            }
        }

        /// <summary>
        /// 차트를 그릴 주식 ID와 데이터 포인트를 바인딩하여 렌더링을 시작합니다.
        /// </summary>
        public void DrawChart(string stockId, List<long> dataPoints)
        {
            _currentStockId = stockId;
            _currentDataPoints = dataPoints;

            // 기존 선분 오브젝트들 풀링 처리
            foreach (var segment in _activeSegments)
            {
                segment.gameObject.SetActive(false);
                _segmentPool.Add(segment);
            }
            _activeSegments.Clear();

            if (dataPoints == null || dataPoints.Count < 2)
            {
                if (_areaChart != null) _areaChart.SetPoints(new List<float>());
                return;
            }

            RectTransform rectTransform = GetComponent<RectTransform>();
            float width = rectTransform.rect.width;
            float height = rectTransform.rect.height;

            // 1. 가격 최댓값, 최솟값 탐색
            long minVal = long.MaxValue;
            long maxVal = long.MinValue;
            foreach (var val in dataPoints)
            {
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }

            long range = maxVal - minVal;
            if (range == 0) range = 1;

            // 2. Y축 가격 라벨 업데이트 (동적 바인딩)
            if (_yLabels != null && _yLabels.Count > 0)
            {
                int yCount = _yLabels.Count;
                for (int i = 0; i < yCount; i++)
                {
                    if (_yLabels[i] == null) continue;
                    // 인덱스 0이 가장 아래(최솟값), 마지막 인덱스가 가장 위(최댓값)라고 가정
                    long labelVal = minVal + (range * i / (yCount - 1));
                    _yLabels[i].text = FormatPriceCompact(labelVal);
                }
            }

            // 3. X축 시간 라벨 업데이트 (시스템 시간 기준 동적 생성)
            if (_xLabels != null && _xLabels.Count > 0)
            {
                int xCount = _xLabels.Count;
                DateTime baseTime = DateTime.Now;
                for (int i = 0; i < xCount; i++)
                {
                    if (_xLabels[i] == null) continue;
                    // 인덱스 0이 가장 과거(왼쪽), 마지막 인덱스가 현재(오른쪽, Now)
                    int minutesBack = (xCount - 1 - i) * (int)_timeSpacingMinutes;
                    _xLabels[i].text = baseTime.AddMinutes(-minutesBack).ToString("HH:mm");
                }
            }

            // 4. 그라데이션 채우기 좌표 계산 및 드로우
            List<float> normalizedPoints = new List<float>();

            for (int i = 0; i < dataPoints.Count; i++)
            {
                float normY = (float)(dataPoints[i] - minVal) / range;
                normalizedPoints.Add(normY);
            }

            if (_areaChart != null)
            {
                _areaChart.SetColors(_gradientTopColor, _gradientBottomColor);
                _areaChart.SetPoints(normalizedPoints);
            }

            // 5. 주가 실선(Line Segment) 렌더링
            if (_lineSprite == null)
            {
                Texture2D tex = new Texture2D(2, 2);
                for (int y = 0; y < 2; y++)
                    for (int x = 0; x < 2; x++)
                        tex.SetPixel(x, y, Color.white);
                tex.Apply();
                _lineSprite = Sprite.Create(tex, new Rect(0, 0, 2, 2), new Vector2(0.5f, 0.5f));
            }

            float verticalPadding = height * _verticalPaddingPercent;
            float leftPadding = width * _leftPaddingPercent;
            float rightPadding = width * _rightPaddingPercent;
            float usableHeight = height - (verticalPadding * 2f);
            float usableWidth = width - leftPadding - rightPadding;
            float stepX = usableWidth / (dataPoints.Count - 1);

            Vector2 lastPoint = Vector2.zero;
            for (int i = 0; i < dataPoints.Count; i++)
            {
                float x = leftPadding + (i * stepX);
                float y = verticalPadding + (normalizedPoints[i] * usableHeight);
                Vector2 currentPoint = new Vector2(x, y);

                if (i > 0)
                {
                    DrawSegment(lastPoint, currentPoint);
                }

                lastPoint = currentPoint;
            }
        }

        private void DrawSegment(Vector2 start, Vector2 end)
        {
            Image segment;
            if (_segmentPool.Count > 0)
            {
                segment = _segmentPool[_segmentPool.Count - 1];
                _segmentPool.RemoveAt(_segmentPool.Count - 1);
                segment.gameObject.SetActive(true);
            }
            else
            {
                GameObject go = new GameObject("LineSegment", typeof(Image));
                go.transform.SetParent(_lineChartParent, false);
                segment = go.GetComponent<Image>();
                segment.sprite = _lineSprite;
                segment.material = Canvas.GetDefaultCanvasMaterial();
            }

            _activeSegments.Add(segment);
            segment.color = _lineColor;

            RectTransform rt = segment.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.zero;
            rt.pivot = new Vector2(0f, 0.5f);

            Vector2 dir = end - start;
            float distance = dir.magnitude;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;

            rt.anchoredPosition = start;
            rt.sizeDelta = new Vector2(distance, _thickness);
            rt.localRotation = Quaternion.Euler(0, 0, angle);
        }

        public void SetColor(Color lineColor, Color topGrad, Color bottomGrad)
        {
            _lineColor = lineColor;
            _gradientTopColor = topGrad;
            _gradientBottomColor = bottomGrad;
        }

        /// <summary>
        /// 그래프 클릭 감지 시 컨트롤러를 호출하여 상세 차트 팝업창을 엽니다.
        /// </summary>
        public void OnPointerClick(PointerEventData eventData)
        {
            if (string.IsNullOrEmpty(_currentStockId)) return;

            Debug.Log($"[UIStockChart] 차트 클릭됨! 종목: {_currentStockId}");
            
            StockMarketAppController controller = GetComponentInParent<StockMarketAppController>();
            if (controller == null)
            {
                controller = FindAnyObjectByType<StockMarketAppController>();
            }

            if (controller != null)
            {
                controller.ShowDetailedChartPopup(_currentStockId);
            }
            else
            {
                Debug.LogWarning("[UIStockChart] StockMarketAppController를 찾을 수 없습니다.");
            }
        }

        /// <summary>
        /// 가격이 지나치게 커졌을 때 텍스트가 차트를 침범하지 않도록 K, M, B 단위로 변환해 표기합니다.
        /// </summary>
        private string FormatPriceCompact(long value)
        {
            if (value >= 1000000000) // 10억 이상 (1B)
            {
                return (value / 1000000000f).ToString("0.##") + "B";
            }
            if (value >= 1000000) // 100만 이상 (1M)
            {
                return (value / 1000000f).ToString("0.##") + "M";
            }
            if (value >= 10000) // 1만 이상 (10K)
            {
                return (value / 1000f).ToString("0.#") + "K";
            }
            return value.ToString("N0"); // 그 미만은 일반 콤마 표기 (예: 9,999)
        }
    }
}
