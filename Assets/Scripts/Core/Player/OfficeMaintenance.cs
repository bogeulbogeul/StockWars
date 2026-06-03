using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_07: 오피스 레벨(1~4)에 따른 주간 감가상각 유지비를 정산하고 차감하는 월세 납부 매니저 (Office Maintenance Manager).
    /// <para>
    /// 매주 월요일 00:00 UTC 기점 정산 이벤트(`WeeklySettlementEvent`) 발생 시 의무 가동됩니다.
    /// </para>
    /// <para>
    /// 가용 현금보다 월세가 비싸더라도 강제로 빼내어 현금이 0 이하(음수)로 가라앉게 유도함으로써 
    /// 자산 압류 엔진(Seizure Engine)의 기동 조건(현금 0G 이하)을 자연스럽게 촉발합니다.
    /// </para>
    /// </summary>
    public class OfficeMaintenance : Singleton<OfficeMaintenance>
    {
        // --------------------------------------------------------
        // 1. 이벤트 구독 설정
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            
            // 주간 금융 정산 이벤트 구독
            EventBus.Subscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<WeeklySettlementEvent>(OnWeeklySettlementProcessed);
        }

        // --------------------------------------------------------
        // 2. 주간 유지비 정산 처리
        // --------------------------------------------------------

        private void OnWeeklySettlementProcessed(WeeklySettlementEvent e)
        {
            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            // A. 플레이어의 현재 오피스 레벨 획득 및 검증 (LV 1 ~ 5)
            int officeLevel = Math.Clamp(saveData.OfficeLevel, 1, 5);

            // B. 오피스 레벨별 주간 유지비 산출 (기획서 매트릭스)
            long maintenanceFee = GetMaintenanceFee(officeLevel);

            Debug.Log($"[OfficeMaintenance] 주간 오피스 유지비 청구 가동. 오피스 레벨: LV {officeLevel}, 청구 금액: {maintenanceFee:N0}G (온라인/오프라인 소급={e.IsOfflineBatch})");

            // C. ── 중요 기획 구현: 강제 차감 (Overdraft/Negative Cash Allowed) ──
            // 현금이 부족하더라도 예외나 거래 실패 처리를 띄우지 않고 강제로 지갑 잔고를 음수로 깎습니다.
            // 이를 통해 자연스럽게 현금 0 이하 트리거를 만족시켜 '자산 압류 유예 돌입' 상태로 진입하게 유도합니다.
            long prevCash = saveData.Gold;
            saveData.Gold = Math.Clamp(saveData.Gold - maintenanceFee, long.MinValue, long.MaxValue);

            // D. 지갑 변동 전역 이벤트 전송 (HUD 갱신 유도)
            EventBus.Publish(new CashChangedEvent
            {
                PreviousCash = prevCash,
                NewCash = saveData.Gold,
                Delta = -maintenanceFee
            });

            Debug.Log($"[OfficeMaintenance] 유지비 강제 납부 완료. 이전 잔고={prevCash:N0}G, 차감 후 잔고={saveData.Gold:N0}G");

            // E. 월세 납부 결과 전역 알림 발행 (UI 및 우편함 독촉 연출용)
            EventBus.Publish(new OfficeMaintenanceProcessedEvent
            {
                OfficeLevel = officeLevel,
                FeeCharged = maintenanceFee,
                NewGoldBalance = saveData.Gold,
                SettlementTime = e.SettlementTime
            });

            // F. ── 강제적 보안 무결성 동기화 및 즉시 디스크 저장 ──
            // 현금이 임의적으로 변동되었으므로 무결성 섀도를 동기화하고 강제 디스크 저장을 실행합니다.
            if (DataIntegrity.Instance != null)
            {
                DataIntegrity.Instance.SyncShadows();
            }

            if (AutoSaveRouter.Instance != null)
            {
                AutoSaveRouter.Instance.TriggerInstantSave();
            }
        }

        // --------------------------------------------------------
        // 3. 유지비 가격 매칭 헬퍼
        // --------------------------------------------------------

        /// <summary>
        /// 오피스 단계에 해당하는 주당 비용을 반환합니다.
        /// </summary>
        public long GetMaintenanceFee(int level)
        {
            switch (level)
            {
                case 1: return 500L;    // LV 1 고시원
                case 2: return 1200L;   // LV 2 로프트 (수정: 2레벨)
                case 3: return 2800L;   // LV 3 오피스텔 (수정: 3레벨)
                case 4: return 5000L;   // LV 4 트레이딩 룸 (수정: 4레벨)
                case 5: return 10000L;  // LV 5 펜트하우스 (추가: 5레벨 최종)
                default: return 500L;
            }
        }
    }

    // --------------------------------------------------------
    // 4. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 주간 오피스 감가상각 유지비 정산 및 차감이 성공적으로 완료되었을 때 발행되는 알림 이벤트 (UI 연동용)
    /// </summary>
    public struct OfficeMaintenanceProcessedEvent
    {
        /// <summary>청구 당시의 오피스 단계 (LV 1~4)</summary>
        public int OfficeLevel;

        /// <summary>청구되어 차감된 주간 월세 금액 (Gold)</summary>
        public long FeeCharged;

        /// <summary>차감 완료 후의 플레이어 가용 현금 잔고 (Gold)</summary>
        public long NewGoldBalance;

        /// <summary>처리가 완료된 정산 기준 UTC 시각</summary>
        public DateTime SettlementTime;
    }
}
