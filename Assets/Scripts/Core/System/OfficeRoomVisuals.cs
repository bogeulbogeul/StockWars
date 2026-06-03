using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05: 오피스 레벨(1~5)에 따라 룸 프레임(바닥/벽체)과 하부 빌딩 외벽 스프라이트를 
    /// 동적으로 교체하고 정렬하는 오피스 룸 비주얼 매니저 (OfficeRoomVisuals).
    /// </summary>
    public class OfficeRoomVisuals : MonoBehaviour
    {
        [System.Serializable]
        public struct RoomVisualConfig
        {
            public int level;
            
            [Tooltip("룸 프레임 스프라이트 (바닥 및 뒷벽 - 예: BasicFrame)")]
            public Sprite roomBaseSprite;
            
            [Tooltip("하부 빌딩 바디 스프라이트 (외벽 및 창문) - 일체형일 경우 None")]
            public Sprite buildingBodySprite;
            
            [Tooltip("룸 프레임의 로컬 오프셋")]
            public Vector2 roomOffset;
            
            [Tooltip("하부 빌딩 바디의 로컬 오프셋")]
            public Vector2 buildingOffset;
        }

        [Header("Renderers")]
        [SerializeField] private SpriteRenderer _roomBaseRenderer;
        [SerializeField] private SpriteRenderer _buildingBodyRenderer;

        [Header("Level Configurations")]
        [SerializeField] private RoomVisualConfig[] _levelConfigs;

        [Header("Debug / Testing")]
        [SerializeField] private bool _useDebugLevel = false;
        [Range(1, 5)]
        [SerializeField] private int _debugLevel = 1;

        private void Start()
        {
            ApplyCurrentLevelVisuals();
        }

        /// <summary>
        /// 현재 활성화된 세이브 데이터의 오피스 레벨을 바탕으로 룸/빌딩 비주얼을 적용합니다.
        /// </summary>
        public void ApplyCurrentLevelVisuals()
        {
            int targetLevel = 1;

            if (_useDebugLevel || !Application.isPlaying)
            {
                targetLevel = _debugLevel;
            }
            else if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                targetLevel = WalletManager.Instance.ActiveSaveData.OfficeLevel;
            }

            ApplyLevelVisuals(targetLevel);
        }

        /// <summary>
        /// 특정 레벨의 룸 프레임 및 빌딩 외벽 비주얼을 적용합니다.
        /// </summary>
        public void ApplyLevelVisuals(int level)
        {
            if (_roomBaseRenderer == null)
            {
                Debug.LogWarning("[OfficeRoomVisuals] RoomBaseRenderer 레퍼런스가 누락되었습니다.");
                return;
            }

            RoomVisualConfig? matchedConfig = null;
            foreach (var config in _levelConfigs)
            {
                if (config.level == level)
                {
                    matchedConfig = config;
                    break;
                }
            }

            if (matchedConfig == null)
            {
                if (_levelConfigs != null && _levelConfigs.Length > 0)
                {
                    matchedConfig = _levelConfigs[0];
                    Debug.LogWarning($"[OfficeRoomVisuals] 레벨 {level}에 해당하는 설정을 찾지 못해 기본(첫 번째) 설정을 적용합니다.");
                }
                else
                {
                    Debug.LogError("[OfficeRoomVisuals] 레벨 설정 데이터가 비어 있습니다.");
                    return;
                }
            }

            var activeConfig = matchedConfig.Value;

            // 룸/일체형 스프라이트 적용
            _roomBaseRenderer.sprite = activeConfig.roomBaseSprite;
            _roomBaseRenderer.transform.localPosition = activeConfig.roomOffset;

            // 개별 빌딩 렌더러가 있고, 빌딩 스프라이트가 설정되어 있다면 적용
            if (_buildingBodyRenderer != null)
            {
                if (activeConfig.buildingBodySprite != null)
                {
                    _buildingBodyRenderer.gameObject.SetActive(true);
                    _buildingBodyRenderer.sprite = activeConfig.buildingBodySprite;
                    _buildingBodyRenderer.transform.localPosition = activeConfig.buildingOffset;
                }
                else
                {
                    // 일체형일 경우 서브 빌딩 렌더러는 비활성화
                    _buildingBodyRenderer.gameObject.SetActive(false);
                }
            }

            Debug.Log($"[OfficeRoomVisuals] 오피스 레벨 {level} 비주얼 적용 완료.");
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            // 에디터 모드에서도 인스펙터 수정 시 즉시 프리뷰가 반영되도록 딜레이 콜 활용
            UnityEditor.EditorApplication.delayCall += () =>
            {
                if (this != null)
                {
                    ApplyCurrentLevelVisuals();
                }
            };
        }
#endif
    }
}
