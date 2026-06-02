using UnityEngine;
using UnityEngine.EventSystems;

namespace StockWars.Core
{
    /// <summary>
    /// UI 버튼 또는 특정 클릭 가능한 영역에 부착하여, 
    /// 마우스 오버(Hover) 시 자동으로 CursorManager를 통해 적합한 Cozy 커서(예: 돋보기)로 연동해 주는 편리한 컴포넌트입니다.
    /// </summary>
    public class CursorHoverTrigger : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
    {
        [Header("Cursor Settings")]
        [Tooltip("마우스가 영역 내부로 진입(Hover)했을 때 바꿀 커서 모양. 찌라시 등의 경우 Inspect(돋보기)로 설정합니다.")]
        [SerializeField] private CursorManager.CursorType _hoverCursor = CursorManager.CursorType.Default;

        private bool _isHovered = false;

        public void OnPointerEnter(PointerEventData eventData)
        {
            _isHovered = true;
            if (CursorManager.Instance != null)
            {
                CursorManager.Instance.SetCursor(_hoverCursor);
            }
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            _isHovered = false;
            if (CursorManager.Instance != null)
            {
                CursorManager.Instance.ResetToDefault();
            }
        }

        private void OnDisable()
        {
            // 오브젝트가 갑자기 꺼지는 비정상 비활성화 시 커서 꼬임 현상 원천 차단
            if (_isHovered && CursorManager.Instance != null)
            {
                CursorManager.Instance.ResetToDefault();
            }
            _isHovered = false;
        }
    }
}
