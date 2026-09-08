using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.Town
{
    /// <summary>
    /// MOD_GDD_03-2: 모던 프레임 가구 상점의 담당 NPC 줄리안(Julian) 상호작용 컨트롤러.
    /// 플레이어에게 인테리어 상담, 가구 카탈로그 제공 및 '단골 시공 거래처 문의를 통한 오피스 룸 증축/업그레이드' 의뢰를 처리합니다.
    /// </summary>
    public class JulianFurnitureShopNPC : MonoBehaviour
    {
        [Header("NPC Profile")]
        [SerializeField] private string _npcName = "줄리안 (Julian)";
        [SerializeField] private string _shopName = "모던 프레임 (Modern Frame)";

        [Header("UI Dialog / Popup Bindings")]
        [Tooltip("줄리안 대화창 루트 오브젝트")]
        [SerializeField] private GameObject _dialogueRoot;
        [SerializeField] private TMP_Text _npcNameText;
        [SerializeField] private TMP_Text _dialogueBodyText;
        [SerializeField] private Button _openShopButton;
        [SerializeField] private Button _requestOfficeUpgradeButton;
        [SerializeField] private Button _closeDialogueButton;

        [Header("Office Upgrade Modal Bindings")]
        [SerializeField] private GameObject _upgradeModalRoot;
        [SerializeField] private TMP_Text _upgradeTitleText;
        [SerializeField] private TMP_Text _currentLevelInfoText;
        [SerializeField] private TMP_Text _nextLevelInfoText;
        [SerializeField] private TMP_Text _upgradeCostText;
        [SerializeField] private TMP_Text _playerCashText;
        [SerializeField] private Button _confirmUpgradeButton;
        [SerializeField] private Button _cancelUpgradeButton;

        [Header("Furniture Shop UI Reference")]
        [SerializeField] private GameObject _furnitureShopUIRoot;

        // 대사 상수
        private const string DIALOGUE_GREET = 
            "오, 우리 귀한 파트너님 오셨군요! 차트에 갇혀 있느라 피로해진 눈을 정화할 시간이 필요해 보였어요. 모던 프레임에서는 매일매일 새로운 테마 시리즈 가구들이 로테이션으로 입고된답니다. 오늘의 추천 테마 가구들을 둘러보세요!";

        private const string DIALOGUE_UPGRADE_INQUIRY = 
            "프라이빗 마스코트, 네온 사이버, 레트로 아케이드, 펜트하우스 골드까지! 매일 자정마다 새로운 테마 가구들이 로테이션 입고됩니다. 마음에 드는 테마 가구를 수집해 나만의 오피스를 꾸며보세요!";

        private const string DIALOGUE_UPGRADE_MAX = 
            "매일 새로운 테마의 가구들이 트레이더님을 기다리고 있습니다. 마음에 드는 가구가 있다면 오늘 바로 오피스에 배치해 보세요!";

        private const string DIALOGUE_UPGRADE_SUCCESS = 
            "멋진 선택입니다! 구입하신 가구는 오피스로 즉시 배송해 드렸어요.";

        private const string DIALOGUE_UPGRADE_POOR = 
            "아쉬워라... 구매 비용이 조금 모자란 것 같아요. 시장에서 '수확'을 조금 더 거두신 뒤 다시 말씀해 주세요!";

        private void Start()
        {
            BindButtons();
            CloseAllModals();
        }

        private void BindButtons()
        {
            if (_openShopButton != null)
            {
                _openShopButton.onClick.RemoveAllListeners();
                _openShopButton.onClick.AddListener(OnOpenShopClicked);
            }

            if (_requestOfficeUpgradeButton != null)
            {
                _requestOfficeUpgradeButton.gameObject.SetActive(false); // 오피스 레벨 시스템 폐지에 따라 숨김 처리
            }

            if (_closeDialogueButton != null)
            {
                _closeDialogueButton.onClick.RemoveAllListeners();
                _closeDialogueButton.onClick.AddListener(CloseAllModals);
            }
        }

        /// <summary>
        /// 타운에서 플레이어가 줄리안 NPC 또는 가구점 간판을 클릭/터치했을 때 진입점
        /// </summary>
        public void Interact()
        {
            OpenDialogue(DIALOGUE_GREET);
        }

        public void OpenDialogue(string dialogueText)
        {
            if (_dialogueRoot == null)
            {
                FindOrCreateDialogueUI();
            }

            if (_dialogueRoot != null)
            {
                _dialogueRoot.SetActive(true);
            }

            if (_npcNameText != null)
            {
                _npcNameText.text = $"{_npcName} <color=#AAAAAA><size=70%>[{_shopName}]</size></color>";
            }

            if (_dialogueBodyText != null)
            {
                _dialogueBodyText.text = dialogueText;
            }

            if (_upgradeModalRoot != null)
            {
                _upgradeModalRoot.SetActive(false);
            }
        }

        /// <summary>
        /// 가구 카탈로그 상점 오픈
        /// </summary>
        public void OnOpenShopClicked()
        {
            if (_furnitureShopUIRoot != null)
            {
                _furnitureShopUIRoot.SetActive(true);
            }
            else
            {
                var shop = FindAnyObjectByType<UI.UIFurnitureShop>(FindObjectsInactive.Include);
                if (shop != null)
                {
                    shop.gameObject.SetActive(true);
                    shop.OpenShop();
                }
                else
                {
                    Debug.Log($"[JulianFurnitureShopNPC] 가구 상점 UI 오픈 요청됨.");
                }
            }
        }

        public void CloseAllModals()
        {
            if (_dialogueRoot != null) _dialogueRoot.SetActive(false);
            if (_upgradeModalRoot != null) _upgradeModalRoot.SetActive(false);
        }

        private void FindOrCreateDialogueUI()
        {
            // 하이라키 내 Dialogue / Julian 관련 UI 자동 바인딩 시도
            var transforms = GetComponentsInChildren<Transform>(true);
            foreach (var t in transforms)
            {
                string n = t.name;
                if (_dialogueRoot == null && n.IndexOf("Dialogue", StringComparison.OrdinalIgnoreCase) >= 0) _dialogueRoot = t.gameObject;
                if (_upgradeModalRoot == null && (n.IndexOf("Upgrade", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Expansion", StringComparison.OrdinalIgnoreCase) >= 0)) _upgradeModalRoot = t.gameObject;
            }
        }
    }
}
