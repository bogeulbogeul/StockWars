using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_03 [소비 아이템 시스템] 소모품 엔진의 기능 정합성과 세이브 반영을 검증하는 테스트 컴포넌트 (보완 버전).
    /// 플레이 모드 진입 시 자동으로 리플렉션을 통해 테스트 소모품 데이터를 주입하고,
    /// 사용 시 스탯 보너스가 정상 합산되고 인벤토리 차감 및 이벤트 발행이 완료되는지 라운드트립으로 검증합니다.
    /// [보완 검증]: 고도화된 디스크 예외 롤백 시나리오를 탑재하여 메모리 원자성을 확실하게 대조 검증합니다.
    /// </summary>
    public class ConsumableItemTest : MonoBehaviour
    {
        [Header("Test Configuration")]
        [Tooltip("True일 경우 시작 시 자동으로 소모품 테스트 시나리오를 구동합니다.")]
        public bool runTestOnStart = true;

        [SerializeField, ReadOnlyDisplay]
        private string testResultStatus = "Not Run";

        private bool _eventReceived = false;
        private ConsumableUsedEvent _receivedEvent;

        private void Start()
        {
            if (runTestOnStart)
            {
                RunConsumableTest();
            }
        }

        private void OnEnable()
        {
            EventBus.Subscribe<ConsumableUsedEvent>(OnConsumableUsed);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<ConsumableUsedEvent>(OnConsumableUsed);
        }

        private void OnConsumableUsed(ConsumableUsedEvent e)
        {
            _eventReceived = true;
            _receivedEvent = e;
        }

        /// <summary>
        /// 소모품 획득, 사용, 스탯 가산, 인벤토리 차감, 이벤트 발행, 그리고 예외 상황 시의 원자적 롤백 전 과정을 검증합니다.
        /// </summary>
        public void RunConsumableTest()
        {
            Debug.Log("[ConsumableItemTest] ===== STARTING CONSUMABLE ITEM TEST =====");
            testResultStatus = "Running...";
            _eventReceived = false;

            try
            {
                var wallet = WalletManager.Instance;
                var itemTable = ItemMasterTable.Instance;
                var consumableEngine = ConsumableItem.Instance;

                if (wallet == null || itemTable == null || consumableEngine == null)
                {
                    throw new Exception("Core singletons (WalletManager, ItemMasterTable, ConsumableItem) are inactive.");
                }

                // 1. 테스트용 소모품 아이템을 ItemMasterTable에 리플렉션으로 강제 주입
                InjectTestConsumableItem(itemTable);

                // 2. 가짜 세이브 데이터 DTO 세팅 (지갑 주입)
                SaveDataDTO testSave = new SaveDataDTO
                {
                    Gold = 10000,
                    PlayerLevel = 3,
                    Stats = new UserStats
                    {
                        BaseAnalysisLv = 1,
                        BonusAnalysisVal = 0.2f, // 기존 보너스 파편
                        BonusNegotiationVal = 0.0f,
                        BonusTradingVal = 0.0f,
                        BonusRecoveryVal = 0.0f
                    }
                };
                wallet.GetType()
                      .GetProperty("ActiveSaveData")
                      ?.SetValue(wallet, testSave);

                Debug.Log($"[ConsumableItemTest] [Step 2] Initial Stats: BonusAnalysisVal={testSave.Stats.BonusAnalysisVal}");

                // 3. 인벤토리에 테스트 아이템 획득 처리
                testSave.OwnedConsumableIds.Add("TEST_ELIXIR_001");
                Debug.Log("[ConsumableItemTest] [Step 3] Granted 'TEST_ELIXIR_001' to player's OwnedConsumableIds.");

                // 4. 아이템 사용 집행
                Debug.Log("[ConsumableItemTest] [Step 4] Executing ConsumableItem.Instance.UseConsumable('TEST_ELIXIR_001')...");
                bool success = consumableEngine.UseConsumable("TEST_ELIXIR_001");

                if (!success)
                {
                    throw new Exception("ConsumableItem.UseConsumable execution returned false.");
                }

                // 5. 검증: 스탯 가산 확인 (기존 0.2f + 비약 0.75f = 0.95f)
                float expectedVal = 0.2f + 0.75f;
                float actualVal = wallet.ActiveSaveData.Stats.BonusAnalysisVal;

                Debug.Log($"[ConsumableItemTest] [Step 5] Verify Stats: Expected={expectedVal:F2}, Actual={actualVal:F2}");
                if (Mathf.Abs(actualVal - expectedVal) > 0.001f)
                {
                    throw new Exception($"Stats value mismatch. Got {actualVal:F2}, expected {expectedVal:F2}");
                }

                // 6. 검증: 인벤토리에서 차감되었는지 확인
                int invCount = wallet.ActiveSaveData.OwnedConsumableIds.Count;
                Debug.Log($"[ConsumableItemTest] [Step 6] Verify Inventory Count: Expected=0, Actual={invCount}");
                if (invCount != 0)
                {
                    throw new Exception($"Inventory count is not zero. Got {invCount}");
                }

                // 7. 검증: 전역 이벤트 정상 수신 대조
                Debug.Log($"[ConsumableItemTest] [Step 7] Verify Event Received: {_eventReceived}");
                if (!_eventReceived)
                {
                    throw new Exception("ConsumableUsedEvent was not published or received.");
                }

                if (_receivedEvent.ItemId != "TEST_ELIXIR_001" || _receivedEvent.BonusAnalysis != 0.75f)
                {
                    throw new Exception("Event payload data is corrupted or mismatched.");
                }

                // 8. 사용 불가능한 상태(미소지 아이템) 재사용 시 예외 차단 가드링 검증
                Debug.Log("[ConsumableItemTest] [Step 8] Testing fallback/guard scenario with missing item...");
                bool secondarySuccess = consumableEngine.UseConsumable("TEST_ELIXIR_001");
                if (secondarySuccess)
                {
                    throw new Exception("UseConsumable succeeded on a non-existent item (Double Spend vulnerability).");
                }
                Debug.Log("[ConsumableItemTest] [Step 8] Successfully blocked double spending attempts.");

                // 9. [보완 검증] 디스크 예외 발생 시 원자적 트랜잭션 롤백 검증
                Debug.Log("[ConsumableItemTest] [Step 9] Testing transaction rollback on Disk I/O exception...");
                
                int originalSlot = AutoSaveRouter.ActiveSlotIndex;
                // 의도적으로 세이브 예외를 촉발하기 위해 세이브 슬롯을 유효하지 않은 음수 값(-999)으로 조작
                AutoSaveRouter.ActiveSlotIndex = -999; 
                
                testSave.OwnedConsumableIds.Add("TEST_ELIXIR_001");
                float beforeRollbackStats = testSave.Stats.BonusAnalysisVal; // 현재 0.95f
                
                // 예외가 날 것이므로 결과값은 false가 되어야 함
                bool rollbackSuccess = consumableEngine.UseConsumable("TEST_ELIXIR_001");
                
                if (rollbackSuccess)
                {
                    AutoSaveRouter.ActiveSlotIndex = originalSlot; // 복구
                    throw new Exception("UseConsumable succeeded even when Disk I/O exception was expected.");
                }
                
                // 검증: 예외가 났으니 스탯 및 인벤토리가 롤백되어 원상복구되어 있어야 함
                float afterRollbackStats = wallet.ActiveSaveData.Stats.BonusAnalysisVal;
                int afterRollbackInv = wallet.ActiveSaveData.OwnedConsumableIds.Count;
                
                AutoSaveRouter.ActiveSlotIndex = originalSlot; // 원상복구
                
                Debug.Log($"[ConsumableItemTest] [Step 9] Verify Rollback Stats: Expected={beforeRollbackStats:F2}, Actual={afterRollbackStats:F2}");
                Debug.Log($"[ConsumableItemTest] [Step 9] Verify Rollback Inventory Count: Expected=1, Actual={afterRollbackInv}");
                
                if (Mathf.Abs(afterRollbackStats - beforeRollbackStats) > 0.001f)
                {
                    throw new Exception("Stats rollback failed. Value was modified despite exception.");
                }
                if (afterRollbackInv != 1 || !wallet.ActiveSaveData.OwnedConsumableIds.Contains("TEST_ELIXIR_001"))
                {
                    throw new Exception("Inventory item restoration rollback failed.");
                }
                Debug.Log("[ConsumableItemTest] [Step 9] Successfully verified atomic transaction rollback on Disk I/O failure!");

                testResultStatus = "SUCCESS (All Consumable Checks & Rollback Verified)";
                Debug.Log("[ConsumableItemTest] ===== CONSUMABLE ITEM TEST COMPLETED WITH 100% SUCCESS =====");
            }
            catch (Exception ex)
            {
                testResultStatus = "FAILED: " + ex.Message;
                Debug.LogError($"[ConsumableItemTest] ===== CONSUMABLE ITEM TEST FAILED =====: {ex.Message}\n{ex.StackTrace}");
            }
        }

        /// <summary>
        /// 리플렉션을 통해 ItemMasterTable의 private 사전에 테스트용 소모품 아이템 강제 주입
        /// </summary>
        private void InjectTestConsumableItem(ItemMasterTable itemTable)
        {
            try
            {
                // private readonly Dictionary<string, ItemData> _table 조회
                FieldInfo tableField = typeof(ItemMasterTable).GetField("_table", BindingFlags.NonPublic | BindingFlags.Instance);
                if (tableField == null)
                {
                    throw new Exception("Failed to query '_table' field from ItemMasterTable via reflection.");
                }

                var table = tableField.GetValue(itemTable) as Dictionary<string, ItemMasterTable.ItemData>;
                if (table == null)
                {
                    throw new Exception("Table field object casting to Dictionary failed.");
                }

                // 테스트용 소모품 생성
                ItemMasterTable.ItemData testItem = new ItemMasterTable.ItemData
                {
                    ItemId = "TEST_ELIXIR_001",
                    DisplayName = "테스트용 분석 비약",
                    Category = ItemMasterTable.ItemCategory.Consumable,
                    Rarity = ItemRarity.Rare,
                    Price = 1500L,
                    BonusAnalysis = 0.75f,
                    BonusNegotiation = 0.0f,
                    BonusManagement = 0.0f,
                    BonusResilience = 0.0f,
                    SpecialEffect = "분석력 스탯을 영구적으로 +0.75 만큼 증가시킵니다."
                };

                // 강제 등록 (덮어쓰기 허용)
                table[testItem.ItemId] = testItem;
                Debug.Log("[ConsumableItemTest] Injected 'TEST_ELIXIR_001' into ItemMasterTable successfully.");
            }
            catch (Exception ex)
            {
                throw new Exception($"Reflection injection failed: {ex.Message}", ex);
            }
        }
    }
}
