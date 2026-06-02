using UnityEngine;
using UnityEngine.EventSystems;

namespace StockWars.Core
{
    /// <summary>
    /// UI 버튼 또는 클릭 가능한 UI 패널에 부착하여,
    /// 마우스 클릭 시 버튼 자체가 물리적으로 스무스하게 쏙 들어가는(0.95x 스케일 축소) 
    /// 찰진 물리 피드백과 쫄깃한 조작감을 제공하는 고성능 코지 UI 도구입니다.
    /// </summary>
    public class CozyButtonPress : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerEnterHandler, IPointerExitHandler
    {
        [Header("Scale Animation Settings")]
        [Tooltip("마우스를 올려 놓았을 때(Hover) 살짝 떠오르는 크기 배율")]
        [SerializeField] private float _hoverScale = 1.03f;

        [Tooltip("마우스로 꾹 눌렀을 때(Press) 물리적으로 눌리는 크기 배율")]
        [SerializeField] private float _pressedScale = 0.95f;

        [Tooltip("크기 보간 애니메이션 속도")]
        [SerializeField] private float _transitionSpeed = 15f;

        private Vector3 _originalScale;
        private Vector3 _targetScale;

        private void Awake()
        {
            _originalScale = transform.localScale;
            _targetScale = _originalScale;
        }

        private void Update()
        {
            // 프레임마다 스무스하게 Lerp하여 스프링 같은 기분 좋은 물리 튕김감을 줍니다.
            transform.localScale = Vector3.Lerp(transform.localScale, _targetScale, Time.unscaledDeltaTime * _transitionSpeed);
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            // 꾹 누르면 작아지며 아래로 쏙 눌림 연출
            _targetScale = _originalScale * _pressedScale;
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            // 마우스를 뗄 때, 마우스가 여전히 버튼 위에 있으면 호버 크기로 원복, 밖으로 나갔으면 오리지널 크기로 원복
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                transform as RectTransform, 
                eventData.position, 
                eventData.pressEventCamera, 
                out Vector2 localPoint
            );

            bool isInside = (transform as RectTransform).rect.Contains(localPoint);
            _targetScale = isInside ? _originalScale * _hoverScale : _originalScale;
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            // 호버 시 아주 은은하게 1.03배 커지며 버튼 부각
            _targetScale = _originalScale * _hoverScale;
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            // 영역을 벗어나면 평소 크기로 차분히 원복
            _targetScale = _originalScale;
        }

        private void OnDisable()
        {
            // 팝업이 닫히는 등의 상황에서 스케일 꼬임 원천 차단
            transform.localScale = _originalScale;
            _targetScale = _originalScale;
        }
    }
}
