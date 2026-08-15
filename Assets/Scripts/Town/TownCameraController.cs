using UnityEngine;

namespace StockWars.Town
{
    /// <summary>
    /// 마을 씬(TownScene) 전용 2D 카메라 이동 컨트롤러.
    /// 키보드 입력(A/D, 방향키) 및 마우스/터치 좌우 드래그를 지원하며,
    /// 마을의 지정된 양끝 경계(MinX ~ MaxX) 내에서만 이동하도록 제한(Clamp)합니다.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class TownCameraController : MonoBehaviour
    {
        [Header("마을 맵 좌우 경계 설정")]
        [Tooltip("체크 시 씬 내의 보도블럭(TownBlock) 양끝 위치를 자동으로 감지하여 경계를 완벽히 맞춥니다.")]
        [SerializeField] private bool _autoDetectGroundBounds = true;

        [Tooltip("카메라 시야 테두리가 넘어갈 수 없는 최소 X 좌표 (좌측 경계)")]
        [SerializeField] private float _minX = -15f;

        [Tooltip("카메라 시야 테두리가 넘어갈 수 없는 최대 X 좌표 (우측 경계)")]
        [SerializeField] private float _maxX = 15f;

        [Header("이동 속도 및 조작 설정")]
        [Tooltip("키보드 탐색 이동 속도")]
        [SerializeField] private float _keyboardScrollSpeed = 12f;

        [Tooltip("마우스/터치 드래그 감도")]
        [SerializeField] private float _dragSensitivity = 1.0f;

        [Tooltip("카메라 이동 부드러움 (SmoothDamp 시간)")]
        [SerializeField] private float _smoothTime = 0.15f;

        [Header("입력 방지/락 옵션")]
        [SerializeField] private bool _enableDrag = true;
        [SerializeField] private bool _enableKeyboard = true;

        private Camera _cam;
        private Vector3 _targetPosition;
        private Vector3 _currentVelocity;
        private bool _isDragging = false;

        public float MinX => _minX;
        public float MaxX => _maxX;

        private float _dragStartMouseScreenX;
        private float _dragStartCamX;

        public float CameraHalfWidth
        {
            get
            {
                if (_cam == null) _cam = GetComponent<Camera>();
                if (_cam != null)
                {
                    float aspect = _cam.aspect > 0.01f ? _cam.aspect : (16f / 9f);
                    return _cam.orthographicSize * aspect;
                }
                return 8.88f;
            }
        }

        public float EffectiveMinX
        {
            get
            {
                float halfW = CameraHalfWidth;
                return (_maxX - _minX) > (halfW * 2f) ? _minX + halfW : (_minX + _maxX) * 0.5f;
            }
        }

        public float EffectiveMaxX
        {
            get
            {
                float halfW = CameraHalfWidth;
                return (_maxX - _minX) > (halfW * 2f) ? _maxX - halfW : (_minX + _maxX) * 0.5f;
            }
        }

        public float CurrentNormalizedX
        {
            get
            {
                float effMin = EffectiveMinX;
                float effMax = EffectiveMaxX;
                if (Mathf.Approximately(effMin, effMax)) return 0.5f;
                return Mathf.Clamp01((transform.position.x - effMin) / (effMax - effMin));
            }
        }

        private void Awake()
        {
            _cam = GetComponent<Camera>();
            DetectGroundBoundsIfEnabled();
            _targetPosition = transform.position;
            _targetPosition.x = Mathf.Clamp(_targetPosition.x, EffectiveMinX, EffectiveMaxX);
        }

        /// <summary>
        /// 씬 내의 보도블럭(TownBlock) 끝부분을 자동 감지하여 MinX, MaxX 산출
        /// </summary>
        public void DetectGroundBoundsIfEnabled()
        {
            if (!_autoDetectGroundBounds) return;

            // 1. TownBlock 오브젝트 탐색
            GameObject townBlock = GameObject.Find("TownBlock");
            SpriteRenderer[] renderers = null;

            if (townBlock != null)
            {
                renderers = townBlock.GetComponentsInChildren<SpriteRenderer>();
            }
            else
            {
                renderers = Object.FindObjectsByType<SpriteRenderer>(FindObjectsSortMode.None);
            }

            if (renderers != null && renderers.Length > 0)
            {
                float minX = float.MaxValue;
                float maxX = float.MinValue;
                bool foundAny = false;

                foreach (var r in renderers)
                {
                    if (r == null || !r.enabled) continue;
                    Bounds b = r.bounds;
                    if (b.min.x < minX) minX = b.min.x;
                    if (b.max.x > maxX) maxX = b.max.x;
                    foundAny = true;
                }

                if (foundAny)
                {
                    _minX = minX;
                    _maxX = maxX;
                }
            }
        }

        private void Update()
        {
            HandleKeyboardInput();
            HandleDragInput();
            ApplySmoothMovement();
        }

        private void LateUpdate()
        {
            // 드래그/SmoothDamp 후에도 화면 경계를 절대 넘지 못하도록 강제 Clamp 락
            Vector3 pos = transform.position;
            pos.x = Mathf.Clamp(pos.x, EffectiveMinX, EffectiveMaxX);
            transform.position = pos;
        }

        /// <summary>
        /// 키보드 A/D 및 방향키 입력 처리
        /// </summary>
        private void HandleKeyboardInput()
        {
            if (!_enableKeyboard || _isDragging) return;

            float horizontal = Input.GetAxisRaw("Horizontal");
            if (Mathf.Abs(horizontal) > 0.01f)
            {
                _targetPosition.x += horizontal * _keyboardScrollSpeed * Time.deltaTime;
                _targetPosition.x = Mathf.Clamp(_targetPosition.x, EffectiveMinX, EffectiveMaxX);
            }
        }

        /// <summary>
        /// 마우스 좌클릭 및 터치 드래그 스크롤 처리 (화면 스크린 픽셀 델타 방식)
        /// </summary>
        private void HandleDragInput()
        {
            if (!_enableDrag) return;

            // 마우스 버튼 클릭 시작
            if (Input.GetMouseButtonDown(0))
            {
                _isDragging = true;
                _dragStartMouseScreenX = Input.mousePosition.x;
                _dragStartCamX = _targetPosition.x;
            }
            else if (Input.GetMouseButton(0) && _isDragging)
            {
                float screenDeltaX = Input.mousePosition.x - _dragStartMouseScreenX;
                float unitsPerPixel = (CameraHalfWidth * 2f) / Mathf.Max(1f, Screen.width);
                float worldDeltaX = screenDeltaX * unitsPerPixel * _dragSensitivity;

                _targetPosition.x = Mathf.Clamp(_dragStartCamX - worldDeltaX, EffectiveMinX, EffectiveMaxX);
            }
            else if (Input.GetMouseButtonUp(0))
            {
                _isDragging = false;
            }
        }

        /// <summary>
        /// SmoothDamp를 사용한 부드러운 카메라 좌표 이동
        /// </summary>
        private void ApplySmoothMovement()
        {
            Vector3 currentPos = transform.position;
            Vector3 targetPos = new Vector3(_targetPosition.x, currentPos.y, currentPos.z);

            transform.position = Vector3.SmoothDamp(currentPos, targetPos, ref _currentVelocity, _smoothTime);
        }

        private Vector3 GetMouseWorldPosition()
        {
            Vector3 mousePos = Input.mousePosition;
            mousePos.z = Mathf.Abs(_cam.transform.position.z);
            return _cam.ScreenToWorldPoint(mousePos);
        }

        /// <summary>
        /// 외부 스크립트에서 경계 범위를 설정할 때 호출
        /// </summary>
        public void SetBounds(float minX, float maxX)
        {
            _minX = minX;
            _maxX = maxX;
            _targetPosition.x = Mathf.Clamp(_targetPosition.x, EffectiveMinX, EffectiveMaxX);
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            if (!Application.isPlaying)
            {
                DetectGroundBoundsIfEnabled();
            }
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.cyan;
            Vector3 minLineStart = new Vector3(_minX, transform.position.y - 10f, 0f);
            Vector3 minLineEnd = new Vector3(_minX, transform.position.y + 10f, 0f);
            Vector3 maxLineStart = new Vector3(_maxX, transform.position.y - 10f, 0f);
            Vector3 maxLineEnd = new Vector3(_maxX, transform.position.y + 10f, 0f);

            Gizmos.DrawLine(minLineStart, minLineEnd);
            Gizmos.DrawLine(maxLineStart, maxLineEnd);
        }
#endif
    }
}
