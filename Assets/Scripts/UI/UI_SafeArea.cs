using UnityEngine;

namespace StockWars.UI
{
    /// <summary>
    /// 다양한 PC 화면 해상도, 모니터 종횡비 및 윈도우 창 모드 환경에 맞게
    /// UI 캔버스 콘텐츠가 화면의 안전 영역(Safe Area) 내에 온전히 렌더링되도록 앵커(Anchor)를 실시간 조정하는 반응형 스크립트.
    /// </summary>
    [RequireComponent(typeof(RectTransform))]
    public class UI_SafeArea : MonoBehaviour
    {
        private RectTransform _rectTransform;
        
        // 실시간 창 크기 조절 감지용 필드
        private Rect _lastSafeArea = new Rect(0, 0, 0, 0);
        private Vector2 _lastScreenSize = new Vector2(0, 0);

        private void Awake()
        {
            _rectTransform = GetComponent<RectTransform>();
            
            // 패널 초기화 시 부모 캔버스 대비 전체 영역 설정 방지 및 정렬 보정
            if (_rectTransform == null)
            {
                Debug.LogError("[UI_SafeArea] RectTransform 컴포넌트를 찾을 수 없습니다.");
                enabled = false;
                return;
            }

            ApplySafeArea();
        }

        private void Update()
        {
            // 매 프레임 창 모드 크기 변경 또는 노치/안전영역 변동이 있었는지 대조 검사
            if (_lastSafeArea != Screen.safeArea || 
                _lastScreenSize.x != Screen.width || 
                _lastScreenSize.y != Screen.height)
            {
                ApplySafeArea();
            }
        }

        /// <summary>
        /// 실제 화면 해상도 대비 Safe Area 픽셀 영역을 계산하여 앵커 최소/최대 값을 정밀 매핑합니다.
        /// </summary>
        private void ApplySafeArea()
        {
            Rect safeArea = Screen.safeArea;

            // Failsafe: 비정상적인 화면 렌더링 시 처리 방지
            if (Screen.width <= 0 || Screen.height <= 0) return;

            // 1. 현재 해상도와 세이프 에어리어 상태 백업
            _lastSafeArea = safeArea;
            _lastScreenSize.x = Screen.width;
            _lastScreenSize.y = Screen.height;

            // 2. 픽셀 좌표를 캔버스의 비율 좌표(0.0f ~ 1.0f)로 정규화 변환
            Vector2 anchorMin = safeArea.position;
            Vector2 anchorMax = safeArea.position + safeArea.size;

            anchorMin.x /= Screen.width;
            anchorMin.y /= Screen.height;
            anchorMax.x /= Screen.width;
            anchorMax.y /= Screen.height;

            // 3. RectTransform의 상/하/좌/우 앵커 배치 갱신
            _rectTransform.anchorMin = anchorMin;
            _rectTransform.anchorMax = anchorMax;

            // 4. 피벗 및 스트레치 오프셋을 제로화하여 화면 외곽 여백을 안전 영역으로 완전 강제
            _rectTransform.offsetMin = Vector2.zero;
            _rectTransform.offsetMax = Vector2.zero;

            Debug.Log($"[UI_SafeArea] 세이프 에어리어 보정 완료: " +
                      $"Min({anchorMin.x:F3}, {anchorMin.y:F3}) / Max({anchorMax.x:F3}, {anchorMax.y:F3}) " +
                      $"| 해상도: {Screen.width}x{Screen.height}");
        }
    }
}
