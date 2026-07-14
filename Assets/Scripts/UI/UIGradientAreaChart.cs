using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// 주식 차트 아래쪽 영역을 반투명 그라데이션으로 채워주는 UI 메쉬 컴포넌트입니다.
    /// 성능 최적화를 위해 OnPopulateMesh를 오버라이드하여 단일 드로우 콜로 렌더링합니다.
    /// </summary>
    [RequireComponent(typeof(CanvasRenderer))]
    public class UIGradientAreaChart : MaskableGraphic
    {
        private List<float> _normalizedPoints = new List<float>();

        [Header("Gradient Colors")]
        [SerializeField] private Color _topColor = new Color(0f, 0.92f, 1f, 0.4f);   // 위쪽: 선명한 네온 하늘색 (알파 40%)
        [SerializeField] private Color _bottomColor = new Color(0f, 0.92f, 1f, 0f);  // 아래쪽: 완전 투명 (알파 0%)

        public void SetPoints(List<float> normalizedPoints)
        {
            _normalizedPoints = normalizedPoints;
            SetVerticesDirty(); // 메쉬를 갱신하도록 플래그 설정
        }

        public void SetColors(Color topColor, Color bottomColor)
        {
            _topColor = topColor;
            _bottomColor = bottomColor;
            SetVerticesDirty();
        }

        protected override void OnPopulateMesh(VertexHelper vh)
        {
            vh.Clear();
            if (_normalizedPoints == null || _normalizedPoints.Count < 2) return;

            RectTransform rectTrans = rectTransform;
            float width = rectTrans.rect.width;
            float height = rectTrans.rect.height;
            float stepX = width / (_normalizedPoints.Count - 1);

            // 1. 모든 정점(Vertices) 추가
            for (int i = 0; i < _normalizedPoints.Count; i++)
            {
                float x = i * stepX;
                float y = Mathf.Clamp01(_normalizedPoints[i]) * height;

                // 바닥점 정점 (투명)
                UIVertex vertexBottom = UIVertex.simpleVert;
                vertexBottom.position = new Vector3(x, 0, 0);
                vertexBottom.color = _bottomColor;
                vh.AddVert(vertexBottom);

                // 상단 주가점 정점 (반투명)
                UIVertex vertexTop = UIVertex.simpleVert;
                vertexTop.position = new Vector3(x, y, 0);
                vertexTop.color = _topColor;
                vh.AddVert(vertexTop);
            }

            // 2. 인접한 두 열의 정점들을 사각형(두 개의 삼각형)으로 채우기
            for (int i = 0; i < _normalizedPoints.Count - 1; i++)
            {
                int baseIdx = i * 2;

                // 첫 번째 삼각형 (바닥i -> 상단i -> 상단i+1)
                vh.AddTriangle(baseIdx, baseIdx + 1, baseIdx + 3);
                // 두 번째 삼각형 (바닥i -> 상단i+1 -> 바닥i+1)
                vh.AddTriangle(baseIdx, baseIdx + 3, baseIdx + 2);
            }
        }
    }
}
