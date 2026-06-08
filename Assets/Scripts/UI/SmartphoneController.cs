using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// 스마트폰 UI 프레임의 슬라이드업 애니메이션 및 상태를 관리하는 컨트롤러입니다.
    /// </summary>
    public class SmartphoneController : MonoBehaviour
    {
        private RectTransform _frameRect;
        private CanvasGroup _frameCanvasGroup;
        
        private bool _isOpen = false;
        private Coroutine _slideCoroutine;

        // 화면 바깥 (아래) 및 안쪽 (위)의 Y축 위치
        private float _closedY = -800f;
        private float _openedY = -20f;
        private float _animationDuration = 0.35f;

        public void Initialize(RectTransform frameRect)
        {
            _frameRect = frameRect;
            
            // CanvasGroup 부착 (페이드 인/아웃 효과를 위해)
            _frameCanvasGroup = _frameRect.GetComponent<CanvasGroup>();
            if (_frameCanvasGroup == null)
                _frameCanvasGroup = _frameRect.gameObject.AddComponent<CanvasGroup>();

            // 초기 상태는 닫힘 (화면 밖, 투명도 0)
            _isOpen = false;
            _frameRect.anchoredPosition = new Vector2(_frameRect.anchoredPosition.x, _closedY);
            _frameCanvasGroup.alpha = 0f;
            _frameCanvasGroup.interactable = false;
            _frameCanvasGroup.blocksRaycasts = false;
        }

        public void ToggleSmartphone()
        {
            _isOpen = !_isOpen;

            if (_slideCoroutine != null)
                StopCoroutine(_slideCoroutine);

            _slideCoroutine = StartCoroutine(SlideAnimation(_isOpen));
        }

        private IEnumerator SlideAnimation(bool open)
        {
            float elapsed = 0f;
            Vector2 startPos = _frameRect.anchoredPosition;
            Vector2 targetPos = new Vector2(startPos.x, open ? _openedY : _closedY);
            float startAlpha = _frameCanvasGroup.alpha;
            float targetAlpha = open ? 1f : 0f;

            if (open)
            {
                // 열릴 때는 바로 클릭 가능하도록 설정
                _frameCanvasGroup.blocksRaycasts = true;
                _frameCanvasGroup.interactable = true;
            }
            else
            {
                // 닫힐 때는 클릭 방지
                _frameCanvasGroup.blocksRaycasts = false;
                _frameCanvasGroup.interactable = false;
            }

            while (elapsed < _animationDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / _animationDuration;
                
                // 부드러운 감속 이징(Ease Out Cubic) 적용
                float easeOutT = 1f - Mathf.Pow(1f - t, 3f);

                _frameRect.anchoredPosition = Vector2.Lerp(startPos, targetPos, easeOutT);
                _frameCanvasGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, easeOutT);
                
                yield return null;
            }

            _frameRect.anchoredPosition = targetPos;
            _frameCanvasGroup.alpha = targetAlpha;
        }
    }
}
