using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;
using StockWars.Town;

namespace StockWars.UI
{
    /// <summary>
    /// 오피스 가구 수정/인테리어 편집 모드 UI 컨트롤러 (UIOfficeEditMode).
    /// <para>
    /// - 상단 탭바: [전체], [바닥], [벽면], [책상/의자], [침대], [장식], [수납] 가로 스크롤 탭
    /// - 상단 우측: [테마/정렬 드롭다운] (전체 테마, 프라이빗 마스코트, 네온 사이버, 내추럴 등)
    /// - 하단: 선택된 탭/테마에 맞게 필터링된 가구 카드 가로 스크롤 뷰
    /// - 카드 클릭 시 즉시 마우스 고스트 프리뷰로 배치 모드 진입
    /// </para>
    /// </summary>
    public class UIOfficeEditMode : MonoBehaviour
    {
        public enum EditCategory
        {
            All,        // 전체
            Floor,      // 바닥 & 타일
            Wall,       // 벽지 & 벽 장식 (창문, 문, 액자)
            Desk,       // 책상 & 워크스테이션
            Chair,      // 의자 & 소파 & 스윙
            Bed,        // 침대 & 트램펄린
            Decor,      // 장식품 & 러그 & 오르골 & 분수대
            Storage     // 수납 & 파티션 & 옷장 & 기둥
        }

        [Header("Toggle Button References")]
        [SerializeField] private Button _toggleEditButton;
        [SerializeField] private TMP_Text _toggleButtonText;

        [Header("Catalog Drawer References")]
        [SerializeField] private GameObject _catalogDrawerPanel;
        [SerializeField] private Transform _cardContentContainer;
        [SerializeField] private TMP_Dropdown _themeFilterDropdown;
        [SerializeField] private Button _doneButton;
        [SerializeField] private Button _rotateButton;
        [SerializeField] private Button _removeButton;
        [SerializeField] private Button _cancelButton;

        [Header("Search Bar Filter")]
        [SerializeField] private TMP_InputField _searchInputField;

        [Header("Category Tabs")]
        [SerializeField] private Button _tabAllButton;
        [SerializeField] private Button _tabFloorButton;
        [SerializeField] private Button _tabWallButton;
        [SerializeField] private Button _tabDeskButton;
        [SerializeField] private Button _tabChairButton;
        [SerializeField] private Button _tabBedButton;
        [SerializeField] private Button _tabDecorButton;
        [SerializeField] private Button _tabStorageButton;

        [Header("External UI Linking")]
        [SerializeField] private UIFurnitureShop _furnitureShop;

        [Header("Default Fallback Catalog Items")]
        [SerializeField] private List<string> _fallbackItemIds = new()
        {
            "BasicWindow",
            "BasicDoor",
            "BasicSofa",
            "WoodBed",
            "WoodChair",
            "WoodCloset",
            "MonsteraPot",
            "WoodFloor",
            "IvoryWallPaper",
            "FURN_DESK_NS_001",
            "FURN_CHAIR_NS_001",
            "FURN_BED_NS_001",
            "FURN_DECOR_NS_001",
            "FURN_BED_PM_001",
            "FURN_CHAIR_PM_001",
            "FURN_DESK_PM_001",
            "FURN_DECOR_PM_001",
            "FURN_DECOR_PM_002",
            "FURN_WALL_PM_DOOR"
        };

        [Header("Styling Colors")]
        [SerializeField] private Color _activeTabColor = new Color(0.78f, 0.64f, 0.50f, 1f); // 웜 베이지 브라운
        [SerializeField] private Color _inactiveTabColor = new Color(0.24f, 0.22f, 0.28f, 0.95f); // 딥 다크 톤
        [SerializeField] private Color _activeEditColor = new Color(0.18f, 0.65f, 0.38f, 1f);
        [SerializeField] private Color _normalButtonColor = new Color(0.20f, 0.18f, 0.24f, 0.95f);
        [SerializeField] private Color _cardBgColor = new Color(0.18f, 0.18f, 0.22f, 0.90f);
        [SerializeField] private Color _cardHoverColor = new Color(0.30f, 0.28f, 0.35f, 1f);
        [SerializeField] private Color _goldAccentColor = new Color(0.96f, 0.78f, 0.38f, 1f);

        // 런타임 필터 상태
        private EditCategory _currentCategory = EditCategory.All;
        private string _selectedThemeTag = string.Empty; // string.Empty = 전체 테마
        private string _searchKeyword = string.Empty;
        private bool _isInitialized = false;
        private readonly List<GameObject> _spawnedCards = new();
        private readonly List<Button> _categoryButtons = new();

        private void Awake()
        {
            InitializeUI();
            EventBus.Subscribe<OfficeEditModeChangedEvent>(OnEditModeChanged);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<OfficeEditModeChangedEvent>(OnEditModeChanged);
        }

        private void Start()
        {
            RefreshUIState(OfficeEditController.Instance != null && OfficeEditController.Instance.IsEditMode);
        }

        // --------------------------------------------------------
        // 1. 이벤트 및 상태 반응
        // --------------------------------------------------------

        private void OnEditModeChanged(OfficeEditModeChangedEvent e)
        {
            RefreshUIState(e.IsEditMode);
        }

        public void RefreshUIState(bool isEditMode)
        {
            if (_catalogDrawerPanel != null)
            {
                _catalogDrawerPanel.SetActive(isEditMode);
            }

            if (_toggleButtonText != null)
            {
                _toggleButtonText.text = isEditMode ? "<b>✅ 편집 완료</b>" : "<b>🔨 가구 편집</b>";
            }

            if (_toggleEditButton != null)
            {
                var img = _toggleEditButton.GetComponent<Image>();
                if (img != null)
                {
                    img.color = isEditMode ? _activeEditColor : _normalButtonColor;
                }
            }

            if (isEditMode)
            {
                UpdateTabVisuals();
                PopulateCatalogCards();
            }
        }

        // --------------------------------------------------------
        // 2. 카테고리 탭, 테마 드롭다운 & 검색 필터링
        // --------------------------------------------------------

        public void SetCategoryFilter(EditCategory category)
        {
            _currentCategory = category;
            UpdateTabVisuals();
            PopulateCatalogCards();
        }

        public void SetThemeFilter(string themeTag)
        {
            _selectedThemeTag = themeTag;
            PopulateCatalogCards();
        }

        public void SetSearchKeyword(string keyword)
        {
            _searchKeyword = keyword != null ? keyword.Trim() : string.Empty;
            PopulateCatalogCards();
        }

        private void UpdateTabVisuals()
        {
            SetButtonTabColor(_tabAllButton, _currentCategory == EditCategory.All);
            SetButtonTabColor(_tabFloorButton, _currentCategory == EditCategory.Floor);
            SetButtonTabColor(_tabWallButton, _currentCategory == EditCategory.Wall);
            SetButtonTabColor(_tabDeskButton, _currentCategory == EditCategory.Desk);
            SetButtonTabColor(_tabChairButton, _currentCategory == EditCategory.Chair);
            SetButtonTabColor(_tabBedButton, _currentCategory == EditCategory.Bed);
            SetButtonTabColor(_tabDecorButton, _currentCategory == EditCategory.Decor);
            SetButtonTabColor(_tabStorageButton, _currentCategory == EditCategory.Storage);
        }

        private void SetButtonTabColor(Button btn, bool isActive)
        {
            if (btn == null) return;
            var img = btn.GetComponent<Image>();
            if (img != null)
            {
                img.color = isActive ? _activeTabColor : _inactiveTabColor;
            }
            var txt = btn.GetComponentInChildren<TMP_Text>();
            if (txt != null)
            {
                txt.color = isActive ? Color.white : new Color(0.8f, 0.8f, 0.8f, 0.9f);
            }
        }

        // --------------------------------------------------------
        // 3. 하단 가로 카탈로그 카드 채우기
        // --------------------------------------------------------

        public void PopulateCatalogCards()
        {
            if (_cardContentContainer == null) return;

            // 기존 카드 정리
            foreach (var c in _spawnedCards)
            {
                if (c != null) Destroy(c);
            }
            _spawnedCards.Clear();

            // 보유한 아이템 목록 수집
            List<string> displayItems = new();

            if (WalletManager.Instance?.ActiveSaveData?.OwnedFurnitureIds != null && WalletManager.Instance.ActiveSaveData.OwnedFurnitureIds.Count > 0)
            {
                foreach (var id in WalletManager.Instance.ActiveSaveData.OwnedFurnitureIds)
                {
                    if (!displayItems.Contains(id)) displayItems.Add(id);
                }
            }

            // 기본/테스트 가구 추가
            foreach (var fbId in _fallbackItemIds)
            {
                if (!displayItems.Contains(fbId)) displayItems.Add(fbId);
            }

            // 필터링 적용 및 카드 생성
            foreach (var itemId in displayItems)
            {
                if (!MatchesCategoryFilter(itemId, _currentCategory)) continue;
                if (!MatchesThemeFilter(itemId, _selectedThemeTag)) continue;
                if (!MatchesSearchFilter(itemId, _searchKeyword)) continue;

                GameObject card = CreateItemCard(itemId);
                if (card != null)
                {
                    _spawnedCards.Add(card);
                }
            }
        }

        private bool MatchesCategoryFilter(string itemId, EditCategory cat)
        {
            if (cat == EditCategory.All) return true;

            var data = ItemMasterTable.Instance?.GetItem(itemId);
            bool isWall = OfficeGridManager.IsWallItem(itemId);

            switch (cat)
            {
                case EditCategory.Floor:
                    if (itemId == "WoodFloor" || itemId == "WoodFloorTexture") return true;
                    if (data != null && (data.SubCategory == ItemMasterTable.FurnitureSubCategory.Floor || data.SubCategory == ItemMasterTable.FurnitureSubCategory.Tile)) return true;
                    return false;

                case EditCategory.Wall:
                    if (isWall || itemId == "BasicWindow" || itemId == "BasicDoor" || itemId == "IvoryWallPaper") return true;
                    if (data != null && (data.SubCategory == ItemMasterTable.FurnitureSubCategory.Wallpaper || data.SubCategory == ItemMasterTable.FurnitureSubCategory.WallDecor)) return true;
                    return false;

                case EditCategory.Desk:
                    if (itemId == "WoodComputerDesk" || itemId == "FURN_DESK_NS_001" || itemId == "FURN_DESK_PM_001") return true;
                    if (data != null && data.SubCategory == ItemMasterTable.FurnitureSubCategory.Desk) return true;
                    return false;

                case EditCategory.Chair:
                    if (itemId == "WoodChair" || itemId == "BasicSofa" || itemId == "FURN_CHAIR_NS_001" || itemId == "FURN_CHAIR_PM_001") return true;
                    if (data != null && data.SubCategory == ItemMasterTable.FurnitureSubCategory.Chair) return true;
                    return false;

                case EditCategory.Bed:
                    if (itemId == "WoodBed" || itemId == "FURN_BED_NS_001" || itemId == "FURN_BED_PM_001") return true;
                    if (data != null && data.SubCategory == ItemMasterTable.FurnitureSubCategory.Bed) return true;
                    return false;

                case EditCategory.Decor:
                    if (itemId == "MonsteraPot" || itemId == "Building" || itemId == "FURN_DECOR_NS_001" || itemId == "FURN_DECOR_PM_001" || itemId == "FURN_DECOR_PM_002") return true;
                    if (data != null && data.SubCategory == ItemMasterTable.FurnitureSubCategory.Decor) return true;
                    return false;

                case EditCategory.Storage:
                    if (itemId == "WoodCloset" || itemId.Contains("STORAGE") || itemId.Contains("PART")) return true;
                    if (data != null && (data.SubCategory == ItemMasterTable.FurnitureSubCategory.Storage || data.SubCategory == ItemMasterTable.FurnitureSubCategory.Partition)) return true;
                    return false;
            }

            return true;
        }

        private bool MatchesThemeFilter(string itemId, string themeTag)
        {
            if (string.IsNullOrEmpty(themeTag) || themeTag == "ALL" || themeTag == "전체 테마") return true;

            var data = ItemMasterTable.Instance?.GetItem(itemId);
            if (data == null) return false;

            return !string.IsNullOrEmpty(data.ThemeTag) && data.ThemeTag.Equals(themeTag, StringComparison.OrdinalIgnoreCase);
        }

        private bool MatchesSearchFilter(string itemId, string keyword)
        {
            if (string.IsNullOrEmpty(keyword)) return true;

            string name = GetItemDisplayName(itemId);
            if (name.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0) return true;
            if (itemId.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0) return true;

            var data = ItemMasterTable.Instance?.GetItem(itemId);
            if (data != null)
            {
                if (!string.IsNullOrEmpty(data.SpecialEffect) && data.SpecialEffect.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0) return true;
                if (!string.IsNullOrEmpty(data.ThemeTag) && data.ThemeTag.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0) return true;
            }

            return false;
        }

        private GameObject CreateItemCard(string itemId)
        {
            GameObject cardGo = new GameObject($"Card_{itemId}", typeof(RectTransform), typeof(Image), typeof(Button));
            cardGo.transform.SetParent(_cardContentContainer, false);

            RectTransform rt = cardGo.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(125, 120);

            Image bg = cardGo.GetComponent<Image>();
            bg.color = _cardBgColor;

            Button btn = cardGo.GetComponent<Button>();
            btn.targetGraphic = bg;
            var colors = btn.colors;
            colors.highlightedColor = _cardHoverColor;
            colors.pressedColor = _activeEditColor;
            btn.colors = colors;

            string capturedId = itemId;
            btn.onClick.AddListener(() => OnItemCardClicked(capturedId));

            // 1. 아이콘 스프라이트
            Sprite itemSprite = OfficeGridManager.Instance?.ResolveFurnitureSprite(itemId);

            GameObject iconGo = new GameObject("Icon", typeof(RectTransform), typeof(Image));
            iconGo.transform.SetParent(cardGo.transform, false);
            RectTransform iconRt = iconGo.GetComponent<RectTransform>();
            iconRt.anchorMin = new Vector2(0.5f, 0.55f);
            iconRt.anchorMax = new Vector2(0.5f, 0.55f);
            iconRt.pivot = new Vector2(0.5f, 0.5f);
            iconRt.anchoredPosition = Vector2.zero;
            iconRt.sizeDelta = new Vector2(70, 60);

            Image iconImg = iconGo.GetComponent<Image>();
            iconImg.sprite = itemSprite;
            iconImg.preserveAspect = true;
            if (itemSprite == null) iconImg.color = new Color(1, 1, 1, 0.2f);

            // 2. 가구 이름
            string displayName = GetItemDisplayName(itemId);

            GameObject nameGo = new GameObject("Name", typeof(RectTransform), typeof(TextMeshProUGUI));
            nameGo.transform.SetParent(cardGo.transform, false);
            RectTransform nameRt = nameGo.GetComponent<RectTransform>();
            nameRt.anchorMin = new Vector2(0f, 0f);
            nameRt.anchorMax = new Vector2(1f, 0.25f);
            nameRt.offsetMin = new Vector2(4, 4);
            nameRt.offsetMax = new Vector2(-4, 0);

            TextMeshProUGUI nameTxt = nameGo.GetComponent<TextMeshProUGUI>();
            nameTxt.text = displayName;
            nameTxt.fontSize = 11;
            nameTxt.alignment = TextAlignmentOptions.Center;
            nameTxt.color = Color.white;
            nameTxt.overflowMode = TextOverflowModes.Ellipsis;

            // 3. 규격 뱃지 & 테마 (상단)
            bool isWall = OfficeGridManager.IsWallItem(itemId);
            string badgeText = isWall ? "벽면" : "바닥";
            var itemData = ItemMasterTable.Instance?.GetItem(itemId);
            if (itemData != null && !string.IsNullOrEmpty(itemData.ThemeTag))
            {
                badgeText = ItemMasterTable.GetThemeBadge(itemData.ThemeTag);
            }

            GameObject badgeGo = new GameObject("Badge", typeof(RectTransform), typeof(TextMeshProUGUI));
            badgeGo.transform.SetParent(cardGo.transform, false);
            RectTransform badgeRt = badgeGo.GetComponent<RectTransform>();
            badgeRt.anchorMin = new Vector2(0f, 0.80f);
            badgeRt.anchorMax = new Vector2(1f, 1f);
            badgeRt.offsetMin = new Vector2(4, 0);
            badgeRt.offsetMax = new Vector2(-4, -2);

            TextMeshProUGUI badgeTxt = badgeGo.GetComponent<TextMeshProUGUI>();
            badgeTxt.text = $"<color=#{ColorUtility.ToHtmlStringRGB(_goldAccentColor)}>[{badgeText}]</color>";
            badgeTxt.fontSize = 9;
            badgeTxt.alignment = TextAlignmentOptions.Left;

            return cardGo;
        }

        private void OnItemCardClicked(string itemId)
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.StartPlacement(itemId);
            }
        }

        private string GetItemDisplayName(string itemId)
        {
            if (ItemMasterTable.Instance != null)
            {
                var data = ItemMasterTable.Instance.GetItem(itemId);
                if (data != null && !string.IsNullOrEmpty(data.DisplayName)) return data.DisplayName;
            }

            // 기본 가구 한글명 매핑
            if (itemId == "BasicWindow") return "기본 창문";
            if (itemId == "BasicDoor") return "기본 방문";
            if (itemId == "BasicSofa") return "베이직 소파";
            if (itemId == "WoodBed") return "원목 침대";
            if (itemId == "WoodChair") return "원목 의자";
            if (itemId == "WoodCloset") return "원목 옷장";
            if (itemId == "MonsteraPot") return "몬스테라 화분";
            if (itemId == "WoodFloor") return "오크우드 바닥";
            if (itemId == "IvoryWallPaper") return "아이보리 벽지";

            return itemId;
        }

        // --------------------------------------------------------
        // 4. 버튼 이벤트 핸들러
        // --------------------------------------------------------

        private void OnToggleEditClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.ToggleEditMode();
            }
        }

        private void OnDoneClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.SetEditMode(false);
            }
        }

        // --------------------------------------------------------
        // 5. UI 초기화 및 리스너 바인딩 (인스펙터 직접 배치 완벽 지원)
        // --------------------------------------------------------

        private void InitializeUI()
        {
            if (_isInitialized) return;
            _isInitialized = true;

            // 1. 토글 버튼 리스너 바인딩
            if (_toggleEditButton != null)
            {
                _toggleEditButton.onClick.RemoveAllListeners();
                _toggleEditButton.onClick.AddListener(OnToggleEditClicked);
            }

            // 2. 인스펙터에 직접 배치된 카테고리 탭 버튼 리스너 바인딩
            BindTabButton(_tabAllButton, EditCategory.All);
            BindTabButton(_tabFloorButton, EditCategory.Floor);
            BindTabButton(_tabWallButton, EditCategory.Wall);
            BindTabButton(_tabDeskButton, EditCategory.Desk);
            BindTabButton(_tabChairButton, EditCategory.Chair);
            BindTabButton(_tabBedButton, EditCategory.Bed);
            BindTabButton(_tabDecorButton, EditCategory.Decor);
            BindTabButton(_tabStorageButton, EditCategory.Storage);

            // 3. 인스펙터에 연결된 검색창(InputField) 리스너 바인딩
            if (_searchInputField != null)
            {
                _searchInputField.onValueChanged.RemoveAllListeners();
                _searchInputField.onValueChanged.AddListener(SetSearchKeyword);
            }

            // 4. 인스펙터에 연결된 테마 드롭다운 리스너 바인딩
            if (_themeFilterDropdown != null)
            {
                _themeFilterDropdown.onValueChanged.RemoveAllListeners();
                _themeFilterDropdown.onValueChanged.AddListener(index =>
                {
                    string tag = index switch
                    {
                        1 => "PrivateMascot",
                        2 => "NeonCyber",
                        3 => "NaturalStarter",
                        4 => "GoldenEmpire",
                        5 => "RetroArcade",
                        _ => string.Empty
                    };
                    SetThemeFilter(tag);
                });
            }

            // 5. 완료/취소/회전/수거 버튼 리스너 바인딩
            if (_doneButton != null)
            {
                _doneButton.onClick.RemoveAllListeners();
                _doneButton.onClick.AddListener(OnDoneClicked);
            }
            if (_rotateButton != null)
            {
                _rotateButton.onClick.RemoveAllListeners();
                _rotateButton.onClick.AddListener(() => OfficeEditController.Instance?.RotateHeldItem());
            }
            if (_removeButton != null)
            {
                _removeButton.onClick.RemoveAllListeners();
                _removeButton.onClick.AddListener(() => OfficeEditController.Instance?.DeleteHeldItem());
            }
            if (_cancelButton != null)
            {
                _cancelButton.onClick.RemoveAllListeners();
                _cancelButton.onClick.AddListener(() => OfficeEditController.Instance?.CancelPlacement());
            }
        }

        private void BindTabButton(Button btn, EditCategory cat)
        {
            if (btn == null) return;
            var capturedCat = cat;
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(() => SetCategoryFilter(capturedCat));
        }
    }
}

