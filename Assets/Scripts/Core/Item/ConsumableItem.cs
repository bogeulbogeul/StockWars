using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_03 [소비 아이템 시스템] 소모품 아이템의 사용 및 효과 적용 핵심 엔진 (보완 버전).
    /// <para>
    /// 플레이어가 획득한 소모품(에너지 드링크, 분석 비약 등)을 사용(Consume)할 때,
    /// ItemMasterTable에서 아이템의 스탯 가중치를 조회하여 플레이어의 UserStats에 영구 보너스로 가산하고
    /// 인벤토리(OwnedConsumableIds)에서 원자적으로 제거합니다.
    /// </para>
    /// <para>
    /// [보완 완료]: 세이브 저장 실패 시 인메모리 스탯 및 아이템 소유를 복원하는 원자적 트랜잭션 롤백과
    /// 기존 세이브 슬롯의 메타데이터(플레이 타임, 위치 등) 유실을 완벽히 보존 및 계승합니다.
    /// </para>
    /// </summary>
    public class ConsumableItem : Singleton<ConsumableItem>
    {
        /// <summary>
        /// 플레이어가 소유한 특정 소모품을 사용합니다.
        /// </summary>
        /// <param name="itemId">사용할 아이템의 고유 ID</param>
        /// <returns>사용 성공 여부</returns>
        public bool UseConsumable(string itemId)
        {
            if (string.IsNullOrEmpty(itemId))
            {
                Debug.LogWarning("[ConsumableItem] 사용하려는 ItemId가 비어있습니다.");
                return false;
            }

            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null)
            {
                Debug.LogWarning("[ConsumableItem] 활성화된 세이브 데이터(WalletManager)를 찾을 수 없습니다.");
                return false;
            }

            var saveData = wallet.ActiveSaveData;
            
            // 1. 소지 여부 확인
            if (!saveData.OwnedConsumableIds.Contains(itemId))
            {
                Debug.LogWarning($"[ConsumableItem] 인벤토리에 아이템({itemId})이 존재하지 않습니다.");
                return false;
            }

            // 2. 아이템 마스터 데이터 조회
            var itemTable = ItemMasterTable.Instance;
            if (itemTable == null)
            {
                Debug.LogError("[ConsumableItem] ItemMasterTable 인스턴스가 존재하지 않습니다.");
                return false;
            }

            var itemData = itemTable.GetItem(itemId);
            if (itemData == null)
            {
                Debug.LogWarning($"[ConsumableItem] 아이템 마스터에서 아이템({itemId}) 정보를 찾을 수 없습니다.");
                return false;
            }

            // 3. 소모품 카테고리 여부 확인
            if (itemData.Category != ItemMasterTable.ItemCategory.Consumable)
            {
                Debug.LogWarning($"[ConsumableItem] 아이템({itemId})은 소모품(Consumable)이 아닙니다. 실제 카테고리: {itemData.Category}");
                return false;
            }

            // 4. 스탯 보너스 조각 적용 (원자적 메모리 가산)
            var currentStats = saveData.Stats;

            if (itemData.BonusAnalysis > 0)
            {
                currentStats.BonusAnalysisVal += itemData.BonusAnalysis;
                Debug.Log($"[ConsumableItem] 분석력 보너스 적용: +{itemData.BonusAnalysis:F2} (현재: {currentStats.BonusAnalysisVal:F2})");
            }
            if (itemData.BonusNegotiation > 0)
            {
                currentStats.BonusNegotiationVal += itemData.BonusNegotiation;
                Debug.Log($"[ConsumableItem] 협상력 보너스 적용: +{itemData.BonusNegotiation:F2} (현재: {currentStats.BonusNegotiationVal:F2})");
            }
            if (itemData.BonusManagement > 0)
            {
                // NOTE: ItemData.BonusManagement 스펙은 플레이어 스탯인 운용력(BonusTradingVal)에 1:1 매핑됩니다.
                currentStats.BonusTradingVal += itemData.BonusManagement; 
                Debug.Log($"[ConsumableItem] 운용력 보너스 적용: +{itemData.BonusManagement:F2} (현재: {currentStats.BonusTradingVal:F2})");
            }
            if (itemData.BonusResilience > 0)
            {
                // NOTE: ItemData.BonusResilience 스펙은 플레이어 스탯인 회복력(BonusRecoveryVal)에 1:1 매핑됩니다.
                currentStats.BonusRecoveryVal += itemData.BonusResilience; 
                Debug.Log($"[ConsumableItem] 회복력 보너스 적용: +{itemData.BonusResilience:F2} (현재: {currentStats.BonusRecoveryVal:F2})");
            }

            saveData.Stats = currentStats;

            // 5. 인벤토리에서 선 차감 (가장 처음 매칭되는 ID 1개만 원자적 소거)
            saveData.OwnedConsumableIds.Remove(itemId);
            Debug.Log($"[ConsumableItem] 아이템({itemData.DisplayName} : {itemId}) 소모 프로세스 대기. 영속 저장 작업을 개시합니다.");

            // 6. 안전 영속성 세이브 및 트랜잭션 보장
            try
            {
                var io = IOManager.Instance;
                if (io != null)
                {
                    int currentSlot = AutoSaveRouter.ActiveSlotIndex;
                    
                    // [메타데이터 보존]: 임의 덮어쓰기로 인한 플레이 타임, 위치 유실을 완벽 방지
                    SaveMetadata meta = io.LoadMetadata(currentSlot);
                    if (meta == null)
                    {
                        meta = new SaveMetadata
                        {
                            TotalPlayTime = 0.1f,
                            LastLocation = "Home Office",
                            AppVersion = Application.version
                        };
                    }
                    else
                    {
                        meta.AppVersion = Application.version;
                    }
                    
                    io.SaveGame(currentSlot, saveData, meta);
                    Debug.Log($"[ConsumableItem] 아이템 사용 영속화 성공 (슬롯 {currentSlot}).");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ConsumableItem] 세이브 실패로 인한 트랜잭션 롤백 실행! 데이터 무결성을 위해 메모리 상태를 복구합니다. 에러: {ex.Message}");

                // [트랜잭션 롤백 집행]: 스탯 보너스 차감 및 인벤토리 아이템 복구
                var rollbackStats = saveData.Stats;
                if (itemData.BonusAnalysis > 0) rollbackStats.BonusAnalysisVal -= itemData.BonusAnalysis;
                if (itemData.BonusNegotiation > 0) rollbackStats.BonusNegotiationVal -= itemData.BonusNegotiation;
                if (itemData.BonusManagement > 0) rollbackStats.BonusTradingVal -= itemData.BonusManagement;
                if (itemData.BonusResilience > 0) rollbackStats.BonusRecoveryVal -= itemData.BonusResilience;
                
                saveData.Stats = rollbackStats;
                saveData.OwnedConsumableIds.Add(itemId); // 아이템 롤백 반환

                return false;
            }

            // 7. 사용 성공 확정 시 최종 전역 이벤트 발행
            EventBus.Publish(new ConsumableUsedEvent
            {
                ItemId = itemId,
                DisplayName = itemData.DisplayName,
                BonusAnalysis = itemData.BonusAnalysis,
                BonusNegotiation = itemData.BonusNegotiation,
                BonusTrading = itemData.BonusManagement,
                BonusResilience = itemData.BonusResilience
            });

            return true;
        }
    }

    #region Events
    /// <summary>
    /// 소모품 아이템을 정상 사용 완료했을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct ConsumableUsedEvent
    {
        public string ItemId;
        public string DisplayName;
        public float BonusAnalysis;
        public float BonusNegotiation;
        public float BonusTrading;
        public float BonusResilience;
    }
    #endregion
}
