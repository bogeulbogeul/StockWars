using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05 [씬 기획 및 UI/UX 인터페이스] 사운드 아틀라스.
    /// 게임 내 모든 SFX 오디오 클립(AudioClip)을 열거형(SfxType) 키에 매핑하여 에디터 상에서 직관적으로 셋업할 수 있는 데이터 에셋입니다.
    /// </summary>
    [CreateAssetMenu(fileName = "UI_SfxAtlas", menuName = "StockWars/Audio/UI_SfxAtlas")]
    public class UI_SfxAtlas : ScriptableObject
    {
        [Serializable]
        public struct SfxEntry
        {
            public SfxType type;
            public AudioClip clip;
        }

        [Header("SFX 오디오 맵 설정")]
        [SerializeField]
        private List<SfxEntry> sfxEntries = new List<SfxEntry>();

        // 빠른 O(1) 룩업을 위한 런타임 딕셔너리 캐시
        private readonly Dictionary<SfxType, AudioClip> _runtimeMap = new Dictionary<SfxType, AudioClip>();
        private bool _isInitialized = false;

        private void OnEnable()
        {
            InitializeMap();
        }

        /// <summary>
        /// 인스펙터 리스트 데이터를 런타임 룩업 딕셔너리로 동적 마이그레이션합니다.
        /// </summary>
        public void InitializeMap()
        {
            _runtimeMap.Clear();
            foreach (var entry in sfxEntries)
            {
                if (entry.clip == null) continue;
                if (!_runtimeMap.ContainsKey(entry.type))
                {
                    _runtimeMap.Add(entry.type, entry.clip);
                }
                else
                {
                    Debug.LogWarning($"[UI_SfxAtlas] 중복된 SFX 타입 발견: {entry.type} (첫 번째 에셋만 사용됨)");
                }
            }
            _isInitialized = true;
        }

        /// <summary>
        /// 지정한 효과음 종류에 대응하는 오디오 클립을 검색하여 반환합니다.
        /// </summary>
        public AudioClip GetClip(SfxType type)
        {
            if (!_isInitialized)
            {
                InitializeMap();
            }

            if (_runtimeMap.TryGetValue(type, out var clip))
            {
                return clip;
            }

            Debug.LogWarning($"[UI_SfxAtlas] SfxType '{type}'에 바인딩된 AudioClip을 찾을 수 없습니다.");
            return null;
        }

        #region 디버그/런타임 에셋 추가 도우미 (에디터 외 환경용)
        /// <summary>
        /// 코드를 통해 런타임에 동적으로 오디오 클립을 등록합니다. (단위 테스트 및 스크립트 전용)
        /// </summary>
        public void RegisterClip(SfxType type, AudioClip clip)
        {
            if (clip == null) return;
            InitializeMap();
            _runtimeMap[type] = clip;
        }
        #endregion
    }
}
