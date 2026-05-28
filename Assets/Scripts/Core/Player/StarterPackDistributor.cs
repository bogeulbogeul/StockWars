using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_08 [캐릭터 생성 시스템] 신규 유저 웰컴 스타터팩 지급 관리기.
    /// <para>
    /// 플레이어가 캐릭터를 생성하거나 최초 진입할 때, 종자돈 5,000G 및
    /// 'NaturalStarter' 테마의 8종 가구 세트 아이템을 안전하게 지급하고 저장합니다.
    /// </para>
    /// </summary>
    public class StarterPackDistributor : MonoBehaviour
    {
        [Header("Starter Pack Configuration")]
        [Tooltip("기본 지급할 종자돈 액수 (기본 5,000G)")]
        public long starterSeedMoney = 5000L;

        [Tooltip("기본 지급할 스타터 가구 테마 태그")]
        public string starterThemeTag = "NaturalStarter";

        [Tooltip("씬 진입 시 자동으로 스타터팩 지급 조건을 체크할지 여부")]
        public bool checkOnStart = true;

        private void Start()
        {
            if (checkOnStart)
            {
                CheckAndDistributeStarterPack();
            }
        }

        private void OnEnable()
        {
            // 테이블이 비어있는 상태에서 비동기 로딩이 늦어질 경우를 대비해 테이블 완료 이벤트 감청
            EventBus.Subscribe<ItemTableLoadedEvent>(OnItemTableLoaded);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<ItemTableLoadedEvent>(OnItemTableLoaded);
        }

        private void OnItemTableLoaded(ItemTableLoadedEvent e)
        {
            Debug.Log($"[StarterPackDistributor] 아이템 테이블 로드 완료 확인 ({e.TotalCount}종). 스타터팩 상태를 검사합니다.");
            CheckAndDistributeStarterPack();
        }

        /// <summary>
        /// 활성 세이브 데이터의 스타터팩 지급 여부를 확인하여 패키지를 분배합니다.
        /// </summary>
        public void CheckAndDistributeStarterPack()
        {
            var wallet = WalletManager.Instance;
            var itemTable = ItemMasterTable.Instance;

            // 1. 코어 인프라 싱글톤 준비 여부 확인
            if (wallet == null)
            {
                Debug.LogWarning("[StarterPackDistributor] WalletManager가 활성화되지 않아 보류합니다.");
                return;
            }

            if (itemTable == null || itemTable.GetTotalCount() == 0)
            {
                Debug.LogWarning("[StarterPackDistributor] ItemMasterTable이 아직 빌드되지 않아 보류합니다. 로드 이벤트를 대기합니다.");
                return;
            }

            var saveData = wallet.ActiveSaveData;
            if (saveData == null)
            {
                Debug.LogWarning("[StarterPackDistributor] 활성화된 세이브 데이터가 존재하지 않아 보류합니다.");
                return;
            }

            // 2. 이미 수령한 적이 있다면 스킵
            if (saveData.IsStarterPackClaimed)
            {
                return;
            }

            Debug.Log("[StarterPackDistributor] 스타터팩 미수령 프로필 감지. 패키지 지급 프로세스를 가동합니다.");

            // 3. 종자돈 5,000G 원자적 트랜잭션 지급
            long currentCash = wallet.GetCash();
            if (currentCash < starterSeedMoney)
            {
                long grantAmount = starterSeedMoney - currentCash;
                wallet.AddCash(grantAmount);
                Debug.Log($"[StarterPackDistributor] 초기 종자돈 충전 완료: +{grantAmount:N0}G (최종 {wallet.GetCash():N0}G)");
            }

            // 4. 'NaturalStarter' 8종 세트 지급
            var starterItems = itemTable.GetByTheme(starterThemeTag);
            int addedCount = 0;

            if (starterItems == null || starterItems.Count == 0)
            {
                Debug.LogError($"[StarterPackDistributor] 테마 '{starterThemeTag}' 아이템을 마스터 데이터에서 발견하지 못했습니다. CSV 로드 상태를 확인하세요!");
            }
            else
            {
                var ownedFurniture = saveData.OwnedFurnitureIds;
                foreach (var item in starterItems)
                {
                    if (item.Category == ItemMasterTable.ItemCategory.Furniture)
                    {
                        // 중복 지급 방지 가드링
                        if (!ownedFurniture.Contains(item.ItemId))
                        {
                            ownedFurniture.Add(item.ItemId);
                            addedCount++;
                        }
                    }
                }
                Debug.Log($"[StarterPackDistributor] 스타터 테마 '{starterThemeTag}' 가구 지급 완료: 총 {addedCount}종 지급");
            }

            // 5. 완료 플래그 적용 및 즉각 강제 세이브로 보존성 확정
            saveData.IsStarterPackClaimed = true;

            // 글로벌 이벤트 발행 (UI 연출 및 알림 팝업 트리거)
            EventBus.Publish(new StarterPackClaimedEvent
            {
                GrantedGold = starterSeedMoney,
                GrantedFurnitureCount = addedCount,
                ThemeTag = starterThemeTag
            });

            // 즉각 암호화 저장하여 비정상 종료 시 재수령 남용 방지
            var io = IOManager.Instance;
            if (io != null)
            {
                // 현재 인게임에서 활성화된 세이브 슬롯을 안전하게 동적 참조
                int currentSlot = AutoSaveRouter.ActiveSlotIndex;
                try
                {
                    SaveMetadata meta = new SaveMetadata
                    {
                        TotalPlayTime = 0.1f,
                        LastLocation = "Home Office",
                        AppVersion = Application.version
                    };
                    io.SaveGame(currentSlot, saveData, meta);
                    Debug.Log($"[StarterPackDistributor] 웰컴 패키지 정보가 슬롯 {currentSlot}에 안전하게 세이브 완료되었습니다.");
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[StarterPackDistributor] 세이브 시도 중 경고 (임시 슬롯 격리): {ex.Message}");
                }
            }
        }
    }

    #region Starter Pack Events

    /// <summary>
    /// 신규 플레이어 웰컴 스타터팩이 정상 수령 완료되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct StarterPackClaimedEvent
    {
        public long GrantedGold;
        public int GrantedFurnitureCount;
        public string ThemeTag;
    }

    #endregion
}
