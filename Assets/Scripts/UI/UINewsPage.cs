using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 뉴스 전용 독립 페이지(Page_News) 컨트롤러입니다.
    /// GDD_12 기업 뉴스 이벤트 시스템 연동 및 뉴스 본문 상세 페이지(NewsContent)의 100% 풀스크린 불투명 덮개 처리,
    /// 폰트 깨짐 방지 및 넉넉한 가독성 여백을 전담합니다.
    /// </summary>
    public class UINewsPage : MonoBehaviour
    {
        [Header("News List View (뉴스 목록 영역)")]
        [SerializeField] private ScrollRect _newsScrollRect;
        [SerializeField] private Transform _newsContainer;
        [SerializeField] private GameObject _newsCardPrefab; // 프리팹으로 만든 NewsCard
        [SerializeField] private int _maxNewsCount = 15;     // 뉴스 페이지 표시 최대 뉴스 개수 (기본 15개)

        [Header("Article Detail View (뉴스 본문 상세 영역: NewsContent)")]
        [SerializeField] private GameObject _articleDetailPanel;   // NewsContent 오브젝트
        [SerializeField] private TMP_Text _articleTitleText;       // 헤드라인 텍스트
        [SerializeField] private TMP_Text _articlePublisherText;   // 발행 시간 & 언론사 텍스트
        [SerializeField] private TMP_Text _articleBodyText;        // 뉴스 본문 텍스트
        [SerializeField] private Button _closeDetailButton;        // 본문 닫기/뒤로가기 버튼

        [Header("Filter & Header UI")]
        [SerializeField] private TMP_Text _pageHeaderTitleText;

        private List<GameObject> _spawnedNewsCards = new List<GameObject>();
        private string _selectedStockId = null;
        private List<NewsData> _livePublishedNewsList = new List<NewsData>();

        private void Awake()
        {
            EnsureContainerSetup();
            EnsureDetailSetup();
            InitializeDefaultGddNewsPool();
            
            // GDD 전역 뉴스 발행 이벤트 수신 구독
            EventBus.Subscribe<NewsPublishedEvent>(OnRealGameNewsPublished);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<NewsPublishedEvent>(OnRealGameNewsPublished);
        }

        private void OnEnable()
        {
            EnsureContainerSetup();
            EnsureDetailSetup();

            // 다른 페이지들(Page_Home, Page_Market, Page_Trade)이 뒤에 겹쳐있지 않도록 가려줍니다.
            Transform contentArea = transform.parent;
            if (contentArea != null)
            {
                foreach (Transform child in contentArea)
                {
                    if (child != transform && child.name.StartsWith("Page_", StringComparison.OrdinalIgnoreCase))
                    {
                        child.gameObject.SetActive(false);
                    }
                }
            }

            RenderNewsList();
        }

        /// <summary>
        /// NewsContent 패널을 100% 풀스크린 불투명 패널로 확정하고, 자식 텍스트의 레이아웃 및 폰트를 자동 보정합니다.
        /// </summary>
        public void EnsureDetailSetup()
        {
            if (_articleDetailPanel == null)
            {
                Transform detailTrans = transform.Find("NewsContent");
                if (detailTrans == null) detailTrans = transform.Find("ArticleDetailPanel");
                if (detailTrans != null) _articleDetailPanel = detailTrans.gameObject;
            }

            if (_articleDetailPanel != null)
            {
                // 1. NewsContent 패널을 Page_News 전체 화면에 100% 가득 채우고 뒤쪽 뷰(제목, 스크롤뷰)를 완전 차단!
                RectTransform detailRect = _articleDetailPanel.GetComponent<RectTransform>();
                if (detailRect != null)
                {
                    detailRect.anchorMin = Vector2.zero;
                    detailRect.anchorMax = Vector2.one;
                    detailRect.offsetMin = Vector2.zero;
                    detailRect.offsetMax = Vector2.zero;
                }

                // 배경 이미지 색상을 100% 불투명 따뜻한 베이지(#FAF3E0)로 설정하여 뒤쪽 배경 완벽 덮기
                Image detailBgImg = _articleDetailPanel.GetComponent<Image>();
                if (detailBgImg == null) detailBgImg = _articleDetailPanel.gameObject.AddComponent<Image>();
                detailBgImg.color = new Color(0.98f, 0.95f, 0.88f, 1.0f); // 100% 불투명
                detailBgImg.raycastTarget = true; // 뒤쪽 터치 클릭 완전 방어

                // 2. 닫기/뒤로가기 버튼 자동 바인딩
                if (_closeDetailButton == null)
                {
                    _closeDetailButton = _articleDetailPanel.GetComponentInChildren<Button>(true);
                }

                if (_closeDetailButton == null)
                {
                    _closeDetailButton = CreateBackButton(_articleDetailPanel.transform);
                }

                if (_closeDetailButton != null)
                {
                    _closeDetailButton.onClick.RemoveAllListeners();
                    _closeDetailButton.onClick.AddListener(HideArticleDetail);
                }

                // 3. 텍스트 컴포넌트 자동 탐색 바인딩
                var texts = _articleDetailPanel.GetComponentsInChildren<TMP_Text>(true);
                foreach (var txt in texts)
                {
                    string n = txt.name;
                    if (_articleTitleText == null && (n.IndexOf("Title", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Head", StringComparison.OrdinalIgnoreCase) >= 0))
                    {
                        _articleTitleText = txt;
                    }
                    else if (_articlePublisherText == null && (n.IndexOf("Publisher", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Date", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Time", StringComparison.OrdinalIgnoreCase) >= 0))
                    {
                        _articlePublisherText = txt;
                    }
                    else if (_articleBodyText == null && (n.IndexOf("Body", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Content", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Detail", StringComparison.OrdinalIgnoreCase) >= 0))
                    {
                        _articleBodyText = txt;
                    }
                }

                if (texts.Length >= 1 && _articleTitleText == null) _articleTitleText = texts[0];
                if (texts.Length >= 2 && _articlePublisherText == null) _articlePublisherText = texts[1];
                if (texts.Length >= 3 && _articleBodyText == null) _articleBodyText = texts[2];

                // 4. ContentBox 스크롤 박스 패딩 및 크기 조절 (뒤로가기 버튼 아래 -95px 지점부터 시작)
                Transform contentBoxTrans = _articleDetailPanel.transform.Find("ContentBox");
                if (contentBoxTrans != null)
                {
                    RectTransform cbRect = contentBoxTrans.GetComponent<RectTransform>();
                    if (cbRect != null)
                    {
                        cbRect.anchorMin = Vector2.zero;
                        cbRect.anchorMax = Vector2.one;
                        cbRect.offsetMin = new Vector2(0f, 110f);  // 하단 내비게이션 바 위 110px 공간 확보
                        cbRect.offsetMax = new Vector2(0f, -95f);  // 상단 뒤로가기 버튼 아래 95px 공간 확보 (시계 및 버튼 겹침 해결!)
                    }
                }

                // 5. 스크롤 내부 Content 레이아웃 패딩 설정
                Transform contentTrans = _articleDetailPanel.transform.Find("ContentBox/Viewport/Content");
                if (contentTrans == null) contentTrans = _articleDetailPanel.transform.Find("Viewport/Content");
                if (contentTrans == null) contentTrans = _articleDetailPanel.transform.Find("Content");

                if (contentTrans != null)
                {
                    var vlg = contentTrans.GetComponent<VerticalLayoutGroup>();
                    if (vlg == null) vlg = contentTrans.gameObject.AddComponent<VerticalLayoutGroup>();
                    vlg.padding = new RectOffset(25, 25, 15, 30); // 좌우 25px 시원하고 넉넉한 여백
                    vlg.spacing = 15f;
                    vlg.childControlWidth = true;
                    vlg.childControlHeight = true;
                    vlg.childForceExpandWidth = true;
                    vlg.childForceExpandHeight = false;

                    var csf = contentTrans.GetComponent<ContentSizeFitter>();
                    if (csf == null) csf = contentTrans.gameObject.AddComponent<ContentSizeFitter>();
                    csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
                    csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                }
            }
        }

        private Button CreateBackButton(Transform parent)
        {
            GameObject btnObj = new GameObject("Btn_BackToList", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
            btnObj.transform.SetParent(parent, false);

            RectTransform btnRect = btnObj.GetComponent<RectTransform>();
            btnRect.anchorMin = new Vector2(0f, 1f);
            btnRect.anchorMax = new Vector2(0f, 1f);
            btnRect.pivot = new Vector2(0f, 1f);
            btnRect.anchoredPosition = new Vector2(20f, -45f); // 시계(00:25) 아래로 45px 충분히 내림
            btnRect.sizeDelta = new Vector2(95f, 34f);

            Image img = btnObj.GetComponent<Image>();
            img.color = new Color(0.88f, 0.82f, 0.72f, 1f);

            GameObject txtObj = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer), typeof(TextMeshProUGUI));
            txtObj.transform.SetParent(btnObj.transform, false);

            RectTransform txtRect = txtObj.GetComponent<RectTransform>();
            txtRect.anchorMin = Vector2.zero;
            txtRect.anchorMax = Vector2.one;
            txtRect.sizeDelta = Vector2.zero;

            TextMeshProUGUI tmp = txtObj.GetComponent<TextMeshProUGUI>();
            if (_articleTitleText != null && _articleTitleText.font != null)
            {
                tmp.font = _articleTitleText.font; // 한글 폰트 에셋 상속 (□□□ 에러 방지)
            }
            tmp.text = "← 뒤로";
            tmp.fontSize = 15;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = new Color(0.2f, 0.12f, 0.05f, 1f);
            tmp.fontStyle = FontStyles.Bold;

            return btnObj.GetComponent<Button>();
        }

        /// <summary>
        /// NewsEventScheduler가 GDD 틱 주기(08, 11, 14, 17, 20시)에 발생시킨 진짜 이벤트를 실시간 추가 수신합니다.
        /// </summary>
        private void OnRealGameNewsPublished(NewsPublishedEvent e)
        {
            string timeStr = DateTime.Now.ToString("HH:mm");
            if (CalendarSystem.Instance != null)
            {
                timeStr = CalendarSystem.Instance.CurrentTimeLocal.ToString("HH:mm");
            }

            NewsData newData = new NewsData
            {
                Title = e.Headline,
                Publisher = $"[스톡뉴스 / {e.CompanyName}] | {timeStr} 속보",
                Body = GenerateDetailedNewsBody(e.CompanyName, e.Headline, e.ImpactPercentage, e.OldPrice, e.NewPrice)
            };

            _livePublishedNewsList.Insert(0, newData);

            if (_livePublishedNewsList.Count > _maxNewsCount)
            {
                _livePublishedNewsList.RemoveAt(_livePublishedNewsList.Count - 1);
            }

            if (gameObject.activeInHierarchy)
            {
                RenderNewsList();
            }
        }

        /// <summary>
        /// 뉴스 스크롤 뷰, Content 컨테이너 및 LayoutGroup을 안전하게 자동 탐색 바인딩합니다.
        /// </summary>
        public void EnsureContainerSetup()
        {
            if (_newsScrollRect == null) _newsScrollRect = GetComponentInChildren<ScrollRect>(true);
            if (_newsContainer == null && _newsScrollRect != null) _newsContainer = _newsScrollRect.content;
            
            if (_newsContainer == null)
            {
                Transform contentTrans = transform.Find("NewsScrollView/Viewport/Content");
                if (contentTrans == null) contentTrans = transform.Find("Viewport/Content");
                if (contentTrans == null) contentTrans = transform.Find("Content");
                if (contentTrans != null) _newsContainer = contentTrans;
            }

            if (_newsContainer != null)
            {
                var csf = _newsContainer.GetComponent<ContentSizeFitter>();
                if (csf == null) csf = _newsContainer.gameObject.AddComponent<ContentSizeFitter>();
                csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
                csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

                var vlg = _newsContainer.GetComponent<VerticalLayoutGroup>();
                if (vlg == null) vlg = _newsContainer.gameObject.AddComponent<VerticalLayoutGroup>();
                vlg.spacing = 8f;
                vlg.childControlWidth = true;
                vlg.childControlHeight = true;
                vlg.childForceExpandWidth = true;
                vlg.childForceExpandHeight = false;
            }
        }

        /// <summary>
        /// 특정 종목의 뉴스 페이지로 데이터 바인딩을 수행합니다.
        /// </summary>
        public void OpenNewsForStock(string stockId, string companyName)
        {
            _selectedStockId = stockId;
            gameObject.SetActive(true);

            if (_pageHeaderTitleText != null)
            {
                _pageHeaderTitleText.text = string.IsNullOrEmpty(companyName) ? "실시간 주식 뉴스" : $"[{companyName}] 관련 뉴스";
            }

            RenderNewsList();
        }

        /// <summary>
        /// 현재 실시간 뉴스를 스크롤 뷰 내 렌더링합니다.
        /// </summary>
        public void RenderNewsList()
        {
            HideArticleDetail();

            EnsureContainerSetup();

            Transform container = _newsContainer;
            if (container == null) return;

            if (_livePublishedNewsList == null || _livePublishedNewsList.Count == 0)
            {
                InitializeDefaultGddNewsPool();
            }

            // 기존 동적 뉴스 카드 정리
            for (int c = container.childCount - 1; c >= 0; c--)
            {
                Transform child = container.GetChild(c);
                if (child.gameObject != _newsCardPrefab && child.gameObject.name.StartsWith("SpawnedNewsCard", StringComparison.OrdinalIgnoreCase))
                {
                    Destroy(child.gameObject);
                }
            }
            _spawnedNewsCards.Clear();

            int countToSpawn = Mathf.Min(_livePublishedNewsList.Count, _maxNewsCount);

            for (int i = 0; i < countToSpawn; i++)
            {
                var news = _livePublishedNewsList[i];
                GameObject cardGo = null;

                if (_newsCardPrefab != null)
                {
                    cardGo = Instantiate(_newsCardPrefab, container, false);
                }
                else
                {
                    cardGo = CreateFallbackNewsCard(container);
                }

                if (cardGo != null)
                {
                    cardGo.name = "SpawnedNewsCard";
                    cardGo.transform.localScale = Vector3.one;
                    cardGo.transform.localPosition = Vector3.zero;
                    cardGo.SetActive(true);

                    var le = cardGo.GetComponent<LayoutElement>();
                    if (le == null) le = cardGo.gameObject.AddComponent<LayoutElement>();
                    le.minHeight = 120f;
                    le.preferredHeight = 120f;
                    le.flexibleWidth = 1f;

                    RectTransform rect = cardGo.GetComponent<RectTransform>();
                    if (rect != null)
                    {
                        rect.anchoredPosition = Vector2.zero;
                        rect.sizeDelta = new Vector2(rect.sizeDelta.x, 120f);
                    }

                    _spawnedNewsCards.Add(cardGo);

                    // 텍스트 바인딩 (NewsCard 자식 TMP_Text)
                    var texts = cardGo.GetComponentsInChildren<TMP_Text>(true);
                    if (texts != null && texts.Length > 0)
                    {
                        bool boundHeadline = false;
                        foreach (var txt in texts)
                        {
                            txt.color = new Color(0.18f, 0.12f, 0.05f, 1f);

                            string n = txt.name;
                            if (n.IndexOf("Head", StringComparison.OrdinalIgnoreCase) >= 0 || 
                                n.IndexOf("Title", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                n.IndexOf("Headline", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                txt.text = news.Title;
                                boundHeadline = true;
                            }
                            else if (n.IndexOf("Publisher", StringComparison.OrdinalIgnoreCase) >= 0 || 
                                     n.IndexOf("Date", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                txt.text = news.Publisher;
                            }
                        }

                        if (!boundHeadline && texts.Length > 0)
                        {
                            texts[0].text = news.Title;
                        }
                    }

                    // 뉴스 카드 클릭 시 본문 상세 페이지(NewsContent) 열기!
                    Button cardBtn = cardGo.GetComponent<Button>();
                    if (cardBtn == null) cardBtn = cardGo.GetComponentInChildren<Button>();
                    if (cardBtn != null)
                    {
                        var newsItem = news;
                        cardBtn.onClick.RemoveAllListeners();
                        cardBtn.onClick.AddListener(() =>
                        {
                            ShowArticleDetail(newsItem);
                        });
                    }
                }
            }

            // 레이아웃 즉시 강제 갱신
            RectTransform containerRect = container as RectTransform;
            if (containerRect != null)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(containerRect);
            }
        }

        private bool _openedFromInfoPanel = false;
        private UIStockInfoPanel _sourceInfoPanel = null;
        private StockInstance _targetInfoStock = null;

        /// <summary>
        /// 클릭한 기사의 상세 내용(헤드라인, 발행시간, 본문)을 NewsContent 패널에 바인딩하고 풀스크린 뷰로 가독성 높게 조절합니다.
        /// </summary>
        public void ShowArticleDetail(NewsData news, bool openedFromInfoPanel = false, UIStockInfoPanel sourceInfoPanel = null, StockInstance targetStock = null)
        {
            _openedFromInfoPanel = openedFromInfoPanel;
            _sourceInfoPanel = sourceInfoPanel;
            _targetInfoStock = targetStock;

            EnsureDetailSetup();

            if (_articleDetailPanel != null)
            {
                _articleDetailPanel.SetActive(true);

                if (_articleTitleText != null)
                {
                    _articleTitleText.text = news.Title;
                    _articleTitleText.fontSize = 20f;
                    _articleTitleText.fontStyle = FontStyles.Bold;
                    _articleTitleText.color = new Color(0.16f, 0.10f, 0.04f, 1f);
                    _articleTitleText.lineSpacing = 8f;
                }

                if (_articlePublisherText != null)
                {
                    _articlePublisherText.text = news.Publisher;
                    _articlePublisherText.fontSize = 13f;
                    _articlePublisherText.color = new Color(0.55f, 0.45f, 0.35f, 1f);
                }

                if (_articleBodyText != null)
                {
                    _articleBodyText.text = string.IsNullOrEmpty(news.Body) ? GenerateDetailedNewsBody("", news.Title, 0f, 0, 0) : news.Body;
                    _articleBodyText.fontSize = 15f;
                    _articleBodyText.lineSpacing = 10f;
                    _articleBodyText.paragraphSpacing = 16f;
                    _articleBodyText.color = new Color(0.18f, 0.12f, 0.05f, 1f);

                    var csf = _articleBodyText.GetComponent<ContentSizeFitter>();
                    if (csf == null) csf = _articleBodyText.gameObject.AddComponent<ContentSizeFitter>();
                    csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
                    csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                }

                // UI 레이아웃 즉시 강제 갱신
                Canvas.ForceUpdateCanvases();
                var rects = _articleDetailPanel.GetComponentsInChildren<RectTransform>(true);
                foreach (var r in rects)
                {
                    LayoutRebuilder.ForceRebuildLayoutImmediate(r);
                }
            }
        }

        /// <summary>
        /// 뉴스 상세 본문 패널(NewsContent)을 닫고 이전 위치(뉴스 목록 또는 종목 정보탭)로 100% 원복합니다.
        /// </summary>
        public void HideArticleDetail()
        {
            if (_articleDetailPanel != null)
            {
                _articleDetailPanel.SetActive(false);
            }

            if (_openedFromInfoPanel)
            {
                _openedFromInfoPanel = false;

                // 뉴스 전용 페이지 끄기
                gameObject.SetActive(false);

                // 원래 정보탭 및 상위 페이지 100% 원복
                if (_sourceInfoPanel != null)
                {
                    Transform parentPage = _sourceInfoPanel.transform.parent;
                    while (parentPage != null && !parentPage.name.StartsWith("Page_", StringComparison.OrdinalIgnoreCase))
                    {
                        parentPage = parentPage.parent;
                    }

                    if (parentPage != null)
                    {
                        parentPage.gameObject.SetActive(true);
                    }

                    _sourceInfoPanel.gameObject.SetActive(true);
                    if (_targetInfoStock != null)
                    {
                        _sourceInfoPanel.SetStock(_targetInfoStock);
                    }
                }
                else
                {
                    var appController = GetComponentInParent<StockMarketAppController>();
                    if (appController == null) appController = UnityEngine.Object.FindFirstObjectByType<StockMarketAppController>();
                    if (appController != null)
                    {
                        appController.OpenPageHome();
                    }
                }

                _sourceInfoPanel = null;
                _targetInfoStock = null;
            }
        }

        private string GenerateDetailedNewsBody(string companyName, string headline, float impact, long oldPrice, long newPrice)
        {
            string directionStr = impact >= 0 ? $"전일 대비 +{impact:F1}% 급등" : $"전일 대비 {impact:F1}% 하락";
            string changeDetail = (oldPrice > 0 && newPrice > 0) ? $"이 영향으로 주가는 기존 {oldPrice:N0}G에서 {newPrice:N0}G로 형성되고 있습니다." : "시장 투자자들의 거래량이 폭발적으로 증가하고 있습니다.";

            return $"[스톡뉴스 종합] {headline}\n\n" +
                   $"금일 주식 시장에서 큰 주목을 받고 있는 이번 이슈는 글로벌 시장의 변동성과 섹터 내 신규 모멘텀이 상호 작용하여 발생했습니다.\n\n" +
                   $"증권 전문가 리포트에 따르면 시장 참여자들의 강한 매수세 및 매도세가 유입되며 주가는 {directionStr}하는 양상을 보였습니다. {changeDetail}\n\n" +
                   $"향후 추가적인 기업 공시 및 주주총회 발표 결과에 따라 주가의 추가 변동성이 예상되므로 투법 투자자들의 주의가 요구됩니다.";
        }

        private void InitializeDefaultGddNewsPool()
        {
            _livePublishedNewsList.Clear();

            string[] defaultTitles = new string[]
            {
                "[클라우드 베리] 3분기 실적 폭증 발표... 시장 기대치 상회!",
                "[단독] 블루 스카이, 신규 글로벌 유통 계약 체결 대박",
                "[시황] 퀸덤 바이오 외국인·기관 동반 매수세 유입",
                "[사이버 테크] 차세대 양자 보안 신기술 특허 취득 성공",
                "[네온 에너지] 상반기 신재생 에너지 수주액 1.2M G 돌파"
            };

            for (int i = 0; i < defaultTitles.Length; i++)
            {
                string title = defaultTitles[i];
                _livePublishedNewsList.Add(new NewsData
                {
                    Title = title,
                    Publisher = $"[스톡뉴스 / 경제] | 08:00 정기 속보",
                    Body = GenerateDetailedNewsBody("스톡뉴스", title, 12.5f, 15000, 16875)
                });
            }
        }

        private GameObject CreateFallbackNewsCard(Transform parent)
        {
            GameObject card = new GameObject("SpawnedNewsCard", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(LayoutElement));
            card.transform.SetParent(parent, false);

            LayoutElement le = card.GetComponent<LayoutElement>();
            le.minHeight = 120f;
            le.preferredHeight = 120f;
            le.flexibleWidth = 1f;

            Image img = card.GetComponent<Image>();
            img.color = new Color(0.95f, 0.90f, 0.82f, 1f);

            GameObject textObj = new GameObject("Headline", typeof(RectTransform), typeof(CanvasRenderer), typeof(TextMeshProUGUI));
            textObj.transform.SetParent(card.transform, false);

            RectTransform textRect = textObj.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = new Vector2(20, 15);
            textRect.offsetMax = new Vector2(-20, -15);

            TextMeshProUGUI tmp = textObj.GetComponent<TextMeshProUGUI>();
            tmp.fontSize = 20;
            tmp.alignment = TextAlignmentOptions.MidlineLeft;
            tmp.color = new Color(0.18f, 0.12f, 0.05f, 1f);

            return card;
        }

        public struct NewsData
        {
            public string Title;
            public string Publisher;
            public string Body;
        }
    }
}
