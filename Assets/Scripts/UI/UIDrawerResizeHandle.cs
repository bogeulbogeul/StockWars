using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// 오피스 카탈로그 패널 상단 경계선 드래그 세로 리사이즈 및 메인 카메라 적응형 프레이밍 컨트롤러.
    /// <para>
    /// - 화면 하단 카탈로그 패널 상단 분리선을 위/아래로 드래그 시 패널 세로 높이(Height / SizeDelta.Y)가 세련되게 조절됩니다.
    /// - 오피스 건물이 화면에서 이탈하거나 하늘 배경이 뚫리지 않도록 카메라 줌(4.5 ~ 5.4) 및 Y 오프셋(1.2 ~ 2.05)을 정밀 제한합니다.
    /// - 핸들 더블클릭 시 최저 높이(110px) / 기본 높이(280px)로 원터치 토글됩니다.
    /// </para>
    /// </summary>
    public class UIDrawerResizeHandle : MonoBehaviour, IDragHandler, IBeginDragHandler, IEndDragHandler, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
    {
        [Header("Target Panel & Camera References")]
        [SerializeField] private RectTransform _targetPanelRect;
        [SerializeField] private Camera _targetCamera;

        [Header("Panel Height Boundaries (SizeDelta Y)")]
        [SerializeField] private float _minHeight = 110f;      // 최저 높이 (카테고리 탭만 보임)
        [SerializeField] private float _defaultHeight = 280f;  // 기본 높이 (카탈로그 1줄 보임)
        [SerializeField] private float _maxHeight = 400f;       // 최대 높이 (카탈로그 패널 적정 확장)

        [Header("Camera Adaptive Framing Settings (안전 프레이밍 범위)")]
        [SerializeField] private float _minCameraSize = 4.5f;    // 패널 최소 높이(110px) 시 줌 인
        [SerializeField] private float _defaultCameraSize = 5.0f;// 기본 상태 줌
        [SerializeField] private float _maxCameraSize = 5.4f;    // 패널 최대 높이(400px) 시 줌 아웃

        [SerializeField] private float _minCameraY = 1.20f;      // 패널 최소 높이 시 카메라 Y
        [SerializeField] private float _defaultCameraY = 1.65f;  // 기본 상태 카메라 Y
        [SerializeField] private float _maxCameraY = 2.05f;      // 패널 최대 높이 시 카메라 Y

        [Header("Visual Feedback Settings")]
        [SerializeField] private Image _handleGripImage;
        [SerializeField] private Color _normalGripColor = new Color(0.96f, 0.78f, 0.38f, 0.85f); // 고급 골드 분리선
        [SerializeField] private Color _hoverGripColor = new Color(1.0f, 0.88f, 0.45f, 1.0f);   // 하이라이트 골드
        [SerializeField] private Color _dragGripColor = new Color(0.25f, 0.90f, 0.50f, 1.0f);   // 에메랄드 그린

        private Canvas _parentCanvas;
        private Vector2 _dragStartPointerPos;
        private float _dragStartHeight;
        private float _lastClickTime = 0f;
        private const float DOUBLE_CLICK_TIME = 0.35f;
        private bool _isDragging = false;

        private void Awake()
        {
            AutoAssignReferences();
            _parentCanvas = GetComponentInParent<Canvas>();
            EnsureVisualGripBar();
        }

        private void AutoAssignReferences()
        {
            if (_targetPanelRect == null)
            {
                var drawer = transform.Find("CatalogDrawerPanel");
                if (drawer != null) _targetPanelRect = drawer.GetComponent<RectTransform>();
                if (_targetPanelRect == null && transform.name == "CatalogDrawerPanel") _targetPanelRect = GetComponent<RectTransform>();
                if (_targetPanelRect == null) _targetPanelRect = GetComponentInParent<RectTransform>();
            }

            if (_targetCamera == null)
            {
                _targetCamera = Camera.main;
            }
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            AutoAssignReferences();
        }
#endif

        private void Start()
        {
            if (_targetPanelRect != null)
            {
                // 패널 하단 밀착 고정 (Y 오프셋 0으로 바닥 밀착)
                Vector2 pos = _targetPanelRect.anchoredPosition;
                _targetPanelRect.anchoredPosition = new Vector2(pos.x, 0f);

                ApplyHeightAndZoom(_targetPanelRect.sizeDelta.y);
            }
        }

        /// <summary>
        /// 핸들 드래그 시작 시 초기 마우스 좌표 및 패널 초기 높이 저장
        /// </summary>
        public void OnBeginDrag(PointerEventData eventData)
        {
            if (_targetPanelRect == null) return;
            _isDragging = true;
            _dragStartPointerPos = eventData.position;
            _dragStartHeight = _targetPanelRect.sizeDelta.y;

            if (_handleGripImage != null) _handleGripImage.color = _dragGripColor;
        }

        /// <summary>
        /// 드래그 중: 패널 높이 확장/축소 및 메인 카메라 줌 인/아웃 실시간 연동
        /// </summary>
        public void OnDrag(PointerEventData eventData)
        {
            if (_targetPanelRect == null) return;

            float canvasScale = 1.0f;
            if (_parentCanvas != null && _parentCanvas.scaleFactor > 0f)
            {
                canvasScale = _parentCanvas.scaleFactor;
            }

            float deltaY = (eventData.position.y - _dragStartPointerPos.y) / canvasScale;
            float newHeight = Mathf.Clamp(_dragStartHeight + deltaY, _minHeight, _maxHeight);

            ApplyHeightAndZoom(newHeight);
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            _isDragging = false;
            if (_handleGripImage != null) _handleGripImage.color = _normalGripColor;
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (!_isDragging && _handleGripImage != null)
            {
                _handleGripImage.color = _hoverGripColor;
            }
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            if (!_isDragging && _handleGripImage != null)
            {
                _handleGripImage.color = _normalGripColor;
            }
        }

        /// <summary>
        /// 핸들 더블클릭 시 최저 높이 / 기본 높이 원터치 토글 전환
        /// </summary>
        public void OnPointerClick(PointerEventData eventData)
        {
            if (Time.time - _lastClickTime < DOUBLE_CLICK_TIME)
            {
                if (_targetPanelRect != null)
                {
                    float currentH = _targetPanelRect.sizeDelta.y;
                    float targetH = (Mathf.Abs(currentH - _minHeight) < 25f) ? _defaultHeight : _minHeight;
                    ApplyHeightAndZoom(targetH);
                }
            }
            _lastClickTime = Time.time;
        }

        /// <summary>
        /// 패널 세로 높이(SizeDelta Y) 변경 및 카메라 안전 줌/Y 연동
        /// </summary>
        public void ApplyHeightAndZoom(float height)
        {
            height = Mathf.Clamp(height, _minHeight, _maxHeight);

            // 1. 패널 하단 밀착 고정 및 세로 높이(Height) 조정
            if (_targetPanelRect != null)
            {
                Vector2 currentPos = _targetPanelRect.anchoredPosition;
                _targetPanelRect.anchoredPosition = new Vector2(currentPos.x, 0f);
                _targetPanelRect.sizeDelta = new Vector2(_targetPanelRect.sizeDelta.x, height);
            }

            // 2. 패널 높이 변화에 따른 카메라 줌 & Y 포지션 안전 보정
            if (_targetCamera == null) _targetCamera = Camera.main;

            if (_targetCamera != null && _targetCamera.orthographic)
            {
                float targetCamSize = _defaultCameraSize;
                float targetCamY = _defaultCameraY;

                if (height >= _defaultHeight)
                {
                    float t = Mathf.InverseLerp(_defaultHeight, _maxHeight, height);
                    targetCamSize = Mathf.Lerp(_defaultCameraSize, _maxCameraSize, t);
                    targetCamY = Mathf.Lerp(_defaultCameraY, _maxCameraY, t);
                }
                else
                {
                    float t = Mathf.InverseLerp(_minHeight, _defaultHeight, height);
                    targetCamSize = Mathf.Lerp(_minCameraSize, _defaultCameraSize, t);
                    targetCamY = Mathf.Lerp(_minCameraY, _defaultCameraY, t);
                }

                _targetCamera.orthographicSize = targetCamSize;

                Vector3 currentCamPos = _targetCamera.transform.position;
                _targetCamera.transform.position = new Vector3(currentCamPos.x, targetCamY, currentCamPos.z);
            }
        }

        /// <summary>
        /// 드래그 핸들 시각바(Grip Bar) 자동 생성 및 카탈로그 패널 최상단 분리선 위치에 안착
        /// </summary>
        private void EnsureVisualGripBar()
        {
            Transform parentTransform = _targetPanelRect != null ? _targetPanelRect : transform as RectTransform;

            // 상위 캔버스 루트에 잘못 생성된 공중 손잡이(Stray GripBar) 즉시 자동 정리
            if (transform != parentTransform)
            {
                var strayGrip = transform.Find("GripBar");
                if (strayGrip != null)
                {
                    if (Application.isPlaying) Destroy(strayGrip.gameObject);
                    else DestroyImmediate(strayGrip.gameObject);
                }
            }

            if (_handleGripImage == null && parentTransform != null)
            {
                var childGrip = parentTransform.Find("GripBar");
                if (childGrip != null)
                {
                    _handleGripImage = childGrip.GetComponent<Image>();
                }
                else
                {
                    GameObject gripGo = new GameObject("GripBar");
                    gripGo.transform.SetParent(parentTransform, false);

                    RectTransform rt = gripGo.AddComponent<RectTransform>();
                    rt.anchorMin = new Vector2(0.5f, 1f); // 패널 최상단 분리선 Y=1 앵커
                    rt.anchorMax = new Vector2(0.5f, 1f);
                    rt.pivot = new Vector2(0.5f, 0.5f);
                    rt.anchoredPosition = Vector2.zero;  // 패널 최상단 분리선 Y=0 위치에 안착
                    rt.sizeDelta = new Vector2(65f, 4f); // 분리선 중앙 슬림 4px 핸들바

                    _handleGripImage = gripGo.AddComponent<Image>();
                    _handleGripImage.color = _normalGripColor;
                    _handleGripImage.raycastTarget = false;
                }
            }
        }
    }
}
