using UnityEngine;
using UnityEngine.EventSystems;

namespace StockWars.UI
{
    /// <summary>
    /// UI 요소들에 추가하여 마우스 진입/이탈 이벤트를 감지하고
    /// 전역 TooltipManager를 호출해 툴팁을 활성화하는 컴포넌트.
    /// </summary>
    public class TooltipTrigger : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
    {
        [Header("Tooltip Content Details")]
        [Tooltip("툴팁의 상단 굵은 제목")]
        [SerializeField] private string title;

        [Tooltip("툴팁의 본문 상세 내용")]
        [TextArea(3, 10)]
        [SerializeField] private string content;

        [Header("Hover Delay Configuration")]
        [Tooltip("마우스가 들어왔을 때 즉시 툴팁을 띄울지, 혹은 살짝 지연시간을 가질지 여부 (초 단위)")]
        [Range(0f, 2f)]
        [SerializeField] private float hoverDelay = 0.15f;

        private float _hoverTimer = 0f;
        private bool _isHovering = false;

        public void OnPointerEnter(PointerEventData eventData)
        {
            _isHovering = true;
            _hoverTimer = hoverDelay;

            // 지연 시간이 0인 경우 즉시 출력
            if (hoverDelay <= 0f)
            {
                TriggerShowTooltip();
            }
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            ResetHoverState();
            TriggerHideTooltip();
        }

        private void Update()
        {
            if (_isHovering && hoverDelay > 0f)
            {
                _hoverTimer -= Time.unscaledDeltaTime; // 배속 영향 없이 실제 체감 시간 기준으로 차감
                if (_hoverTimer <= 0f)
                {
                    _isHovering = false; // 타이머 만료 시 루프 해제 후 출력
                    TriggerShowTooltip();
                }
            }
        }

        private void OnDisable()
        {
            // UI가 강제로 꺼지거나(SetActive(false)), 파괴될 때 툴팁이 굳은 채로 남는 버그 방지
            ResetHoverState();
            TriggerHideTooltip();
        }

        private void ResetHoverState()
        {
            _isHovering = false;
            _hoverTimer = 0f;
        }

        private void TriggerShowTooltip()
        {
            if (TooltipManager.Instance != null)
            {
                TooltipManager.Instance.ShowTooltip(title, content);
            }
        }

        private void TriggerHideTooltip()
        {
            if (TooltipManager.Instance != null)
            {
                TooltipManager.Instance.HideTooltip();
            }
        }
    }
}
