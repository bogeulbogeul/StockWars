using UnityEngine;

namespace StockWars.Town
{
    /// <summary>
    /// 양끝 경계가 정해진 유한 맵 전용 패럴랙스(Parallax) 배경 레이어 이동 스크립트.
    /// 카메라인 `TownCameraController`의 위치 이동에 맞춰 원경/중경/근경 배경 레이어를 비율에 따라 이동시키며,
    /// 카메라가 맵의 좌우 끝에 다다르면 배경도 지정된 이동 범위 끝에서 부드럽게 고정됩니다.
    /// </summary>
    public class BoundedParallaxBackground : MonoBehaviour
    {
        [Header("타겟 카메라 참조")]
        [SerializeField] private TownCameraController _targetCameraController;

        [Header("패럴랙스 이동 비율 설정")]
        [Tooltip("0 = 카메라와 완벽 동기화 (원경 하늘 등 멈춰 있는 듯함)\n0.5 = 중간 속도 이동 (중경)\n1.0 = 카메라와 동일한 위치 이동 (지면 수준)")]
        [Range(0f, 1f)]
        [SerializeField] private float _parallaxFactor = 0.3f;

        [Header("배경 레이어 이동 경계 (카메라 경계 기반 자동 산출 또는 수동 지정)")]
        [SerializeField] private bool _autoCalculateBounds = true;
        [SerializeField] private float _backgroundMinX = -8f;
        [SerializeField] private float _backgroundMaxX = 8f;

        private Vector3 _initialPosition;
        private float _initialCameraX;

        private void Start()
        {
            if (_targetCameraController == null)
            {
                _targetCameraController = Object.FindAnyObjectByType<TownCameraController>();
            }

            _initialPosition = transform.position;

            if (_targetCameraController != null)
            {
                _initialCameraX = _targetCameraController.transform.position.x;
                if (_autoCalculateBounds)
                {
                    // 카메라 이동 폭에 비해서 패럴랙스 비율만큼 오프셋 범위를 자동 산출
                    float camMin = _targetCameraController.MinX;
                    float camMax = _targetCameraController.MaxX;
                    float offset = (camMax - camMin) * (1f - _parallaxFactor) * 0.5f;

                    _backgroundMinX = _initialPosition.x - offset;
                    _backgroundMaxX = _initialPosition.x + offset;
                }
            }
        }

        private void LateUpdate()
        {
            if (_targetCameraController == null) return;

            // 카메라의 현재 Normalized X (0.0 ~ 1.0)
            float t = _targetCameraController.CurrentNormalizedX;

            // 배경 X 위치 보정 (패럴랙스 팩터에 맞춘 보간)
            float targetX = Mathf.Lerp(_backgroundMinX, _backgroundMaxX, t);

            Vector3 newPos = transform.position;
            newPos.x = targetX;
            transform.position = newPos;
        }

        /// <summary>
        /// 외부에서 패럴랙스 비율을 변경할 때 사용
        /// </summary>
        public void SetParallaxFactor(float factor)
        {
            _parallaxFactor = Mathf.Clamp01(factor);
        }
    }
}
