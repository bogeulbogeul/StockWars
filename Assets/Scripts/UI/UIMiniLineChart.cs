using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// Unity UI Image 컴포넌트들을 연결하여 실시간 선형 차트(Line Chart)를 렌더링하는 컴포넌트입니다.
    /// 별도 라이브러리 의존성 없이 가볍고 부드럽게 작동합니다.
    /// </summary>
    public class UIMiniLineChart : MonoBehaviour
    {
        [Header("Chart Settings")]
        [SerializeField] private Color lineColor = new Color(0.13f, 0.77f, 0.37f, 1f); // 기본 상승 초록색
        [SerializeField] private float thickness = 2.5f;

        private List<Image> activeSegments = new List<Image>();
        private List<Image> segmentPool = new List<Image>();
        private Sprite lineSprite;

        public void SetColor(Color color)
        {
            lineColor = color;
        }

        /// <summary>
        /// 데이터 포인트 리스트를 전달받아 RectTransform 크기에 맞춰 차트를 그립니다.
        /// </summary>
        public void DrawChart(List<long> dataPoints)
        {
            // 기존에 활성화된 선분 오브젝트들 풀링 처리
            foreach (var segment in activeSegments)
            {
                segment.gameObject.SetActive(false);
                segmentPool.Add(segment);
            }
            activeSegments.Clear();

            if (dataPoints == null || dataPoints.Count < 2) return;

            RectTransform rectTransform = GetComponent<RectTransform>();
            float width = rectTransform.rect.width;
            float height = rectTransform.rect.height;

            // 최댓값, 최솟값 탐색
            long minVal = long.MaxValue;
            long maxVal = long.MinValue;
            foreach (var val in dataPoints)
            {
                if (val < minVal) minVal = val;
                if (val > maxVal) maxVal = val;
            }

            long range = maxVal - minVal;
            if (range == 0) range = 1; // 0 나누기 방지

            float stepX = width / (dataPoints.Count - 1);

            // 선 그리기용 2x2 흰색 텍스처 동적 생성 (폴백 스프라이트)
            if (lineSprite == null)
            {
                Texture2D tex = new Texture2D(2, 2);
                tex.SetPixel(0, 0, Color.white);
                tex.SetPixel(0, 1, Color.white);
                tex.SetPixel(1, 0, Color.white);
                tex.SetPixel(1, 1, Color.white);
                tex.Apply();
                lineSprite = Sprite.Create(tex, new Rect(0, 0, 2, 2), new Vector2(0.5f, 0.5f));
            }

            Vector2 lastPoint = Vector2.zero;

            for (int i = 0; i < dataPoints.Count; i++)
            {
                float normY = (float)(dataPoints[i] - minVal) / range;
                float x = i * stepX;
                float y = normY * height;

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
            if (segmentPool.Count > 0)
            {
                segment = segmentPool[segmentPool.Count - 1];
                segmentPool.RemoveAt(segmentPool.Count - 1);
                segment.gameObject.SetActive(true);
            }
            else
            {
                GameObject go = new GameObject("LineSegment", typeof(Image));
                go.transform.SetParent(transform, false);
                segment = go.GetComponent<Image>();
                segment.sprite = lineSprite;
                
                // 마스크 등에 걸리지 않고 정상 작동하도록 UI 디폴트 머티리얼 적용
                segment.material = Canvas.GetDefaultCanvasMaterial();
            }

            activeSegments.Add(segment);
            segment.color = lineColor;

            RectTransform rt = segment.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.zero;
            rt.pivot = new Vector2(0f, 0.5f); // 시작점을 기준으로 회전 설정

            Vector2 dir = end - start;
            float distance = dir.magnitude;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;

            rt.anchoredPosition = start;
            rt.sizeDelta = new Vector2(distance, thickness);
            rt.localRotation = Quaternion.Euler(0, 0, angle);
        }
    }
}
