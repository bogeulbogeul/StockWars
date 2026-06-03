using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// CORE_GDD_05 [076]: 2D 스크린 Rain 오버레이 UI 애니메이션 및 흐름 제어 컴포넌트.
    /// RawImage의 uvRect(UV 좌표)를 스크롤하여 별도의 셰이더나 복잡한 머티리얼 없이도
    /// 드로우콜을 절약하는 최적화된 픽셀 아트 비 내림 연출을 구현합니다.
    /// </summary>
    [RequireComponent(typeof(RawImage))]
    public class RainFXOverlay : MonoBehaviour
    {
        [Header("Rain Settings")]
        [Tooltip("비 내리는 스피드")]
        [SerializeField] private float _fallSpeed = 2.0f;
        
        [Tooltip("비 투명도 (세기)")]
        [Range(0f, 1f)]
        [SerializeField] private float _intensity = 0.4f;

        [Header("State")]
        [SerializeField] private bool _isRainy = false;

        private RawImage _rawImage;
        private float _currentYOffset = 0f;

        private void Awake()
        {
            _rawImage = GetComponent<RawImage>();
            SetRainActive(_isRainy);
        }

        private void Update()
        {
            if (!_isRainy || _rawImage == null) return;

            // Y축 방향으로 텍스트 오프셋 스크롤 (위에서 아래로 내리기 위해 더해줌)
            _currentYOffset += _fallSpeed * Time.deltaTime;
            if (_currentYOffset > 1f)
            {
                _currentYOffset -= 1f;
            }

            // RawImage의 uvRect를 변경하여 텍스트 무한 스크롤링 효과 적용
            _rawImage.uvRect = new Rect(0f, _currentYOffset, 1f, 1f);
        }

        /// <summary>
        /// 비 효과를 켜거나 끕니다.
        /// </summary>
        public void SetRainActive(bool active)
        {
            _isRainy = active;
            if (_rawImage != null)
            {
                _rawImage.enabled = active;
                Color col = _rawImage.color;
                col.a = active ? _intensity : 0f;
                _rawImage.color = col;
            }
        }

        /// <summary>
        /// 비의 세기(투명도)를 조절합니다.
        /// </summary>
        public void SetRainIntensity(float intensity)
        {
            _intensity = Mathf.Clamp01(intensity);
            if (_rawImage != null && _isRainy)
            {
                Color col = _rawImage.color;
                col.a = _intensity;
                _rawImage.color = col;
            }
        }
    }
}
