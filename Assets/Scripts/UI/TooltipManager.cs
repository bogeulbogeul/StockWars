using UnityEngine;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 모든 아이콘 마우스 오버 시 정보를 뿌려주는 전역 툴팁 시스템.
    /// PrefabLibrary를 사용해 툴팁 UI 프리팹을 동적으로 로드 및 관리하며 마우스 포인터의 위치를 안전하게 추적합니다.
    /// (지연 초기화 및 뷰 바인딩 최적화 버전)
    /// </summary>
    public class TooltipManager : Singleton<TooltipManager>
    {
        [Header("UI Reference Keys")]
        [Tooltip("PrefabLibrary를 통해 로드할 UI 프리팹 이름")]
        [SerializeField] private string tooltipPrefabKey = "UI_Tooltip";

        private RectTransform _tooltipRect;
        private UI_TooltipView _tooltipView;
        private Canvas _canvas;

        // Awake에서는 초기화를 제거하여 싱글톤 간 Awake Race Condition 원천 차단

        /// <summary>
        /// 마우스 오버 시 전역 툴팁을 활성화하고 내용을 갱신합니다.
        /// </summary>
        public void ShowTooltip(string title, string content)
        {
            // 지연 초기화 (Lazy Initialization): 최초 필요 시점에 UI 자동 로드
            if (_tooltipView == null)
            {
                if (!TryInitializeTooltipUI())
                {
                    return;
                }
            }

            _tooltipRect.gameObject.SetActive(true);
            _tooltipView.SetData(title, content);

            // 1. 레이아웃 강제 역순 갱신 (크기 버그 방지)
            _tooltipView.ForceRebuild();

            // 2. 즉시 위치 동기화로 튀는 현상 제거
            UpdatePosition();
        }

        /// <summary>
        /// 툴팁을 화면에서 비활성화 처리합니다.
        /// </summary>
        public void HideTooltip()
        {
            if (_tooltipRect != null)
            {
                _tooltipRect.gameObject.SetActive(false);
            }
        }

        private void Update()
        {
            if (_tooltipRect != null && _tooltipRect.gameObject.activeSelf)
            {
                UpdatePosition();
            }
        }

        /// <summary>
        /// PrefabLibrary를 거쳐 UI_Tooltip 프리팹을 스폰하고 뷰 바인딩 및 캔버스 참조를 안전하게 획득합니다.
        /// (렌더링 레이어 충돌 및 DontDestroyOnLoad 부모 예외 원천 방어 로직 포함)
        /// </summary>
        private bool TryInitializeTooltipUI()
        {
            if (PrefabLibrary.Instance == null)
            {
                Debug.LogError("[TooltipManager] PrefabLibrary 인스턴스가 씬에 존재하지 않아 UI를 초기화할 수 없습니다.");
                return false;
            }

            // 1. DontDestroyOnLoad 부모 종속성 예외 방어:
            // 에디터 상 배치 실수 등으로 다른 UI Panel 하위에 배치되었을 때, 씬 전환 시 파괴되거나 에러가 나지 않도록 루트로 강제 탈출
            if (transform.parent != null)
            {
                Debug.LogWarning($"[TooltipManager] 매니저가 부모 트랜스폼 '{transform.parent.name}'의 자식으로 등록되어 있어, 싱글톤 생존을 위해 부모 관계를 끊고 루트로 복구합니다.");
                transform.SetParent(null);
                DontDestroyOnLoad(gameObject); // 루트로 변경되었으므로 확실하게 생존 조치
            }

            // Spawn<T>를 사용해 루트에 부착된 UI_TooltipView를 안전하게 로드 및 매핑
            _tooltipView = PrefabLibrary.Instance.Spawn<UI_TooltipView>(tooltipPrefabKey, transform);
            if (_tooltipView != null)
            {
                _tooltipRect = _tooltipView.GetComponent<RectTransform>();
                _canvas = _tooltipView.GetComponentInParent<Canvas>();

                // 2. 렌더링 최상단 레이어 충돌 방어 (Sorting Order Conflict Defense):
                // 다른 일반 UI에 툴팁이 뒤로 가려져 보이지 않는 버그를 막기 위해 스크립트 단에서 Canvas 소팅 순서를 9999로 직접 강제 설정
                if (_canvas != null)
                {
                    _canvas.overrideSorting = true;
                    _canvas.sortingOrder = 9999;
                }

                _tooltipView.gameObject.SetActive(false); // 로드 시점에는 숨김 처리
                return true;
            }

            Debug.LogWarning($"[TooltipManager] PrefabLibrary에서 '{tooltipPrefabKey}' 컴포넌트를 가진 툴팁 UI 로드에 실패했습니다.");
            return false;
        }

        /// <summary>
        /// 매 프레임 마우스의 위치를 안전하게 파악하고, 화면 Safe Area 밖으로 삐져나가지 않도록 보정합니다.
        /// </summary>
        private void UpdatePosition()
        {
            if (_tooltipRect == null || _canvas == null) return;

            Vector2 mousePos = Input.mousePosition;

            // 스크린 크기 및 툴팁 크기를 파악하여 마우스와 겹쳐서 가리지 않도록 Pivot 보정 연산
            float pivotX = (mousePos.x + _tooltipRect.rect.width > Screen.width) ? 1.05f : -0.05f;
            float pivotY = (mousePos.y - _tooltipRect.rect.height < 0) ? -0.05f : 1.05f;

            _tooltipRect.pivot = new Vector2(pivotX, pivotY);

            // Canvas의 렌더 모드(Overlay vs Camera)에 따라 화면 좌표계를 스크린 로컬 좌표계로 안전하게 보정하여 할당
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _tooltipRect.parent as RectTransform,
                mousePos,
                _canvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : _canvas.worldCamera,
                out Vector2 localPoint
            );

            _tooltipRect.anchoredPosition = localPoint;
        }
    }
}
