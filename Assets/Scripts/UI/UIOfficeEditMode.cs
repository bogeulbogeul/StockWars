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
    /// - [가구 편집] 버튼 클릭 시 바닥 그리드 자동 활성화 & 하단 가로 카탈로그 서랍(Drawer) 오픈
    /// - 하단 가로 스크롤 뷰: 보유 가구 및 기본 가구 아이템 카드 실시간 리스트업
    /// - 가구 카드 클릭 시 즉시 마우스 고스트 프리뷰로 배치 모드 진입
    /// - 툴바: [회전 🔄], [수거 🗑️], [취소 ❌], [상점 🛍️], [완료 ✅]
    /// </para>
    /// </summary>
    public class UIOfficeEditMode : MonoBehaviour
    {
        [Header("Toggle Button References")]
        [SerializeField] private Button _toggleEditButton;
        [SerializeField] private TMP_Text _toggleButtonText;

        [Header("Catalog Drawer References")]
        [SerializeField] private GameObject _catalogDrawerPanel;
        [SerializeField] private Transform _cardContentContainer;
        [SerializeField] private Button _rotateButton;
        [SerializeField] private Button _removeButton;
        [SerializeField] private Button _cancelButton;
        [SerializeField] private Button _openShopButton;
        [SerializeField] private Button _doneButton;
        [SerializeField] private TMP_Text _statusGuideText;

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
            "FURN_DESK_NS_001",
            "FURN_CHAIR_NS_001",
            "FURN_BED_NS_001",
            "FURN_DECOR_NS_001"
        };

        [Header("Styling Colors")]
        [SerializeField] private Color _activeEditColor = new Color(0.18f, 0.65f, 0.38f, 1f);
        [SerializeField] private Color _normalButtonColor = new Color(0.20f, 0.18f, 0.24f, 0.95f);
        [SerializeField] private Color _cardBgColor = new Color(0.18f, 0.18f, 0.22f, 0.90f);
        [SerializeField] private Color _cardHoverColor = new Color(0.30f, 0.28f, 0.35f, 1f);
        [SerializeField] private Color _goldAccentColor = new Color(0.96f, 0.78f, 0.38f, 1f);

        private bool _isInitialized = false;
        private readonly List<GameObject> _spawnedCards = new();

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
                PopulateCatalogCards();
            }
        }

        // --------------------------------------------------------
        // 2. 하단 가로 카탈로그 카드 채우기
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

            // 테스트 및 초기 편의를 위해 기본 가구 추가
            foreach (var fbId in _fallbackItemIds)
            {
                if (!displayItems.Contains(fbId)) displayItems.Add(fbId);
            }

            // 각 가구별 카드 UI 생성
            foreach (var itemId in displayItems)
            {
                GameObject card = CreateItemCard(itemId);
                if (card != null)
                {
                    _spawnedCards.Add(card);
                }
            }
        }

        private GameObject CreateItemCard(string itemId)
        {
            GameObject cardGo = new GameObject($"Card_{itemId}", typeof(RectTransform), typeof(Image), typeof(Button));
            cardGo.transform.SetParent(_cardContentContainer, false);

            RectTransform rt = cardGo.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(120, 110);

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

            // 3. 규격 뱃지 (상단)
            bool isWall = OfficeGridManager.IsWallItem(itemId);
            string badgeText = isWall ? "벽면" : "바닥";

            GameObject badgeGo = new GameObject("Badge", typeof(RectTransform), typeof(TextMeshProUGUI));
            badgeGo.transform.SetParent(cardGo.transform, false);
            RectTransform badgeRt = badgeGo.GetComponent<RectTransform>();
            badgeRt.anchorMin = new Vector2(0f, 0.82f);
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

            return itemId;
        }

        // --------------------------------------------------------
        // 3. 버튼 클릭 핸들러
        // --------------------------------------------------------

        private void OnToggleEditClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.ToggleEditMode();
            }
        }

        private void OnRotateClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.RotateHeldItem();
            }
        }

        private void OnRemoveClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.DeleteHeldItem();
            }
        }

        private void OnCancelClicked()
        {
            if (OfficeEditController.Instance != null)
            {
                OfficeEditController.Instance.CancelPlacement();
            }
        }

        private void OnOpenShopClicked()
        {
            if (_furnitureShop != null)
            {
                _furnitureShop.gameObject.SetActive(true);
            }
            else
            {
                var shop = FindAnyObjectByType<UIFurnitureShop>(FindObjectsInactive.Include);
                if (shop != null)
                {
                    shop.gameObject.SetActive(true);
                }
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
        // 4. UI 자동 구축 (프로그래밍 폴백 레이아웃)
        // --------------------------------------------------------

        private void InitializeUI()
        {
            if (_isInitialized) return;
            _isInitialized = true;

            Transform rootTr = transform;

            // 1. 토글 버튼 (우측 상단/하단)
            if (_toggleEditButton == null)
            {
                _toggleEditButton = CreateButton(rootTr, "EditToggleButton", "🔨 가구 편집", new Vector2(-20, 30), new Vector2(1, 0), new Vector2(1, 0), new Vector2(140, 48), _normalButtonColor);
                _toggleButtonText = _toggleEditButton.GetComponentInChildren<TMP_Text>();
            }
            _toggleEditButton.onClick.RemoveAllListeners();
            _toggleEditButton.onClick.AddListener(OnToggleEditClicked);

            // 2. 하단 와이드 가탈로그 서랍(Drawer) 패널 생성
            if (_catalogDrawerPanel == null)
            {
                GameObject drawerGo = new GameObject("CatalogDrawerPanel", typeof(RectTransform), typeof(Image));
                drawerGo.transform.SetParent(rootTr, false);
                _catalogDrawerPanel = drawerGo;

                RectTransform dRt = drawerGo.GetComponent<RectTransform>();
                dRt.anchorMin = new Vector2(0f, 0f);
                dRt.anchorMax = new Vector2(1f, 0f);
                dRt.pivot = new Vector2(0.5f, 0f);
                dRt.anchoredPosition = Vector2.zero;
                dRt.sizeDelta = new Vector2(0, 190);

                Image dImg = drawerGo.GetComponent<Image>();
                dImg.color = new Color(0.10f, 0.10f, 0.14f, 0.95f); // 딥 다크 글래스

                // A. 서랍 상단 툴바 바
                GameObject topBarGo = new GameObject("TopToolbar", typeof(RectTransform), typeof(Image));
                topBarGo.transform.SetParent(drawerGo.transform, false);
                RectTransform tbRt = topBarGo.GetComponent<RectTransform>();
                tbRt.anchorMin = new Vector2(0f, 1f);
                tbRt.anchorMax = new Vector2(1f, 1f);
                tbRt.pivot = new Vector2(0.5f, 1f);
                tbRt.anchoredPosition = Vector2.zero;
                tbRt.sizeDelta = new Vector2(0, 44);

                Image tbImg = topBarGo.GetComponent<Image>();
                tbImg.color = new Color(0.15f, 0.15f, 0.20f, 0.98f);

                var hlg = topBarGo.AddComponent<HorizontalLayoutGroup>();
                hlg.spacing = 8;
                hlg.padding = new RectOffset(16, 16, 4, 4);
                hlg.childAlignment = TextAnchor.MiddleLeft;
                hlg.childControlWidth = false;
                hlg.childControlHeight = true;

                // 툴바 버튼 생성
                _rotateButton = CreateButton(topBarGo.transform, "BtnRotate", "🔄 회전 (R)", Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(90, 36), new Color(0.28f, 0.28f, 0.35f, 1f));
                _removeButton = CreateButton(topBarGo.transform, "BtnRemove", "🗑️ 수거", Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(80, 36), new Color(0.70f, 0.28f, 0.28f, 1f));
                _cancelButton = CreateButton(topBarGo.transform, "BtnCancel", "❌ 취소", Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(80, 36), new Color(0.38f, 0.38f, 0.42f, 1f));
                _openShopButton = CreateButton(topBarGo.transform, "BtnShop", "🛍️ 상점", Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(80, 36), new Color(0.60f, 0.45f, 0.25f, 1f));

                // 여백 스페이서
                GameObject spacer = new GameObject("Spacer", typeof(RectTransform), typeof(LayoutElement));
                spacer.transform.SetParent(topBarGo.transform, false);
                spacer.GetComponent<LayoutElement>().flexibleWidth = 1;

                _doneButton = CreateButton(topBarGo.transform, "BtnDone", "✅ 편집 완료", Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(110, 36), _activeEditColor);

                // B. 가로 스크롤 뷰 (가구 카탈로그 리스트)
                GameObject scrollGo = new GameObject("HorizontalScrollView", typeof(RectTransform), typeof(ScrollRect), typeof(Image));
                scrollGo.transform.SetParent(drawerGo.transform, false);
                RectTransform svRt = scrollGo.GetComponent<RectTransform>();
                svRt.anchorMin = new Vector2(0f, 0f);
                svRt.anchorMax = new Vector2(1f, 1f);
                svRt.offsetMin = new Vector2(16, 10);
                svRt.offsetMax = new Vector2(-16, -48);

                Image svImg = scrollGo.GetComponent<Image>();
                svImg.color = new Color(0, 0, 0, 0.25f);

                ScrollRect sr = scrollGo.GetComponent<ScrollRect>();
                sr.horizontal = true;
                sr.vertical = false;
                sr.movementType = ScrollRect.MovementType.Elastic;

                // Viewport
                GameObject vpGo = new GameObject("Viewport", typeof(RectTransform), typeof(Mask), typeof(Image));
                vpGo.transform.SetParent(scrollGo.transform, false);
                RectTransform vpRt = vpGo.GetComponent<RectTransform>();
                vpRt.anchorMin = Vector2.zero;
                vpRt.anchorMax = Vector2.one;
                vpRt.sizeDelta = Vector2.zero;
                vpGo.GetComponent<Mask>().showMaskGraphic = false;

                // Content
                GameObject contentGo = new GameObject("Content", typeof(RectTransform), typeof(HorizontalLayoutGroup), typeof(ContentSizeFitter));
                contentGo.transform.SetParent(vpGo.transform, false);
                RectTransform cRt = contentGo.GetComponent<RectTransform>();
                cRt.anchorMin = new Vector2(0f, 0f);
                cRt.anchorMax = new Vector2(0f, 1f);
                cRt.pivot = new Vector2(0f, 0.5f);
                cRt.anchoredPosition = Vector2.zero;
                cRt.sizeDelta = new Vector2(0, 0);

                var chlg = contentGo.GetComponent<HorizontalLayoutGroup>();
                chlg.spacing = 12;
                chlg.padding = new RectOffset(10, 10, 8, 8);
                chlg.childAlignment = TextAnchor.MiddleLeft;
                chlg.childControlWidth = false;
                chlg.childControlHeight = true;

                var csf = contentGo.GetComponent<ContentSizeFitter>();
                csf.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
                csf.verticalFit = ContentSizeFitter.FitMode.Unconstrained;

                sr.viewport = vpRt;
                sr.content = cRt;
                _cardContentContainer = contentGo.transform;
            }

            // 버튼 리스너 바인딩
            if (_rotateButton != null) { _rotateButton.onClick.RemoveAllListeners(); _rotateButton.onClick.AddListener(OnRotateClicked); }
            if (_removeButton != null) { _removeButton.onClick.RemoveAllListeners(); _removeButton.onClick.AddListener(OnRemoveClicked); }
            if (_cancelButton != null) { _cancelButton.onClick.RemoveAllListeners(); _cancelButton.onClick.AddListener(OnCancelClicked); }
            if (_openShopButton != null) { _openShopButton.onClick.RemoveAllListeners(); _openShopButton.onClick.AddListener(OnOpenShopClicked); }
            if (_doneButton != null) { _doneButton.onClick.RemoveAllListeners(); _doneButton.onClick.AddListener(OnDoneClicked); }
        }

        private Button CreateButton(Transform parent, string name, string label, Vector2 anchoredPos, Vector2 anchorMin, Vector2 anchorMax, Vector2 size, Color bgColor)
        {
            GameObject btnGo = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            btnGo.transform.SetParent(parent, false);

            RectTransform rt = btnGo.GetComponent<RectTransform>();
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = anchorMax;
            rt.anchoredPosition = anchoredPos;
            rt.sizeDelta = size;

            Image img = btnGo.GetComponent<Image>();
            img.color = bgColor;

            GameObject textGo = new GameObject("Label", typeof(RectTransform), typeof(TextMeshProUGUI));
            textGo.transform.SetParent(btnGo.transform, false);

            RectTransform textRt = textGo.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = Vector2.zero;
            textRt.offsetMax = Vector2.zero;

            TextMeshProUGUI tmp = textGo.GetComponent<TextMeshProUGUI>();
            tmp.text = label;
            tmp.fontSize = 12;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btnGo.GetComponent<Button>();
        }
    }
}
