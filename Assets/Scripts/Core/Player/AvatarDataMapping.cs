using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_08 [캐릭터 생성 시스템] 아바타 데이터 매핑 엔진.
    /// <para>
    /// SaveDataDTO에 저장된 외형(성별, 피부색, 헤어) 및 장착 의상 데이터를
    /// 실제 2D SpriteRenderer 또는 3D MeshRenderer 컴포넌트에 실시간 매핑하고 렌더링을 갱신합니다.
    /// </para>
    /// </summary>
    public class AvatarDataMapping : MonoBehaviour
    {
        [System.Serializable]
        public struct SpriteMapping
        {
            public string partId;      // 고유 파츠 ID (예: "HAIR_SHORT_01", "CLOTH_TOP_001")
            public Sprite spriteAsset; // 유니티 에셋 폴더 내의 스프라이트 리소스
        }

        [Header("Character Rendering References")]
        [Tooltip("피부색/실루엣을 그릴 렌더러")]
        public SpriteRenderer bodyRenderer;

        [Tooltip("헤어 스타일을 그릴 렌더러")]
        public SpriteRenderer hairRenderer;

        [Tooltip("얼굴(눈/입 등)을 그릴 렌더러")]
        public SpriteRenderer faceRenderer;

        [Tooltip("상의 의상을 그릴 렌더러")]
        public SpriteRenderer topRenderer;

        [Tooltip("하의 의상을 그릴 렌더러")]
        public SpriteRenderer bottomRenderer;

        [Tooltip("신발을 그릴 렌더러")]
        public SpriteRenderer shoesRenderer;

        [Tooltip("액세서리를 그릴 렌더러")]
        public SpriteRenderer accessoryRenderer;

        [Header("Asset Database (Inspector mappings)")]
        [Tooltip("피부톤 스프라이트 매핑 데이터 (Pale, Fair, Medium, Tan, Deep 등)")]
        public List<SpriteMapping> skinToneDatabase = new();

        [Tooltip("헤어스타일 스프라이트 매핑 데이터 (Shortcut, Long, Ponytail, Bob 등)")]
        public List<SpriteMapping> hairStyleDatabase = new();

        [Tooltip("의상/장비 스프라이트 매핑 데이터 (상의/하의/신발/액세서리 전체)")]
        public List<SpriteMapping> apparelDatabase = new();

        // 런타임 O(1) 조회를 위한 사전 변환 딕셔너리
        private readonly Dictionary<string, Sprite> _skinToneCache = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, Sprite> _hairStyleCache = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, Sprite> _apparelCache = new(StringComparer.OrdinalIgnoreCase);

        private void Awake()
        {
            RebuildAssetCaches();
        }

        private void Start()
        {
            // 월렛 매니저 또는 전역 세이브 로드 완료 이벤트를 감청해 아바타 자동 로드 적용
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                ApplyAvatar(WalletManager.Instance.ActiveSaveData);
            }
        }

        /// <summary>
        /// 인스펙터 리스트 데이터를 고속 조회가 가능한 딕셔너리 캐시로 동적 재구성합니다.
        /// </summary>
        public void RebuildAssetCaches()
        {
            _skinToneCache.Clear();
            foreach (var item in skinToneDatabase)
            {
                if (!string.IsNullOrEmpty(item.partId)) _skinToneCache[item.partId] = item.spriteAsset;
            }

            _hairStyleCache.Clear();
            foreach (var item in hairStyleDatabase)
            {
                if (!string.IsNullOrEmpty(item.partId)) _hairStyleCache[item.partId] = item.spriteAsset;
            }

            _apparelCache.Clear();
            foreach (var item in apparelDatabase)
            {
                if (!string.IsNullOrEmpty(item.partId)) _apparelCache[item.partId] = item.spriteAsset;
            }
        }

        /// <summary>
        /// SaveDataDTO 정보에 따라 현재 캐릭터의 아바타 스프라이트 렌더링을 완전히 동기화합니다.
        /// </summary>
        public void ApplyAvatar(SaveDataDTO saveData)
        {
            if (saveData == null) return;

            // 1. 피부색 매핑 (성별에 따른 피부 스프라이트 보정 포함)
            string bodyKey = $"{saveData.Gender}_{saveData.SkinTone}";
            if (_skinToneCache.TryGetValue(bodyKey, out var bodySprite))
            {
                if (bodyRenderer != null) bodyRenderer.sprite = bodySprite;
            }
            else
            {
                // 기본 단일 키 포맷으로 한 번 더 폴백 검색
                if (_skinToneCache.TryGetValue(saveData.SkinTone, out var fallbackBody) && bodyRenderer != null)
                {
                    bodyRenderer.sprite = fallbackBody;
                }
            }

            // 2. 헤어 스타일 매핑
            string hairKey = $"{saveData.Gender}_{saveData.HairStyle}";
            if (_hairStyleCache.TryGetValue(hairKey, out var hairSprite))
            {
                if (hairRenderer != null) hairRenderer.sprite = hairSprite;
            }
            else
            {
                if (_hairStyleCache.TryGetValue(saveData.HairStyle, out var fallbackHair) && hairRenderer != null)
                {
                    hairRenderer.sprite = fallbackHair;
                }
            }

            // 3. 의상 세트 장착 상태 복원
            var equipped = saveData.EquippedApparel;

            // 머리/얼굴 파츠 초기화
            if (faceRenderer != null) faceRenderer.sprite = null;

            string setKey = AvatarPart.Set.ToString();
            string topKey = AvatarPart.Top.ToString();
            string bottomKey = AvatarPart.Bottom.ToString();
            string shoesKey = AvatarPart.Shoes.ToString();
            string accKey = AvatarPart.Accessory.ToString();

            // 상의 (Top) / 원피스(Set) 처리
            if (equipped.TryGetValue(setKey, out string setItemId) && !string.IsNullOrEmpty(setItemId))
            {
                // 상하의 일체형 세트 착용 시 하의는 보이지 않도록 클리어
                ApplyPartSprite(topRenderer, setItemId);
                if (bottomRenderer != null) bottomRenderer.sprite = null;
            }
            else
            {
                // 일반 개별 상의/하의 처리
                equipped.TryGetValue(topKey, out string topId);
                ApplyPartSprite(topRenderer, topId);

                equipped.TryGetValue(bottomKey, out string bottomId);
                ApplyPartSprite(bottomRenderer, bottomId);
            }

            // 신발 (Shoes)
            equipped.TryGetValue(shoesKey, out string shoesId);
            ApplyPartSprite(shoesRenderer, shoesId);

            // 액세서리 (Accessory)
            equipped.TryGetValue(accKey, out string accId);
            ApplyPartSprite(accessoryRenderer, accId);

            // 아바타 갱신 전역 이벤트 발행
            EventBus.Publish(new AvatarAppliedEvent
            {
                Gender = saveData.Gender,
                SkinTone = saveData.SkinTone,
                HairStyle = saveData.HairStyle
            });

            Debug.Log($"[AvatarDataMapping] 아바타 외형 실시간 동기화 완료: Gender={saveData.Gender}, Skin={saveData.SkinTone}, Hair={saveData.HairStyle}");
        }

        /// <summary>
        /// 단일 부위에 캐시된 의상 스프라이트를 대입하여 교체합니다. ID가 없거나 누락 시 투명 처리합니다.
        /// </summary>
        private void ApplyPartSprite(SpriteRenderer renderer, string itemId)
        {
            if (renderer == null) return;

            if (string.IsNullOrEmpty(itemId))
            {
                renderer.sprite = null;
                return;
            }

            if (_apparelCache.TryGetValue(itemId, out var sprite))
            {
                renderer.sprite = sprite;
            }
            else
            {
                // 폴백: 아이템 아이디를 Resources 로드 시도 또는 경고
                renderer.sprite = null;
                Debug.LogWarning($"[AvatarDataMapping] 장착 의상 스프라이트를 데이터베이스에서 찾을 수 없습니다: {itemId}");
            }
        }
    }

    #region Avatar Events (아바타 전역 이벤트 구조체)

    /// <summary>
    /// 아바타가 정상적으로 장착 및 렌더링 갱신 완료되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct AvatarAppliedEvent
    {
        public string Gender;
        public string SkinTone;
        public string HairStyle;
    }

    #endregion
}
