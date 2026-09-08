using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// MOD_GDD_03-2: 모던 프레임 가구 상점 카탈로그 UI.
    /// 3대 재화 [L$로 구매], [좋아요 코인으로 구매], [추억의 모래시계로 교환] 탭을 지원하며,
    /// 매일 갱신되는 일일 테마 로테이션 풀(6~10종) 조회, 구매/교환 및 인벤토리(SaveData.OwnedFurnitureIds) 연동을 총괄합니다.
    /// </summary>
    public class UIFurnitureShop : MonoBehaviour
    {
        public enum CurrencyTab
        {
            Gold,               // [L$] (골드)
            LikeCoin,           // [좋아요 코인]
            MemorySandglass     // [추억의 모래시계]
        }

        [Header("Currency Headers")]
        [SerializeField] private TMP_Text _goldText;
        [SerializeField] private TMP_Text _likeCoinsText;
        [SerializeField] private TMP_Text _sandglassesText;

        [Header("Theme Banner (Optional)")]
        [SerializeField] private TMP_Text _featuredThemeBannerText;
        [SerializeField] private TMP_Text _featuredThemeSubText;

        [Header("Currency Filter Tabs")]
        [SerializeField] private Button _tabGoldButton;
        [SerializeField] private Button _tabLikeCoinButton;
        [SerializeField] private Button _tabSandglassButton;

        [SerializeField] private Color _activeTabColor = new Color(0.77f, 0.64f, 0.51f, 1f); // 탠 브라운
        [SerializeField] private Color _inactiveTabColor = new Color(0.90f, 0.85f, 0.76f, 1f); // 샌드 베이지

        [Header("Category Filter Tabs")]
        [SerializeField] private Button _catAllButton;
        [SerializeField] private Button _catSkinButton;      // 벽지/바닥
        [SerializeField] private Button _catDeskChairButton; // 책상/의자
        [SerializeField] private Button _catBedSofaButton;   // 침대/소파
        [SerializeField] private Button _catDecorRugButton;  // 장식품/러그
        [SerializeField] private Button _catStorageButton;   // 수납/기타

        [Header("Catalog List Bindings")]
        [SerializeField] private Transform _catalogContentContainer;
        [SerializeField] private GameObject _itemCardPrefab;
        [SerializeField] private Button _closeButton;

        // 런타임 필터 상태
        private CurrencyTab _currentCurrencyTab = CurrencyTab.Gold;
        private ItemMasterTable.FurnitureSubCategory? _currentSubCatFilter = null;
        private readonly List<GameObject> _spawnedCards = new();

        private void Awake()
        {
            BindButtons();
        }

        private void OnEnable()
        {
            RefreshCurrencies();
            RenderCatalog();
        }

        private void BindButtons()
        {
            if (_tabGoldButton != null) _tabGoldButton.onClick.AddListener(() => SetCurrencyTab(CurrencyTab.Gold));
            if (_tabLikeCoinButton != null) _tabLikeCoinButton.onClick.AddListener(() => SetCurrencyTab(CurrencyTab.LikeCoin));
            if (_tabSandglassButton != null) _tabSandglassButton.onClick.AddListener(() => SetCurrencyTab(CurrencyTab.MemorySandglass));

            if (_catAllButton != null) _catAllButton.onClick.AddListener(() => SetCategoryFilter(null));
            if (_catSkinButton != null) _catSkinButton.onClick.AddListener(() => SetCategoryFilter(ItemMasterTable.FurnitureSubCategory.Wallpaper));
            if (_catDeskChairButton != null) _catDeskChairButton.onClick.AddListener(() => SetCategoryFilter(ItemMasterTable.FurnitureSubCategory.Desk));
            if (_catBedSofaButton != null) _catBedSofaButton.onClick.AddListener(() => SetCategoryFilter(ItemMasterTable.FurnitureSubCategory.Bed));
            if (_catDecorRugButton != null) _catDecorRugButton.onClick.AddListener(() => SetCategoryFilter(ItemMasterTable.FurnitureSubCategory.Decor));
            if (_catStorageButton != null) _catStorageButton.onClick.AddListener(() => SetCategoryFilter(ItemMasterTable.FurnitureSubCategory.Storage));

            if (_closeButton != null) _closeButton.onClick.AddListener(CloseShop);
        }

        public void OpenShop()
        {
            gameObject.SetActive(true);
            RefreshCurrencies();
            RenderCatalog();
        }

        public void CloseShop()
        {
            gameObject.SetActive(false);
        }

        public void SetCurrencyTab(CurrencyTab tab)
        {
            _currentCurrencyTab = tab;
            UpdateTabVisuals();
            RenderCatalog();
        }

        public void SetCategoryFilter(ItemMasterTable.FurnitureSubCategory? subCat)
        {
            _currentSubCatFilter = subCat;
            RenderCatalog();
        }

        private void UpdateTabVisuals()
        {
            SetButtonColor(_tabGoldButton, _currentCurrencyTab == CurrencyTab.Gold);
            SetButtonColor(_tabLikeCoinButton, _currentCurrencyTab == CurrencyTab.LikeCoin);
            SetButtonColor(_tabSandglassButton, _currentCurrencyTab == CurrencyTab.MemorySandglass);
        }

        private void SetButtonColor(Button btn, bool isActive)
        {
            if (btn == null) return;
            var img = btn.GetComponent<Image>();
            if (img != null)
            {
                img.color = isActive ? _activeTabColor : _inactiveTabColor;
            }
        }

        public void RefreshCurrencies()
        {
            if (WalletManager.Instance == null) return;

            long gold = WalletManager.Instance.GetCash();
            long likeCoins = WalletManager.Instance.GetLikeCoins();
            int sandglasses = WalletManager.Instance.GetMemorySandglasses();

            if (_goldText != null) _goldText.text = $"{gold:N0} L$";
            if (_likeCoinsText != null) _likeCoinsText.text = $"{likeCoins:N0} 좋아요";
            if (_sandglassesText != null) _sandglassesText.text = $"{sandglasses:N0} 개";
        }

        /// <summary>
        /// 아이템 마스터 테이블과 세이브 데이터를 바탕으로 일일 테마 로테이션 카탈로그 리스트를 렌더링합니다.
        /// </summary>
        public void RenderCatalog()
        {
            ClearCatalog();

            if (ItemMasterTable.Instance == null || _catalogContentContainer == null) return;

            var saveData = WalletManager.Instance?.ActiveSaveData;
            var dailyFurniture = ItemMasterTable.Instance.GetDailyFurnitureShopPool(saveData);
            if (dailyFurniture == null || dailyFurniture.Count == 0) return;

            // 테마 배너 텍스트 갱신
            if (_featuredThemeBannerText != null)
            {
                string themeTag = saveData?.DailyFurnitureShopThemeTag ?? string.Empty;
                string themeDisplayName = ItemMasterTable.GetThemeDisplayName(themeTag);
                _featuredThemeBannerText.text = $"<b>오늘의 추천 테마: {themeDisplayName}</b>";
            }
            if (_featuredThemeSubText != null)
            {
                _featuredThemeSubText.text = "매일 자정 새로운 테마 라인업이 입고됩니다!";
            }

            var ownedIds = saveData?.OwnedFurnitureIds ?? new List<string>();

            foreach (var item in dailyFurniture)
            {
                // 세부 카테고리 필터링
                if (_currentSubCatFilter.HasValue && item.SubCategory != _currentSubCatFilter.Value)
                {
                    // 벽지/바닥 묶음 처리
                    if (_currentSubCatFilter.Value == ItemMasterTable.FurnitureSubCategory.Wallpaper &&
                        (item.SubCategory == ItemMasterTable.FurnitureSubCategory.Wallpaper || item.SubCategory == ItemMasterTable.FurnitureSubCategory.Floor || item.SubCategory == ItemMasterTable.FurnitureSubCategory.Tile))
                    {
                        // 일치
                    }
                    else if (_currentSubCatFilter.Value == ItemMasterTable.FurnitureSubCategory.Desk &&
                        (item.SubCategory == ItemMasterTable.FurnitureSubCategory.Desk || item.SubCategory == ItemMasterTable.FurnitureSubCategory.Chair))
                    {
                        // 일치
                    }
                    else
                    {
                        continue;
                    }
                }

                // 재화 분기 (GDD 규격 가격 매핑)
                long itemCost = item.Price;
                string currencyUnit = "L$";
                bool canAfford = false;

                switch (_currentCurrencyTab)
                {
                    case CurrencyTab.Gold:
                        currencyUnit = "L$";
                        itemCost = item.Price > 0 ? item.Price : 3000L;
                        canAfford = WalletManager.Instance != null && WalletManager.Instance.GetCash() >= itemCost;
                        break;

                    case CurrencyTab.LikeCoin:
                        currencyUnit = "좋아요";
                        itemCost = Math.Max(10, item.Price / 100); // 30~100 좋아요 코인
                        canAfford = WalletManager.Instance != null && WalletManager.Instance.GetLikeCoins() >= itemCost;
                        break;

                    case CurrencyTab.MemorySandglass:
                        currencyUnit = "모래시계";
                        itemCost = Math.Max(1, item.Price / 5000); // 1~3 모래시계
                        canAfford = WalletManager.Instance != null && WalletManager.Instance.GetMemorySandglasses() >= (int)itemCost;
                        break;
                }

                bool isOwned = ownedIds.Contains(item.ItemId);

                GameObject cardGo;
                if (_itemCardPrefab != null)
                {
                    cardGo = Instantiate(_itemCardPrefab, _catalogContentContainer);
                }
                else
                {
                    cardGo = CreateDefaultCardGameObject(item, itemCost, currencyUnit, isOwned, canAfford);
                }

                _spawnedCards.Add(cardGo);
            }
        }

        private void ExecutePurchase(ItemMasterTable.ItemData item, long cost, CurrencyTab currency)
        {
            if (WalletManager.Instance == null) return;

            bool paymentSuccess = false;

            switch (currency)
            {
                case CurrencyTab.Gold:
                    paymentSuccess = WalletManager.Instance.SpendCash(cost);
                    break;
                case CurrencyTab.LikeCoin:
                    paymentSuccess = WalletManager.Instance.SpendLikeCoins(cost);
                    break;
                case CurrencyTab.MemorySandglass:
                    paymentSuccess = WalletManager.Instance.SpendMemorySandglasses((int)cost);
                    break;
            }

            if (paymentSuccess)
            {
                if (currency == CurrencyTab.Gold)
                {
                    WalletManager.Instance.ActiveSaveData.WeeklyFurnitureSpending += cost;
                }

                var ownedList = WalletManager.Instance.ActiveSaveData.OwnedFurnitureIds;
                if (!ownedList.Contains(item.ItemId))
                {
                    ownedList.Add(item.ItemId);
                }

                Debug.Log($"<color=#00FF7F>[UIFurnitureShop] 가구 구매 완료: {item.DisplayName} ({item.ItemId}) - {cost} {currency} (주간 누적 가구지출: {WalletManager.Instance.ActiveSaveData.WeeklyFurnitureSpending:N0}G)</color>");

                RefreshCurrencies();
                RenderCatalog();
            }
            else
            {
                Debug.LogWarning($"[UIFurnitureShop] 잔여 재화 부족으로 구매 실패!");
            }
        }

        private void ClearCatalog()
        {
            foreach (var card in _spawnedCards)
            {
                if (card != null) Destroy(card);
            }
            _spawnedCards.Clear();
        }

        private GameObject CreateDefaultCardGameObject(ItemMasterTable.ItemData item, long cost, string currencyUnit, bool isOwned, bool canAfford)
        {
            GameObject card = new GameObject($"Card_{item.ItemId}");
            card.transform.SetParent(_catalogContentContainer, false);

            var rt = card.AddComponent<RectTransform>();
            rt.sizeDelta = new Vector2(190, 230);

            var bg = card.AddComponent<Image>();
            bg.color = isOwned ? new Color(0.92f, 0.90f, 0.88f, 0.9f) : new Color(0.97f, 0.95f, 0.91f, 1f);

            var vlg = card.AddComponent<VerticalLayoutGroup>();
            vlg.padding = new RectOffset(10, 10, 10, 10);
            vlg.spacing = 5f;
            vlg.childAlignment = TextAnchor.MiddleCenter;
            vlg.childControlWidth = true;
            vlg.childControlHeight = false;

            // 테마 뱃지 & 설치 규격
            string themeBadge = ItemMasterTable.GetThemeBadge(item.ThemeTag);
            string gridInfo = item.Install == ItemMasterTable.InstallType.Skin ? "스킨 (전체 적용)" : $"{item.GridW}x{item.GridH} 타일";

            GameObject themeGo = new GameObject("ThemeBadgeText");
            themeGo.transform.SetParent(card.transform, false);
            var themeTxt = themeGo.AddComponent<TextMeshProUGUI>();
            themeTxt.text = $"<color=#705335><b>[{themeBadge}]</b></color> <color=#8C7B6B><size=85%>{gridInfo}</size></color>";
            themeTxt.fontSize = 11;
            themeTxt.alignment = TextAlignmentOptions.Center;

            // 이름
            GameObject nameGo = new GameObject("NameText");
            nameGo.transform.SetParent(card.transform, false);
            var nameTxt = nameGo.AddComponent<TextMeshProUGUI>();
            nameTxt.text = $"<b>{item.DisplayName}</b>";
            nameTxt.fontSize = 13;
            nameTxt.color = new Color(0.24f, 0.17f, 0.12f, 1f);
            nameTxt.alignment = TextAlignmentOptions.Center;
            nameTxt.enableWordWrapping = true;

            // 효과 설명 / 비고
            if (!string.IsNullOrEmpty(item.SpecialEffect))
            {
                GameObject descGo = new GameObject("DescText");
                descGo.transform.SetParent(card.transform, false);
                var descTxt = descGo.AddComponent<TextMeshProUGUI>();
                descTxt.text = $"<size=80%><color=#6A6055>{item.SpecialEffect}</color></size>";
                descTxt.fontSize = 10;
                descTxt.alignment = TextAlignmentOptions.Center;
                descTxt.enableWordWrapping = true;
            }

            // 구매 버튼
            GameObject btnGo = new GameObject("BuyButton");
            btnGo.transform.SetParent(card.transform, false);
            var btnImg = btnGo.AddComponent<Image>();
            
            if (isOwned)
            {
                btnImg.color = new Color(0.72f, 0.70f, 0.68f, 1f);
            }
            else
            {
                btnImg.color = canAfford ? new Color(0.78f, 0.64f, 0.50f, 1f) : new Color(0.85f, 0.45f, 0.45f, 1f);
            }

            var btn = btnGo.AddComponent<Button>();
            btn.interactable = !isOwned && canAfford;

            var btnTxtGo = new GameObject("BtnText");
            btnTxtGo.transform.SetParent(btnGo.transform, false);
            var btnTxt = btnTxtGo.AddComponent<TextMeshProUGUI>();
            
            if (isOwned)
            {
                btnTxt.text = "보유 중";
            }
            else
            {
                btnTxt.text = $"{cost:N0} {currencyUnit}";
            }

            btnTxt.fontSize = 12;
            btnTxt.color = Color.white;
            btnTxt.alignment = TextAlignmentOptions.Center;

            var btnRt = btnGo.GetComponent<RectTransform>();
            btnRt.sizeDelta = new Vector2(170, 34);

            var currTab = _currentCurrencyTab;
            btn.onClick.AddListener(() =>
            {
                ExecutePurchase(item, cost, currTab);
            });

            return card;
        }
    }
}

