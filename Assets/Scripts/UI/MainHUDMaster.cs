using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// CORE_GDD_05: 2D 아늑한 오피스 배경 일러스트를 화면 전체에 렌더링하고, 
    /// 상단 정보 바 및 사이드 바를 포함하여 매칭 창들이 얹어질 부모 Canvas 레이아웃 앵커를 셋업하는 마스터 HUD.
    /// (이벤트 기반 갱신 및 가비지 최소화 최적화 버전)
    /// </summary>
    public class MainHUDMaster : Singleton<MainHUDMaster>
    {
        [Header("UI References")]
        public Canvas mainCanvas;
        public RectTransform safeAreaPanel;
        public Image backgroundImage;
        
        [Header("Top Info Bar Text")]
        public TextMeshProUGUI timeText;
        public TextMeshProUGUI goldText;
        public TextMeshProUGUI netWorthText;
        
        [Header("Layout Anchors")]
        public RectTransform popupAnchor;

        private bool _isInitialized = false;
        private int _lastSecond = -1;

        protected override void Awake()
        {
            base.Awake();
            if (Instance != this) return;

            InitializeHUD();
        }

        private void OnEnable()
        {
            if (!_isInitialized) return;

            // 이벤트 버스 구독을 통한 실시간 데이터 변경 감지 (가비지 컬렉션 최적화)
            EventBus.Subscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Subscribe<NetWorthUpdatedEvent>(OnNetWorthUpdated);
            
            RefreshAllDataImmediate();
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Unsubscribe<NetWorthUpdatedEvent>(OnNetWorthUpdated);
        }

        private void Update()
        {
            if (!_isInitialized) return;

            UpdateTimeDisplay();
        }

        /// <summary>
        /// 전체 HUD Canvas 계층 구조를 동적으로 구축합니다.
        /// </summary>
        public void InitializeHUD()
        {
            if (_isInitialized) return;

            Debug.Log("[MainHUDMaster] 마스터 HUD 동적 구축을 시작합니다.");

            // 1. Canvas 및 렌더 셋업
            mainCanvas = gameObject.GetComponent<Canvas>();
            if (mainCanvas == null) mainCanvas = gameObject.AddComponent<Canvas>();
            mainCanvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = gameObject.GetComponent<CanvasScaler>();
            if (scaler == null) scaler = gameObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            if (gameObject.GetComponent<GraphicRaycaster>() == null)
            {
                gameObject.AddComponent<GraphicRaycaster>();
            }

            // UI_CanvasOrder 바인딩 및 레이어 설정 (MainHUD)
            UI_CanvasOrder canvasOrder = gameObject.GetComponent<UI_CanvasOrder>();
            if (canvasOrder == null) canvasOrder = gameObject.AddComponent<UI_CanvasOrder>();
            
            // 리플렉션 없이 타입 안전하게 정렬 레이어 지정
            canvasOrder.SetLayerType(UI_CanvasOrder.CanvasLayerType.MainHUD);

            // 2. Safe Area Panel 생성
            GameObject safeAreaGo = new GameObject("SafeAreaPanel", typeof(RectTransform), typeof(UI_SafeArea));
            safeAreaGo.transform.SetParent(transform, false);
            safeAreaPanel = safeAreaGo.GetComponent<RectTransform>();
            safeAreaPanel.anchorMin = Vector2.zero;
            safeAreaPanel.anchorMax = Vector2.one;
            safeAreaPanel.offsetMin = Vector2.zero;
            safeAreaPanel.offsetMax = Vector2.zero;

            // 3. 배경 이미지 생성 (Cozy Office Background)
            GameObject bgGo = new GameObject("CozyOfficeBackground", typeof(RectTransform), typeof(Image));
            bgGo.transform.SetParent(safeAreaPanel, false);
            RectTransform bgRt = bgGo.GetComponent<RectTransform>();
            bgRt.anchorMin = Vector2.zero;
            bgRt.anchorMax = Vector2.one;
            bgRt.offsetMin = Vector2.zero;
            bgRt.offsetMax = Vector2.zero;

            backgroundImage = bgGo.GetComponent<Image>();
            backgroundImage.sprite = Resources.Load<Sprite>("Sprites/Backgrounds/cozy_office_bg");
            
            // 폴백 단색 (아늑한 다크 블루 앰비언스)
            backgroundImage.color = new Color(0.08f, 0.08f, 0.12f, 1f);
            if (backgroundImage.sprite != null)
            {
                backgroundImage.color = Color.white;
            }

            // 4. 상단 정보 바 (Top Info Bar) 생성
            GameObject topBarGo = new GameObject("TopInfoBar", typeof(RectTransform), typeof(Image));
            topBarGo.transform.SetParent(safeAreaPanel, false);
            RectTransform topBarRt = topBarGo.GetComponent<RectTransform>();
            topBarRt.anchorMin = new Vector2(0f, 1f);
            topBarRt.anchorMax = new Vector2(1f, 1f);
            topBarRt.pivot = new Vector2(0.5f, 1f);
            topBarRt.anchoredPosition = Vector2.zero;
            topBarRt.sizeDelta = new Vector2(0f, 80f);

            Image topBarImg = topBarGo.GetComponent<Image>();
            topBarImg.color = new Color(0.07f, 0.07f, 0.09f, 0.85f); // 투명도 있는 다크 그레이

            // 상단 바 하단 Cyan 데코 라인
            GameObject topDecorGo = new GameObject("BottomAccentLine", typeof(RectTransform), typeof(Image));
            topDecorGo.transform.SetParent(topBarGo.transform, false);
            RectTransform topDecorRt = topDecorGo.GetComponent<RectTransform>();
            topDecorRt.anchorMin = new Vector2(0f, 0f);
            topDecorRt.anchorMax = new Vector2(1f, 0f);
            topDecorRt.pivot = new Vector2(0.5f, 0f);
            topDecorRt.anchoredPosition = Vector2.zero;
            topDecorRt.sizeDelta = new Vector2(0f, 3f);
            topDecorGo.GetComponent<Image>().color = new Color(0f, 0.92f, 1f, 1f); // Cyan (#00EAFF)

            // 4.1 타이틀 텍스트 (우측 배치)
            GameObject titleGo = new GameObject("GameTitle", typeof(RectTransform), typeof(TextMeshProUGUI));
            titleGo.transform.SetParent(topBarGo.transform, false);
            RectTransform titleRt = titleGo.GetComponent<RectTransform>();
            titleRt.anchorMin = new Vector2(1f, 0.5f);
            titleRt.anchorMax = new Vector2(1f, 0.5f);
            titleRt.pivot = new Vector2(1f, 0.5f);
            titleRt.anchoredPosition = new Vector2(-30f, 0f);
            titleRt.sizeDelta = new Vector2(300f, 50f);

            TextMeshProUGUI titleText = titleGo.GetComponent<TextMeshProUGUI>();
            titleText.text = "<color=#00EAFF><b>STOCK</b></color> WARS";
            titleText.fontSize = 28;
            titleText.alignment = TextAlignmentOptions.Right;

            // 4.2 시간 표시 (좌측 배치)
            GameObject timeGo = new GameObject("TimeDisplay", typeof(RectTransform), typeof(TextMeshProUGUI));
            timeGo.transform.SetParent(topBarGo.transform, false);
            RectTransform timeRt = timeGo.GetComponent<RectTransform>();
            timeRt.anchorMin = new Vector2(0f, 0.5f);
            timeRt.anchorMax = new Vector2(0f, 0.5f);
            timeRt.pivot = new Vector2(0f, 0.5f);
            timeRt.anchoredPosition = new Vector2(30f, 0f);
            timeRt.sizeDelta = new Vector2(400f, 50f);

            timeText = timeGo.GetComponent<TextMeshProUGUI>();
            timeText.fontSize = 20;
            timeText.color = Color.white;
            timeText.alignment = TextAlignmentOptions.Left;

            // 4.3 골드 및 순자산 표시 (중앙 배치용 컨테이너)
            GameObject statsContainer = new GameObject("StatsContainer", typeof(RectTransform));
            statsContainer.transform.SetParent(topBarGo.transform, false);
            RectTransform statsRt = statsContainer.GetComponent<RectTransform>();
            statsRt.anchorMin = new Vector2(0.5f, 0.5f);
            statsRt.anchorMax = new Vector2(0.5f, 0.5f);
            statsRt.pivot = new Vector2(0.5f, 0.5f);
            statsRt.anchoredPosition = Vector2.zero;
            statsRt.sizeDelta = new Vector2(800f, 60f);

            // 골드 텍스트
            GameObject goldGo = new GameObject("GoldDisplay", typeof(RectTransform), typeof(TextMeshProUGUI));
            goldGo.transform.SetParent(statsContainer.transform, false);
            RectTransform goldRt = goldGo.GetComponent<RectTransform>();
            goldRt.anchorMin = new Vector2(0f, 0.5f);
            goldRt.anchorMax = new Vector2(0.5f, 0.5f);
            goldRt.pivot = new Vector2(0.5f, 0.5f);
            goldRt.anchoredPosition = new Vector2(-150f, 0f);
            goldRt.sizeDelta = new Vector2(350f, 50f);

            goldText = goldGo.GetComponent<TextMeshProUGUI>();
            goldText.fontSize = 20;
            goldText.alignment = TextAlignmentOptions.Center;

            // 순자산 텍스트
            GameObject netWorthGo = new GameObject("NetWorthDisplay", typeof(RectTransform), typeof(TextMeshProUGUI));
            netWorthGo.transform.SetParent(statsContainer.transform, false);
            RectTransform netWorthRt = netWorthGo.GetComponent<RectTransform>();
            netWorthRt.anchorMin = new Vector2(0.5f, 0.5f);
            netWorthRt.anchorMax = new Vector2(1f, 0.5f);
            netWorthRt.pivot = new Vector2(0.5f, 0.5f);
            netWorthRt.anchoredPosition = new Vector2(150f, 0f);
            netWorthRt.sizeDelta = new Vector2(350f, 50f);

            netWorthText = netWorthGo.GetComponent<TextMeshProUGUI>();
            netWorthText.fontSize = 20;
            netWorthText.alignment = TextAlignmentOptions.Center;

            // 5. 사이드바 (Sidebar Menu Panel) 생성
            GameObject sidebarGo = new GameObject("SidebarMenu", typeof(RectTransform), typeof(Image));
            sidebarGo.transform.SetParent(safeAreaPanel, false);
            RectTransform sidebarRt = sidebarGo.GetComponent<RectTransform>();
            sidebarRt.anchorMin = new Vector2(0f, 0f);
            sidebarRt.anchorMax = new Vector2(0f, 1f);
            sidebarRt.pivot = new Vector2(0f, 0.5f);
            sidebarRt.anchoredPosition = new Vector2(0f, -40f);
            sidebarRt.sizeDelta = new Vector2(220f, -80f);

            Image sidebarImg = sidebarGo.GetComponent<Image>();
            sidebarImg.color = new Color(0.08f, 0.08f, 0.1f, 0.9f); // 다크 그레이

            // 사이드바 우하단 Cyan 데코 선
            GameObject sideDecorGo = new GameObject("RightAccentLine", typeof(RectTransform), typeof(Image));
            sideDecorGo.transform.SetParent(sidebarGo.transform, false);
            RectTransform sideDecorRt = sideDecorGo.GetComponent<RectTransform>();
            sideDecorRt.anchorMin = new Vector2(1f, 0f);
            sideDecorRt.anchorMax = new Vector2(1f, 1f);
            sideDecorRt.pivot = new Vector2(1f, 0.5f);
            sideDecorRt.anchoredPosition = Vector2.zero;
            sideDecorRt.sizeDelta = new Vector2(3f, 0f);
            sideDecorGo.GetComponent<Image>().color = new Color(0f, 0.92f, 1f, 1f); // Cyan (#00EAFF)

            // 사이드바 제목 텍스트
            GameObject menuTitleGo = new GameObject("MenuTitle", typeof(RectTransform), typeof(TextMeshProUGUI));
            menuTitleGo.transform.SetParent(sidebarGo.transform, false);
            RectTransform menuTitleRt = menuTitleGo.GetComponent<RectTransform>();
            menuTitleRt.anchorMin = new Vector2(0.5f, 1f);
            menuTitleRt.anchorMax = new Vector2(0.5f, 1f);
            menuTitleRt.pivot = new Vector2(0.5f, 1f);
            menuTitleRt.anchoredPosition = new Vector2(0f, -20f);
            menuTitleRt.sizeDelta = new Vector2(180f, 40f);

            TextMeshProUGUI menuTitleText = menuTitleGo.GetComponent<TextMeshProUGUI>();
            menuTitleText.text = "OFFICE MENU";
            menuTitleText.fontSize = 18;
            menuTitleText.color = new Color(0.7f, 0.7f, 0.8f, 1f);
            menuTitleText.alignment = TextAlignmentOptions.Center;

            // 사이드바 버튼 리스트용 컨테이너 (Vertical Layout Group)
            GameObject buttonContainer = new GameObject("Buttons", typeof(RectTransform), typeof(VerticalLayoutGroup));
            buttonContainer.transform.SetParent(sidebarGo.transform, false);
            RectTransform btnContainerRt = buttonContainer.GetComponent<RectTransform>();
            btnContainerRt.anchorMin = new Vector2(0.5f, 0.5f);
            btnContainerRt.anchorMax = new Vector2(0.5f, 0.5f);
            btnContainerRt.pivot = new Vector2(0.5f, 0.5f);
            btnContainerRt.anchoredPosition = new Vector2(0f, -40f);
            btnContainerRt.sizeDelta = new Vector2(180f, 320f);

            VerticalLayoutGroup vlg = buttonContainer.GetComponent<VerticalLayoutGroup>();
            vlg.spacing = 15f;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;
            vlg.childControlWidth = true;
            vlg.childControlHeight = true;

            // 버튼 생성 루프
            string[] buttonLabels = { "주문 창", "포트폴리오", "설정", "치트 콘솔" };
            Action[] buttonActions = {
                () => Debug.Log("[HUD] 주문 창 토글"),
                () => Debug.Log("[HUD] 포트폴리오 토글"),
                () => Debug.Log("[HUD] 설정 토글"),
                () => Debug.Log("[HUD] 치트 콘솔 토글")
            };

            for (int i = 0; i < buttonLabels.Length; i++)
            {
                CreateMenuButton(buttonContainer.transform, buttonLabels[i], buttonActions[i]);
            }

            // 6. 메칭/서브 창들이 얹어질 부모 팝업 앵커 생성 (중앙)
            GameObject anchorGo = new GameObject("PopupAnchor", typeof(RectTransform));
            anchorGo.transform.SetParent(safeAreaPanel, false);
            popupAnchor = anchorGo.GetComponent<RectTransform>();
            popupAnchor.anchorMin = new Vector2(0.5f, 0.5f);
            popupAnchor.anchorMax = new Vector2(0.5f, 0.5f);
            popupAnchor.pivot = new Vector2(0.5f, 0.5f);
            popupAnchor.anchoredPosition = new Vector2(110f, -40f); // 사이드바 공간(220px) 절반 우측 보정
            popupAnchor.sizeDelta = new Vector2(800f, 600f);

            // 7. 안나 스탠딩 캐릭터 UI 생성 (우측 하단)
            GameObject annaGo = new GameObject("AnnaStandingUI", typeof(RectTransform), typeof(AnnaStandingUI));
            annaGo.transform.SetParent(safeAreaPanel, false);

            // 8. 스마트폰 UI 생성 (우측 하단)
            CreateSmartphoneUI();

            _isInitialized = true;
            Debug.Log("[MainHUDMaster] 마스터 HUD 동적 구축이 완료되었습니다.");

            // 초기 이벤트 구독 등록 및 강제 동기화
            EventBus.Subscribe<CashChangedEvent>(OnCashChanged);
            EventBus.Subscribe<NetWorthUpdatedEvent>(OnNetWorthUpdated);
            RefreshAllDataImmediate();
        }

        /// <summary>
        /// 사이드바 전용 프리미엄 메인 버튼을 생성합니다.
        /// </summary>
        private void CreateMenuButton(Transform parent, string labelText, Action onClickAction)
        {
            GameObject btnGo = new GameObject($"Btn_{labelText}", typeof(RectTransform), typeof(Image), typeof(Button));
            btnGo.transform.SetParent(parent, false);

            LayoutElement le = btnGo.AddComponent<LayoutElement>();
            le.preferredHeight = 50f;

            Image btnImg = btnGo.GetComponent<Image>();
            btnImg.color = new Color(0.12f, 0.12f, 0.16f, 1f); // 기본 버튼 다크 배경

            // 버튼 컴포넌트 이벤트 등록
            Button btn = btnGo.GetComponent<Button>();
            btn.transition = Button.Transition.ColorTint;
            
            ColorBlock cb = btn.colors;
            cb.normalColor = new Color(0.12f, 0.12f, 0.16f, 1f);
            cb.highlightedColor = new Color(0.18f, 0.18f, 0.24f, 1f);
            cb.pressedColor = new Color(0.08f, 0.08f, 0.12f, 1f);
            cb.selectedColor = new Color(0.12f, 0.12f, 0.16f, 1f);
            cb.disabledColor = new Color(0.05f, 0.05f, 0.05f, 0.5f);
            btn.colors = cb;

            btn.onClick.AddListener(() => onClickAction?.Invoke());

            // 마이크로 호버 및 스케일 애니메이션 스크립트 연결
            btnGo.AddComponent<UI_HoverEffect>();

            // 텍스트 생성
            GameObject txtGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            txtGo.transform.SetParent(btnGo.transform, false);
            RectTransform txtRt = txtGo.GetComponent<RectTransform>();
            txtRt.anchorMin = Vector2.zero;
            txtRt.anchorMax = Vector2.one;
            txtRt.offsetMin = Vector2.zero;
            txtRt.offsetMax = Vector2.zero;

            TextMeshProUGUI tmp = txtGo.GetComponent<TextMeshProUGUI>();
            tmp.text = labelText;
            tmp.fontSize = 16;
            tmp.color = Color.white;
            tmp.alignment = TextAlignmentOptions.Center;
        }

        /// <summary>
        /// 화면 우측 하단에 상시 배치되는 스마트폰 아이콘과 앱 서랍(Frame) 프레임워크를 생성합니다.
        /// </summary>
        private void CreateSmartphoneUI()
        {
            // 1. 스마트폰 최상위 루트 (우측 하단 고정)
            GameObject phoneRootGo = new GameObject("SmartphoneUI_Root", typeof(RectTransform));
            phoneRootGo.transform.SetParent(safeAreaPanel, false);
            RectTransform rootRt = phoneRootGo.GetComponent<RectTransform>();
            rootRt.anchorMin = new Vector2(1f, 0f);
            rootRt.anchorMax = new Vector2(1f, 0f);
            rootRt.pivot = new Vector2(1f, 0f);
            rootRt.anchoredPosition = new Vector2(-20f, 20f); // 우하단 여백
            rootRt.sizeDelta = new Vector2(300f, 600f);

            // 2. 스마트폰 프레임 패널 (앱 서랍)
            GameObject frameGo = new GameObject("SmartphoneFrame", typeof(RectTransform), typeof(Image), typeof(SmartphoneController));
            frameGo.transform.SetParent(phoneRootGo.transform, false);
            RectTransform frameRt = frameGo.GetComponent<RectTransform>();
            frameRt.anchorMin = new Vector2(0.5f, 0f);
            frameRt.anchorMax = new Vector2(0.5f, 0f);
            frameRt.pivot = new Vector2(0.5f, 0f);
            frameRt.anchoredPosition = new Vector2(0f, 80f); // 아이콘 버튼 바로 위에 위치
            frameRt.sizeDelta = new Vector2(340f, 650f);

            Image frameImg = frameGo.GetComponent<Image>();
            Sprite frameSprite = Resources.Load<Sprite>("Sprites/SmartPhone/Frame");
            if (frameSprite != null)
            {
                frameImg.sprite = frameSprite;
            }
            else
            {
                // 로드 실패 시 폴백
                frameImg.color = new Color(0.9f, 0.9f, 0.85f, 1f); // 코지 베이지
            }

            SmartphoneController controller = frameGo.GetComponent<SmartphoneController>();
            controller.Initialize(frameRt);

            // 3. 앱 그리드 컨테이너 생성
            GameObject gridGo = new GameObject("AppGrid", typeof(RectTransform), typeof(GridLayoutGroup));
            gridGo.transform.SetParent(frameGo.transform, false);
            RectTransform gridRt = gridGo.GetComponent<RectTransform>();
            gridRt.anchorMin = new Vector2(0f, 0f);
            gridRt.anchorMax = new Vector2(1f, 1f);
            gridRt.offsetMin = new Vector2(25f, 40f); // 프레임 내부 여백
            gridRt.offsetMax = new Vector2(-25f, -60f);

            GridLayoutGroup grid = gridGo.GetComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(80f, 80f);
            grid.spacing = new Vector2(10f, 15f);
            grid.startCorner = GridLayoutGroup.Corner.UpperLeft;
            grid.startAxis = GridLayoutGroup.Axis.Horizontal;
            grid.childAlignment = TextAnchor.UpperCenter;

            // 앱 아이콘 추가 (Mail, Stock, Social, Memo, Achievements, Option)
            string[] appNames = { "Mail", "Stock", "Social", "Memo", "Achievements", "Option" };
            foreach (string app in appNames)
            {
                GameObject appGo = new GameObject($"App_{app}", typeof(RectTransform), typeof(Image), typeof(Button));
                appGo.transform.SetParent(gridGo.transform, false);
                Image appImg = appGo.GetComponent<Image>();
                Sprite appSprite = Resources.Load<Sprite>($"Sprites/SmartPhone/{app}Icon");
                if (appSprite != null)
                {
                    appImg.sprite = appSprite;
                }
                else
                {
                    appImg.color = new Color(0.2f, 0.2f, 0.2f, 1f); // 더미 컬러
                }
                
                Button appBtn = appGo.GetComponent<Button>();
                appBtn.transition = Button.Transition.ColorTint;
                appBtn.onClick.AddListener(() => Debug.Log($"[Smartphone] {app} 앱 실행됨!"));
            }

            // 4. 스마트폰 토글 아이콘 버튼 생성 (항상 표시됨)
            GameObject iconBtnGo = new GameObject("ToggleSmartphoneButton", typeof(RectTransform), typeof(Image), typeof(Button));
            iconBtnGo.transform.SetParent(phoneRootGo.transform, false);
            RectTransform iconBtnRt = iconBtnGo.GetComponent<RectTransform>();
            iconBtnRt.anchorMin = new Vector2(0.5f, 0f);
            iconBtnRt.anchorMax = new Vector2(0.5f, 0f);
            iconBtnRt.pivot = new Vector2(0.5f, 0f);
            iconBtnRt.anchoredPosition = new Vector2(0f, 0f);
            iconBtnRt.sizeDelta = new Vector2(80f, 80f);

            Image iconImg = iconBtnGo.GetComponent<Image>();
            Sprite toggleSprite = Resources.Load<Sprite>("Sprites/SmartPhone/SmartPhoneIcon");
            if (toggleSprite != null)
            {
                iconImg.sprite = toggleSprite;
            }
            else
            {
                iconImg.color = new Color(0.1f, 0.8f, 0.6f, 1f); // 민트색 폴백
            }

            Button toggleBtn = iconBtnGo.GetComponent<Button>();
            toggleBtn.transition = Button.Transition.ColorTint;
            toggleBtn.onClick.AddListener(controller.ToggleSmartphone);
            
            // 호버 이펙트 추가 (부드럽게 커지는 효과)
            iconBtnGo.AddComponent<UI_HoverEffect>();
        }

        /// <summary>
        /// 시간 갱신 처리 (매 프레임 호출되나, 1초마다 한 번씩 텍스트를 업데이트하여 GC 억제)

        /// </summary>
        private void UpdateTimeDisplay()
        {
            if (timeText == null || CalendarSystem.Instance == null) return;

            DateTime now = CalendarSystem.Instance.CurrentTimeLocal;
            int currentSecond = now.Second;

            if (currentSecond != _lastSecond)
            {
                _lastSecond = currentSecond;
                timeText.text = $"<color=#00EAFF><b>TIME</b></color>  {now:yyyy-MM-dd HH:mm:ss}";
            }
        }

        /// <summary>
        /// 초기 진입 또는 활성화 시 모든 스태틱 데이터를 강제 갱신합니다.
        /// </summary>
        private void RefreshAllDataImmediate()
        {
            if (goldText != null && WalletManager.Instance != null)
            {
                UpdateGoldText(WalletManager.Instance.GetCash());
            }

            if (netWorthText != null)
            {
                long netWorth = 0;
                if (NetWorthCore.Instance != null)
                {
                    netWorth = NetWorthCore.Instance.GetNetWorth();
                }
                else if (WalletManager.Instance != null)
                {
                    netWorth = WalletManager.Instance.GetCash();
                }
                UpdateNetWorthText(netWorth);
            }
            _lastSecond = -1; // 강제 시간 갱신 유도
            UpdateTimeDisplay();
        }

        private void OnCashChanged(CashChangedEvent e)
        {
            UpdateGoldText(e.NewCash);
        }

        private void OnNetWorthUpdated(NetWorthUpdatedEvent e)
        {
            UpdateNetWorthText(e.NetWorth);
        }

        private void UpdateGoldText(long amount)
        {
            if (goldText != null)
            {
                goldText.text = $"<color=#EAD018><b>GOLD:</b></color> {amount:N0} G";
            }
        }

        private void UpdateNetWorthText(long amount)
        {
            if (netWorthText != null)
            {
                netWorthText.text = $"<color=#00EAFF><b>NET WORTH:</b></color> {amount:N0} G";
            }
        }
    }

    /// <summary>
    /// 버튼 마우스 호버 스케일 및 텍스트 컬러 피드백 애니메이션
    /// </summary>
    public class UI_HoverEffect : MonoBehaviour, UnityEngine.EventSystems.IPointerEnterHandler, UnityEngine.EventSystems.IPointerExitHandler
    {
        private Vector3 _originalScale = Vector3.one;
        private Image _buttonImage;
        private TextMeshProUGUI _textMesh;

        private void Start()
        {
            _originalScale = transform.localScale;
            _buttonImage = GetComponent<Image>();
            _textMesh = GetComponentInChildren<TextMeshProUGUI>();
        }

        public void OnPointerEnter(UnityEngine.EventSystems.PointerEventData eventData)
        {
            // 부드러운 스케일 업 효과
            transform.localScale = _originalScale * 1.05f;
            if (_textMesh != null)
            {
                // 글씨색을 Cyan으로 변경
                _textMesh.color = new Color(0f, 0.92f, 1f, 1f);
            }
            if (_buttonImage != null)
            {
                _buttonImage.color = new Color(0.18f, 0.18f, 0.24f, 1f);
            }
        }

        public void OnPointerExit(UnityEngine.EventSystems.PointerEventData eventData)
        {
            // 스케일 복원
            transform.localScale = _originalScale;
            if (_textMesh != null)
            {
                _textMesh.color = Color.white;
            }
            if (_buttonImage != null)
            {
                _buttonImage.color = new Color(0.12f, 0.12f, 0.16f, 1f);
            }
        }
    }
}
