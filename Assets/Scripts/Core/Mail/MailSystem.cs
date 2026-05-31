using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 스마트폰 메일의 종류를 정의합니다.
    /// </summary>
    public enum MailType
    {
        System,   // 시스템 메일 (압류, 경고 등)
        Social,   // 소셜 메일 (인맥, 대화, 보상 수령 가능)
        Market,   // 시장 동향 보고서 메일
        Shadow    // 쉐도우 메일 (읽음 처리 후 일정 시간 뒤에 폭사하는 비밀 첩보 우편)
    }

    /// <summary>
    /// 플레이어의 스마트폰 메일함에 저장 및 직렬화되는 개별 메일 데이터 인스턴스.
    /// </summary>
    [Serializable]
    public class MailInstance
    {
        public string MailId;            // 메일 고유 식별자 (GUID)
        public MailType Type;            // 메일 타입
        public string Sender;            // 발신자 이름
        public string Title;             // 제목
        public string Content;           // 내용
        public long GoldReward;          // 첨부된 Gold 보상액 (0이면 보상 없음)
        public string ItemRewardId;      // 첨부된 아이템 ID (null/빈 값이면 보상 없음)
        public DateTime SentTime;        // 메일 수신 시간 (UTC)
        public bool IsRead;              // 읽음 상태 여부
        public DateTime? ReadTime;       // 처음 읽은 시간 (쉐도우 메일 폭파 타이머용, UTC)
        public bool IsRewardCollected;   // 보상 수령 여부
    }

    /// <summary>
    /// MOD_GDD_11 [메일 시스템] 스마트폰 메일 발송, 수령, 보상 정산 및 쉐도우 메일 라이프사이클 관리 핵심 매니저.
    /// </summary>
    public class MailSystem : Singleton<MailSystem>
    {
        private const int MAX_MAIL_BOX_LIMIT = 50; // 메일함 폭주 방지 최대 크기 제한

        protected override void Awake()
        {
            base.Awake();
            // 게임 틱 주기마다 쉐도우 메일 만료 및 정리를 위해 구독
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        private void OnGameTick(GameTickEvent e)
        {
            CheckExpiredShadowMails();
        }

        /// <summary>
        /// 신규 메일을 생성하여 플레이어 스마트폰 메일함에 발송 및 저장합니다.
        /// </summary>
        /// <param name="type">우편 타입</param>
        /// <param name="sender">발신자 명칭</param>
        /// <param name="title">우편 제목</param>
        /// <param name="content">우편 본문</param>
        /// <param name="goldReward">첨부 골드</param>
        /// <param name="itemRewardId">첨부 아이템 ID</param>
        /// <returns>발송 성공 여부</returns>
        public string SendMail(MailType type, string sender, string title, string content, 
                               long goldReward = 0, string itemRewardId = null)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null)
            {
                Debug.LogWarning("[MailSystem] 활성화된 세이브 데이터를 찾을 수 없어 메일을 발송할 수 없습니다.");
                return null;
            }

            var mails = wallet.ActiveSaveData.Mails;

            // 1. 메일함 최대치 도달 시 가장 오래된 읽은 메일 또는 하위 메일 순차적 자동 삭제 정리
            if (mails.Count >= MAX_MAIL_BOX_LIMIT)
            {
                var oldestRead = mails.FirstOrDefault(m => m.IsRead && m.Type != MailType.Shadow);
                if (oldestRead != null)
                {
                    mails.Remove(oldestRead);
                    Debug.Log($"[MailSystem] 메일함 한도 초과({MAX_MAIL_BOX_LIMIT}개)로 오래된 읽은 메일({oldestRead.Title})을 자동 정리했습니다.");
                }
                else
                {
                    mails.RemoveAt(0); // 읽지 않은 메일이라도 밀어냄
                }
            }

            // 2. 메일 인스턴스 패키징
            var newMail = new MailInstance
            {
                MailId = Guid.NewGuid().ToString("D"),
                Type = type,
                Sender = sender,
                Title = title,
                Content = content,
                GoldReward = goldReward,
                ItemRewardId = itemRewardId,
                SentTime = DateTime.UtcNow,
                IsRead = false,
                ReadTime = null,
                IsRewardCollected = false
            };

            mails.Add(newMail);
            Debug.Log($"[MailSystem] ★ 새 우편 수신! [{sender}] - {title}");

            // 3. 전역 알림용 이벤트 발행
            EventBus.Publish(new MailReceivedEvent
            {
                MailId = newMail.MailId,
                Sender = sender,
                Title = title,
                Type = type
            });

            return newMail.MailId;
        }

        /// <summary>
        /// 플레이어가 메일을 클릭하여 읽음 처리합니다. 
        /// 쉐도우 메일일 경우 폭파 타이머 가동을 시작합니다.
        /// </summary>
        public void ReadMail(string mailId)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var mail = wallet.ActiveSaveData.Mails.FirstOrDefault(m => m.MailId == mailId);
            if (mail == null) return;

            if (!mail.IsRead)
            {
                mail.IsRead = true;
                mail.ReadTime = DateTime.UtcNow;
                Debug.Log($"[MailSystem] 우편 읽음 완료: {mail.Title}");

                if (mail.Type == MailType.Shadow)
                {
                    Debug.Log($"[MailSystem] [Shadow Mail] 읽음 감지. 폭사 디스트로이 타이머 시작 (수명 5분).");
                }

                // 자동 세이브 트리거
                TriggerAutoSave();
            }
        }

        /// <summary>
        /// 특정 우편에 첨부되어 있는 보상(Gold 및 아이템)을 일괄 수령합니다.
        /// </summary>
        public bool CollectMailReward(string mailId)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return false;

            var mail = wallet.ActiveSaveData.Mails.FirstOrDefault(m => m.MailId == mailId);
            if (mail == null || mail.IsRewardCollected) return false;

            // 1. 골드 보상 수령
            if (mail.GoldReward > 0)
            {
                wallet.AddCash(mail.GoldReward);
                Debug.Log($"[MailSystem] 우편 보상 골드 수령: +{mail.GoldReward}G (현재 잔고: {wallet.GetCash()}G)");
            }

            // 2. 아이템 보상 수령 (가구 또는 소모품 등 구분 처리)
            if (!string.IsNullOrEmpty(mail.ItemRewardId))
            {
                var itemTable = ItemMasterTable.Instance;
                if (itemTable == null)
                {
                    Debug.LogError("[MailSystem] ItemMasterTable Instance가 활성화되어 있지 않아 아이템 보상을 지급할 수 없습니다!");
                    return false;
                }

                var item = itemTable.GetItem(mail.ItemRewardId);
                if (item == null)
                {
                    Debug.LogError($"[MailSystem] 우편 보상 아이템 ID '{mail.ItemRewardId}'가 ItemMasterTable에 등록되어 있지 않습니다. 수령을 안전하게 차단합니다.");
                    return false; // 무결성 보존을 위한 리턴
                }

                if (item.Category == ItemMasterTable.ItemCategory.Furniture)
                {
                    wallet.ActiveSaveData.OwnedFurnitureIds.Add(mail.ItemRewardId);
                    Debug.Log($"[MailSystem] 우편 보상 가구 획득: '{item.DisplayName}' ({mail.ItemRewardId})");
                }
                else if (item.Category == ItemMasterTable.ItemCategory.Consumable)
                {
                    wallet.ActiveSaveData.OwnedConsumableIds.Add(mail.ItemRewardId);
                    Debug.Log($"[MailSystem] 우편 보상 소모품 획득: '{item.DisplayName}' ({mail.ItemRewardId})");
                }
                else if (item.Category == ItemMasterTable.ItemCategory.Apparel)
                {
                    wallet.ActiveSaveData.OwnedApparelIds.Add(mail.ItemRewardId);
                    Debug.Log($"[MailSystem] 우편 보상 의상 획득: '{item.DisplayName}' ({mail.ItemRewardId})");
                }
            }

            mail.IsRewardCollected = true;
            TriggerAutoSave();
            return true;
        }

        /// <summary>
        /// 플레이어가 우편을 수동으로 삭제합니다.
        /// </summary>
        public void DeleteMail(string mailId)
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var mail = wallet.ActiveSaveData.Mails.FirstOrDefault(m => m.MailId == mailId);
            if (mail != null)
            {
                wallet.ActiveSaveData.Mails.Remove(mail);
                Debug.Log($"[MailSystem] 우편 삭제 완료: {mail.Title}");
                TriggerAutoSave();
            }
        }

        /// <summary>
        /// 모든 소셜(Social) 계열 메일의 첨부 보상을 일괄 수령하고 메일을 자동 일괄 삭제합니다.
        /// </summary>
        public void CollectAllSocialRewards()
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var socialMails = wallet.ActiveSaveData.Mails
                                    .Where(m => m.Type == MailType.Social && !m.IsRewardCollected)
                                    .ToList();

            if (socialMails.Count == 0) return;

            Debug.Log($"[MailSystem] 소셜 우편 보상 일괄 수령 시작 (총 {socialMails.Count}개)...");

            foreach (var mail in socialMails)
            {
                CollectMailReward(mail.MailId);
                // 보상 수령이 정상 완료된 우편은 편의를 위해 즉시 자동 소거
                wallet.ActiveSaveData.Mails.Remove(mail);
            }

            Debug.Log($"[MailSystem] 소셜 우편 일괄 수령 및 자동 청소 완수.");
            TriggerAutoSave();
        }

        /// <summary>
        /// 쉐도우 메일 중 열람한 시점으로부터 게임/실제 5분 이상 경과된 메일을 자동으로 영구 소멸시킵니다.
        /// </summary>
        private void CheckExpiredShadowMails()
        {
            var wallet = WalletManager.Instance;
            if (wallet == null || wallet.ActiveSaveData == null) return;

            var mails = wallet.ActiveSaveData.Mails;
            if (mails == null || mails.Count == 0) return;

            DateTime nowUtc = DateTime.UtcNow;
            bool anyRemoved = false;

            for (int i = mails.Count - 1; i >= 0; i--)
            {
                var mail = mails[i];
                if (mail.Type == MailType.Shadow && mail.IsRead && mail.ReadTime.HasValue)
                {
                    double elapsedSeconds = (nowUtc - mail.ReadTime.Value).TotalSeconds;
                    // 5분 = 300초 만료 처리
                    if (elapsedSeconds >= 300.0)
                    {
                        mails.RemoveAt(i);
                        anyRemoved = true;
                        Debug.Log($"[MailSystem] [Shadow Mail] 수명 만료로 자동 자폭 폭사: '{mail.Title}' (경과 시간: {elapsedSeconds:F1}초)");
                        
                        EventBus.Publish(new ShadowMailDestroyedEvent
                        {
                            MailId = mail.MailId,
                            Title = mail.Title
                        });
                    }
                }
            }

            if (anyRemoved)
            {
                TriggerAutoSave();
            }
        }

        private void TriggerAutoSave()
        {
            var io = IOManager.Instance;
            var wallet = WalletManager.Instance;
            if (io != null && wallet != null && wallet.ActiveSaveData != null)
            {
                int currentSlot = AutoSaveRouter.ActiveSlotIndex;
                try
                {
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
                    io.SaveGame(currentSlot, wallet.ActiveSaveData, meta);
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[MailSystem] 메일함 업데이트 자동 세이브 도중 경고: {ex.Message}");
                }
            }
        }
    }

    #region Events
    /// <summary>
    /// 스마트폰에 새로운 메일이 성공적으로 수신되었을 때 발행되는 전역 알림 이벤트.
    /// </summary>
    public struct MailReceivedEvent
    {
        public string MailId;
        public string Sender;
        public string Title;
        public MailType Type;
    }

    /// <summary>
    /// 쉐도우 메일이 열람 5분 경과로 자동 자폭 및 영구 삭제되었을 때 발행되는 이벤트.
    /// </summary>
    public struct ShadowMailDestroyedEvent
    {
        public string MailId;
        public string Title;
    }
    #endregion
}
