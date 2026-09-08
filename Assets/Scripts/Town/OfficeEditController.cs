using System;
using UnityEngine;
using StockWars.Core;

namespace StockWars.Town
{
    /// <summary>
    /// 오피스 가구 수정/배치 모드 컨트롤러 (OfficeEditController).
    /// <para>
    /// - [E] 키: 수정 모드 토글
    /// - [R] 키: 바닥 가구 90도 회전 / 벽면 가구(문, 창문) 좌우 벽 전환
    /// - [마우스 이동]: 바닥 그리드 스냅 & 벽면 레일 고정 높이 슬라이딩 추적
    /// - [좌클릭]: 가구 배치 확정 / 이미 배치된 가구 픽업 이동
    /// - [우클릭/ESC]: 배치 취소
    /// - [Delete/X]: 픽업한 가구 인벤토리로 수거
    /// </para>
    /// </summary>
    public class OfficeEditController : Singleton<OfficeEditController>
    {
        [Header("Edit Mode Settings")]
        [SerializeField] private bool _isEditMode = false;
        [SerializeField] private KeyCode _toggleKey = KeyCode.E;
        [SerializeField] private KeyCode _rotateKey = KeyCode.R;
        [SerializeField] private KeyCode _cancelKey = KeyCode.Escape;
        [SerializeField] private KeyCode _deleteKey = KeyCode.Delete;
        [SerializeField] private KeyCode _altDeleteKey = KeyCode.X;

        [Header("Ghost Preview Colors")]
        [SerializeField] private Color _validPlacementColor = new Color(0.25f, 0.90f, 0.45f, 0.75f); // 초록색 반투명
        [SerializeField] private Color _invalidPlacementColor = new Color(1.0f, 0.25f, 0.25f, 0.75f); // 빨간색 반투명

        [Header("Debug Quick Test")]
        [Tooltip("인스펙터에서 테스트할 가구 ID를 넣고 [T] 키를 누르면 즉시 배치 모드가 시작됩니다.")]
        [SerializeField] private string _quickTestItemId = "BasicWindow";

        // 런타임 상태
        private GameObject _ghostObject;
        private SpriteRenderer _ghostRenderer;

        private string _heldItemId = null;
        private int _heldRotationIndex = 0; // 0, 1, 2, 3
        private bool _heldIsWall = false;
        private bool _heldWallIsLeft = true;
        private float _heldWallElevation = 0f;

        private bool _isMovingExisting = false;
        private string _movingInstanceId = null;

        public bool IsEditMode => _isEditMode;
        public string HeldItemId => _heldItemId;

        protected override void Awake()
        {
            base.Awake();
            CreateGhostObject();
        }

        private void Start()
        {
            SetGhostActive(false);
        }

        private void Update()
        {
            // 1. [E] 키로 수정 모드 진입/종료 토글
            if (Input.GetKeyDown(_toggleKey))
            {
                ToggleEditMode();
            }

            // 2. 디버그 퀵 테스트 ([T] 키)
            if (Input.GetKeyDown(KeyCode.T) && !string.IsNullOrEmpty(_quickTestItemId))
            {
                if (!_isEditMode) SetEditMode(true);
                StartPlacement(_quickTestItemId);
            }

            if (!_isEditMode) return;

            // 마우스 월드 좌표 계산 (카메라 기준)
            Camera targetCam = Camera.main;
            if (targetCam == null) return;

            Vector3 mouseScreenPos = Input.mousePosition;
            mouseScreenPos.z = -targetCam.transform.position.z;
            Vector3 mouseWorldPos = targetCam.ScreenToWorldPoint(mouseScreenPos);
            mouseWorldPos.z = 0f;

            // 3. 아이템을 들고 있는 경우 (배치/이동 진행 중)
            if (!string.IsNullOrEmpty(_heldItemId))
            {
                HandleHeldItemUpdate(mouseWorldPos);
            }
            // 4. 아이템을 들고 있지 않은 경우 (기존 가구 픽업 클릭 대기)
            else
            {
                HandleInspectHover(mouseWorldPos);
            }
        }

        // --------------------------------------------------------
        // 1. 수정 모드 제어
        // --------------------------------------------------------

        public void ToggleEditMode()
        {
            SetEditMode(!_isEditMode);
        }

        public void SetEditMode(bool enable)
        {
            _isEditMode = enable;
            if (!_isEditMode)
            {
                CancelPlacement();
            }

            Debug.Log($"<color=#FFD700>[OfficeEditController] 오피스 수정 모드: {(_isEditMode ? "ON (활성화)" : "OFF (종료)")}</color>");
            EventBus.Publish(new OfficeEditModeChangedEvent { IsEditMode = _isEditMode });
        }

        /// <summary>
        /// 상점이나 인벤토리, 또는 스크립트에서 특정 가구의 배치를 시작합니다.
        /// </summary>
        public void StartPlacement(string itemId, int initialRotation = 0)
        {
            if (string.IsNullOrEmpty(itemId)) return;

            if (!_isEditMode) SetEditMode(true);

            _heldItemId = itemId;
            _heldRotationIndex = initialRotation;
            _heldIsWall = OfficeGridManager.IsWallItem(itemId);
            _heldWallIsLeft = true;
            _heldWallElevation = OfficeGridManager.GetWallElevation(itemId);

            _isMovingExisting = false;
            _movingInstanceId = null;

            UpdateGhostVisuals();
            SetGhostActive(true);

            Debug.Log($"[OfficeEditController] 가구 배치 시작: {itemId} (벽면={_heldIsWall}, 회전={_heldRotationIndex * 90}도)");
        }

        /// <summary>
        /// 현재 들고 있는 가구 배치 작업을 취소합니다.
        /// </summary>
        public void CancelPlacement()
        {
            // 만약 기존에 배치되어 있던 가구를 이동 중이었다면 원래대로 되돌리지 않고 취소(인벤토리 복귀 상태)
            _heldItemId = null;
            _isMovingExisting = false;
            _movingInstanceId = null;
            SetGhostActive(false);
        }

        /// <summary>
        /// [R] 키 입력 시 가구 회전 처리
        /// </summary>
        public void RotateHeldItem()
        {
            if (string.IsNullOrEmpty(_heldItemId)) return;

            if (_heldIsWall)
            {
                // 벽면 가구는 좌측 벽 <-> 우측 벽 반전
                _heldWallIsLeft = !_heldWallIsLeft;
                _heldRotationIndex = _heldWallIsLeft ? 0 : 1;
            }
            else
            {
                // 바닥 가구는 0 -> 90 -> 180 -> 270도 순환
                _heldRotationIndex = (_heldRotationIndex + 1) % 4;
            }

            UpdateGhostVisuals();
        }

        /// <summary>
        /// 현재 들고 있거나 선택한 가구를 수거(인벤토리로 회수)합니다.
        /// </summary>
        public void DeleteHeldItem()
        {
            if (_isMovingExisting && !string.IsNullOrEmpty(_movingInstanceId))
            {
                OfficeGridManager.Instance?.RemoveFurniture(_movingInstanceId);
                Debug.Log($"[OfficeEditController] 가구 수거 완료: {_heldItemId}");
            }
            CancelPlacement();
        }

        // --------------------------------------------------------
        // 2. 들고 있는 가구 조작 및 프리뷰 루프
        // --------------------------------------------------------

        private void HandleHeldItemUpdate(Vector3 mouseWorldPos)
        {
            // [R] 키: 회전
            if (Input.GetKeyDown(_rotateKey))
            {
                RotateHeldItem();
            }

            // [ESC] 또는 우클릭: 취소
            if (Input.GetKeyDown(_cancelKey) || Input.GetMouseButtonDown(1))
            {
                CancelPlacement();
                return;
            }

            // [Delete] 또는 [X] 키: 수거
            if (Input.GetKeyDown(_deleteKey) || Input.GetKeyDown(_altDeleteKey))
            {
                if (_isMovingExisting && !string.IsNullOrEmpty(_movingInstanceId))
                {
                    OfficeGridManager.Instance.RemoveFurniture(_movingInstanceId);
                    Debug.Log($"[OfficeEditController] 가구 수거 완료: {_heldItemId}");
                }
                CancelPlacement();
                return;
            }

            if (OfficeGridManager.Instance == null) return;

            bool canPlace = false;

            // A. 벽면 가구(문, 창문 등) 처리
            if (_heldIsWall)
            {
                OfficeGridManager.Instance.WorldToWallPosition(mouseWorldPos, out bool autoLeft, out int segmentIndex);
                
                // 마우스가 벽 반대편으로 넘어가면 자연스럽게 해당 벽으로 갱신
                _heldWallIsLeft = autoLeft;

                Vector3 snapPos = OfficeGridManager.Instance.GetWallWorldPosition(_heldWallIsLeft, segmentIndex, _heldWallElevation);
                _ghostObject.transform.position = snapPos;
                _ghostRenderer.flipX = !_heldWallIsLeft;
                _ghostRenderer.sortingOrder = -75;

                canPlace = OfficeGridManager.Instance.CanPlaceWallFurniture(_heldWallIsLeft, segmentIndex, _movingInstanceId);

                // 좌클릭: 배치 확정
                if (Input.GetMouseButtonDown(0) && canPlace)
                {
                    OfficeGridManager.Instance.PlaceWallFurniture(_heldItemId, _heldWallIsLeft, segmentIndex, _heldWallElevation);
                    _heldItemId = null;
                    _isMovingExisting = false;
                    _movingInstanceId = null;
                    SetGhostActive(false);
                    return;
                }
            }
            // B. 바닥 그리드 가구(책상, 침대 등) 처리
            else
            {
                OfficeGridManager.Instance.GetRotatedDimensions(_heldItemId, _heldRotationIndex, out int w, out int h);

                if (OfficeGridManager.Instance.WorldToGridPosition(mouseWorldPos, out int gx, out int gy))
                {
                    Vector3 originPos = OfficeGridManager.Instance.GridToWorldPosition(gx, gy);
                    Vector3 centerPos = originPos;

                    if (w > 1 || h > 1)
                    {
                        Vector3 endPos = OfficeGridManager.Instance.GridToWorldPosition(gx + w - 1, gy + h - 1);
                        centerPos = (originPos + endPos) * 0.5f;
                    }

                    _ghostObject.transform.position = centerPos;
                    _ghostRenderer.flipX = (_heldRotationIndex == 1 || _heldRotationIndex == 2);
                    _ghostRenderer.sortingOrder = 999; // 프리뷰는 항상 최상단에 잘 보이게

                    canPlace = OfficeGridManager.Instance.CanPlaceFurniture(gx, gy, w, h, _movingInstanceId);

                    // 좌클릭: 배치 확정
                    if (Input.GetMouseButtonDown(0) && canPlace)
                    {
                        OfficeGridManager.Instance.PlaceFurniture(_heldItemId, gx, gy, _heldRotationIndex);
                        _heldItemId = null;
                        _isMovingExisting = false;
                        _movingInstanceId = null;
                        SetGhostActive(false);
                        return;
                    }
                }
                else
                {
                    _ghostObject.transform.position = mouseWorldPos;
                    canPlace = false;
                }
            }

            // 고스트 색상 피드백 (초록 vs 빨강)
            _ghostRenderer.color = canPlace ? _validPlacementColor : _invalidPlacementColor;
        }

        // --------------------------------------------------------
        // 3. 기배치 가구 픽업(선택하여 재이동) 상호작용
        // --------------------------------------------------------

        private void HandleInspectHover(Vector3 mouseWorldPos)
        {
            if (OfficeGridManager.Instance == null) return;

            // 좌클릭 시 마우스 아래에 있는 가구 픽업
            if (Input.GetMouseButtonDown(0))
            {
                if (OfficeGridManager.Instance.TryGetFurnitureAtWorldPos(mouseWorldPos, out string instId, out var dto))
                {
                    // 기존 가구 그리드/벽면 점유에서 임시 수거 후 마우스에 쥐기
                    OfficeGridManager.Instance.RemoveFurniture(instId);

                    _heldItemId = dto.ItemId;
                    _heldRotationIndex = dto.RotationIndex;
                    _heldIsWall = dto.IsWallMounted || OfficeGridManager.IsWallItem(dto.ItemId);
                    _heldWallIsLeft = dto.IsLeftWall;
                    _heldWallElevation = dto.WallElevation > 0f ? dto.WallElevation : OfficeGridManager.GetWallElevation(dto.ItemId);

                    _isMovingExisting = true;
                    _movingInstanceId = instId;

                    UpdateGhostVisuals();
                    SetGhostActive(true);

                    Debug.Log($"[OfficeEditController] 기배치 가구 픽업 이동: {dto.ItemId} (Instance={instId})");
                }
            }
        }

        // --------------------------------------------------------
        // 4. 고스트 오브젝트 렌더러 관리
        // --------------------------------------------------------

        private void CreateGhostObject()
        {
            if (_ghostObject != null) return;

            _ghostObject = new GameObject("PlacementGhostPreview");
            _ghostObject.transform.SetParent(transform);

            _ghostRenderer = _ghostObject.AddComponent<SpriteRenderer>();
            _ghostRenderer.material = new Material(Shader.Find("Sprites/Default"));
            _ghostRenderer.color = _validPlacementColor;
        }

        private void UpdateGhostVisuals()
        {
            if (_ghostRenderer == null || string.IsNullOrEmpty(_heldItemId)) return;

            _ghostRenderer.sprite = OfficeGridManager.Instance?.ResolveFurnitureSprite(_heldItemId);
            if (_heldIsWall)
            {
                _ghostRenderer.flipX = !_heldWallIsLeft;
            }
            else
            {
                _ghostRenderer.flipX = (_heldRotationIndex == 1 || _heldRotationIndex == 2);
            }
        }

        private void SetGhostActive(bool active)
        {
            if (_ghostObject != null)
            {
                _ghostObject.SetActive(active);
            }
        }
    }

    /// <summary>
    /// 오피스 수정 모드 On/Off 전환 전역 이벤트
    /// </summary>
    public struct OfficeEditModeChangedEvent
    {
        public bool IsEditMode;
    }
}
