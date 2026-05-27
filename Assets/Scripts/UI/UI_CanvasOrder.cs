using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// UI 캔버스들의 그리기 순서(Sorting Order) 체계를 열거형(Enum) 단위로 분류해 규격화하고,
    /// 비활성화된 UI의 GraphicRaycaster를 차단하여 유니티 UI 이벤트 엔진의 CPU 마우스 레이캐스팅 오버헤드를 극소화하는 최적화 컴포넌트.
    /// </summary>
    [RequireComponent(typeof(Canvas))]
    public class UI_CanvasOrder : MonoBehaviour
    {
        public enum CanvasLayerType
        {
            Background = 0,         // 배경 및 장식용 캔버스 (0 ~ 9)
            MainHUD = 10,           // 게임 내 메인 플레이 HUD 영역 (10 ~ 99)
            Popup = 100,            // 모달, 알림창, 구매/판매 팝업 등 (100 ~ 199)
            Alert = 200,            // 시스템 예외/경고창 및 긴급 얼럿 (200 ~ 299)
            Transition = 300        // 씬 페이드 아웃/블랙 스크린 연출 전용 (300 이상)
        }

        [Header("캔버스 그룹 및 레이어 레이아웃")]
        [SerializeField] private CanvasLayerType _layerType = CanvasLayerType.Popup;
        
        [Tooltip("해당 레이어 내에서의 상대적 정렬 우선순위입니다.")]
        [Range(-9, 9)]
        [SerializeField] private int _relativeOrder = 0;

        [Header("최적화 옵션")]
        [Tooltip("체크 시 스크립트 시작 시 Canvas 컴포넌트에 맞춰 GraphicRaycaster를 자동 동기화합니다.")]
        [SerializeField] private bool _autoSyncRaycaster = true;

        private Canvas _canvas;
        private GraphicRaycaster _raycaster;

        /// <summary>
        /// 관리 대상 캔버스 컴포넌트를 반환합니다.
        /// </summary>
        public Canvas TargetCanvas
        {
            get
            {
                if (_canvas == null) _canvas = GetComponent<Canvas>();
                return _canvas;
            }
        }

        private void Awake()
        {
            _canvas = GetComponent<Canvas>();
            _raycaster = GetComponent<GraphicRaycaster>();

            // 유니티 캔버스 드로우콜 배칭(Batching) 최적화를 위해 오버라이드 카메라 설정
            if (_canvas.renderMode == RenderMode.ScreenSpaceOverlay)
            {
                // 필요시 월드 스페이스나 카메라 모드로 전환 유연성 보장
            }

            ApplySortingOrder();
        }

        private void OnEnable()
        {
            SyncRaycasterState(true);
        }

        private void OnDisable()
        {
            SyncRaycasterState(false);
        }

        /// <summary>
        /// 인스펙터 속성 실시간 반영용 (유니티 에디터 편집 편의 제공)
        /// </summary>
        private void OnValidate()
        {
            if (_canvas == null) _canvas = GetComponent<Canvas>();
            ApplySortingOrder();
        }

        /// <summary>
        /// 레이어 정렬 순서를 지정한 공식에 맞추어 완전 재분배합니다.
        /// </summary>
        public void ApplySortingOrder()
        {
            if (TargetCanvas == null) return;

            // 추가적인 캔버스 계층 렌더링 무결성을 위해 overrideSorting 설정 강제 적용
            _canvas.overrideSorting = true;

            // 최종 정렬 순서 계산 공식 = 베이스 레이어 시작 정렬값 + 상대적 오프셋
            int finalOrder = (int)_layerType + _relativeOrder;
            _canvas.sortingOrder = finalOrder;
        }

        /// <summary>
        /// 캔버스 가시성을 완전히 끄거나 켜면서 성능 최적화를 병행하는 외부 API입니다.
        /// GameObject.SetActive(false) 대신 canvas.enabled = false를 쓸 때 GraphicRaycaster 잔여 부하를 차단합니다.
        /// </summary>
        /// <param name="isVisible">가시성 활성화 여부</param>
        public void SetCanvasVisible(bool isVisible)
        {
            if (TargetCanvas != null)
            {
                _canvas.enabled = isVisible;
            }

            SyncRaycasterState(isVisible);
            Debug.Log($"[UI_CanvasOrder] 캔버스 가시성 제어: {gameObject.name} -> {isVisible} (Raycaster: {isVisible})");
        }

        /// <summary>
        /// GraphicRaycaster를 켜고 끔으로써 유니티 EventSystem이 매 프레임 실행하는 마우스 포인팅 체크 루틴을 최적화합니다.
        /// </summary>
        private void SyncRaycasterState(bool isEnabled)
        {
            if (!_autoSyncRaycaster) return;

            if (_raycaster == null)
            {
                _raycaster = GetComponent<GraphicRaycaster>();
            }

            if (_raycaster != null)
            {
                // 캔버스 가시성이 켜질 때만 물리 레이캐스터 작동을 허용
                _raycaster.enabled = isEnabled;
            }
        }
    }
}
