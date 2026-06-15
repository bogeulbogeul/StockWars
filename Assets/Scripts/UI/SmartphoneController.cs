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
        [Header("UI References")]
        [SerializeField] private RectTransform _frameRect;
        [SerializeField] private GameObject _appGrid;
        [SerializeField] private GameObject _appDetailsPanel;
        [SerializeField] private TMPro.TextMeshProUGUI _appTitleText;

        [Header("App Panels")]
        [SerializeField] private GameObject _optionAppPanel;
        [SerializeField] private GameObject _mailAppPanel;
        [SerializeField] private GameObject _memoAppPanel;
        [SerializeField] private GameObject _socialAppPanel;
        [SerializeField] private GameObject _stockAppPanel;
        [SerializeField] private GameObject _achievementAppPanel;

        [Header("Optional UX References")]
        [Tooltip("스마트폰이 열려 있을 때 숨겨질 열기 아이콘 버튼")]
        [SerializeField] private GameObject _toggleButton;
        [Tooltip("스마트폰 외부 영역을 누르면 자동으로 닫히도록 처리하는 전체 화면 패널")]
        [SerializeField] private GameObject _closeClickArea;

        private CanvasGroup _frameCanvasGroup;
        
        private bool _isOpen = false;
        private Coroutine _slideCoroutine;
        private bool _isInitialized = false;

        // 화면 바깥 (아래) 및 안쪽 (위)의 Y축 위치
        [Header("Animation Settings")]
        [SerializeField] private float _closedY = -800f;
        [SerializeField] private float _openedY = -20f;
        [SerializeField] private float _animationDuration = 0.35f;

        private void Start()
        {
            // 인스펙터에서 직접 드래그 앤 드롭으로 배치한 경우 자동 초기화
            if (_frameRect != null && !_isInitialized)
            {
                SetupState();
            }
        }

        public void Initialize(RectTransform frameRect, GameObject appGrid, GameObject appDetailsPanel, TMPro.TextMeshProUGUI appTitleText)
        {
            _frameRect = frameRect;
            _appGrid = appGrid;
            _appDetailsPanel = appDetailsPanel;
            _appTitleText = appTitleText;
            
            SetupState();
        }

        private void SetupState()
        {
            if (_frameRect == null) return;

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

            if (_toggleButton != null) _toggleButton.SetActive(true);
            if (_closeClickArea != null) _closeClickArea.SetActive(false);

            // 시계(StatusBar_Time)가 AppDetailsPanel 자식으로 들어가 있어 홈 화면(AppDetailsPanel 비활성화 시)에서 사라지는 문제 해결을 위해 자동 부모 재설정
            if (_appDetailsPanel != null)
            {
                Transform clockTrans = _appDetailsPanel.transform.Find("StatusBar_Time");
                if (clockTrans != null)
                {
                    clockTrans.SetParent(_frameRect, true);
                    clockTrans.SetAsLastSibling();
                }
            }

            // 초기 화면 셋업 (그리드 켜고, 앱 상세정보 끄기)
            if (_appDetailsPanel != null) _appDetailsPanel.SetActive(false);
            if (_appGrid != null) _appGrid.SetActive(true);
            DeactivateAllAppPanels();

            _isInitialized = true;
        }

        public void OpenApp(string appName)
        {
            if (_appGrid != null) _appGrid.SetActive(false);
            if (_appDetailsPanel != null) _appDetailsPanel.SetActive(true);
            if (_appTitleText != null) _appTitleText.text = appName;

            DeactivateAllAppPanels();

            switch (appName)
            {
                case "옵션":
                    if (_optionAppPanel != null) _optionAppPanel.SetActive(true);
                    break;
                case "메일":
                    if (_mailAppPanel != null) _mailAppPanel.SetActive(true);
                    break;
                case "메모장":
                    if (_memoAppPanel != null) _memoAppPanel.SetActive(true);
                    break;
                case "소셜":
                    if (_socialAppPanel != null) _socialAppPanel.SetActive(true);
                    break;
                case "사이버넷":
                case "주식마켓":
                    if (_stockAppPanel != null) _stockAppPanel.SetActive(true);
                    break;
                case "업적":
                    if (_achievementAppPanel != null) _achievementAppPanel.SetActive(true);
                    break;
            }

            Debug.Log($"[Smartphone] {appName} 앱이 실행되었습니다.");
        }

        public void OnHomeButtonClicked()
        {
            // 앱 상세정보 창이 열려 있으면 닫고 앱 그리드(홈)로 이동
            if (_appDetailsPanel != null && _appDetailsPanel.activeSelf)
            {
                _appDetailsPanel.SetActive(false);
                DeactivateAllAppPanels();
                if (_appGrid != null) _appGrid.SetActive(true);
                Debug.Log("[Smartphone] 앱 화면에서 홈 화면으로 이동합니다.");
            }
        }

        private void DeactivateAllAppPanels()
        {
            if (_optionAppPanel != null) _optionAppPanel.SetActive(false);
            if (_mailAppPanel != null) _mailAppPanel.SetActive(false);
            if (_memoAppPanel != null) _memoAppPanel.SetActive(false);
            if (_socialAppPanel != null) _socialAppPanel.SetActive(false);
            if (_stockAppPanel != null) _stockAppPanel.SetActive(false);
            if (_achievementAppPanel != null) _achievementAppPanel.SetActive(false);
        }

        public void ToggleSmartphone()
        {
            _isOpen = !_isOpen;

            // 폰을 닫을 때 항상 홈 화면(앱 그리드) 상태로 초기화
            if (!_isOpen)
            {
                OnHomeButtonClicked();
            }

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

                if (_toggleButton != null) _toggleButton.SetActive(false);
                if (_closeClickArea != null) _closeClickArea.SetActive(true);
            }
            else
            {
                // 닫힐 때는 클릭 방지
                _frameCanvasGroup.blocksRaycasts = false;
                _frameCanvasGroup.interactable = false;

                if (_toggleButton != null) _toggleButton.SetActive(true);
                if (_closeClickArea != null) _closeClickArea.SetActive(false);
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
