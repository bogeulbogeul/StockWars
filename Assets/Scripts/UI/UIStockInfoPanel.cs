using System;
using System.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 주식 상세 정보 탭(InfoPanel) 전용 깔끔하게 정돈된 UI 컨트롤러입니다.
    /// 유저가 실제 사용하는 19개 핵심 필드만 슬롯으로 남기고 불필요한 팝업/중복 항목을 전면 삭제했습니다.
    /// </summary>
    public class UIStockInfoPanel : MonoBehaviour
    {
        [Header("Scroll View Reference")]
        [SerializeField] private ScrollRect _scrollRect;

        [Header("1. Company Info (기업 개요)")]
        [SerializeField] private TMP_Text _companyNameText;
        [SerializeField] private TMP_Text _companyDescText;
        [SerializeField] private TMP_Text _sectorTagText;

        [Header("2. Stats (4대 통계)")]
        [SerializeField] private TMP_Text _highLowText;
        [SerializeField] private TMP_Text _yearHighText;
        [SerializeField] private TMP_Text _volumeText;
        [SerializeField] private TMP_Text _marketCapText;

        [Header("3. Financial Statements - 손익계산서")]
        [SerializeField] private TMP_Text _revenueText;
        [SerializeField] private TMP_Text _cogsText;
        [SerializeField] private TMP_Text _opIncomeText;
        [SerializeField] private TMP_Text _netIncomeText;

        [Header("4. Financial Statements - 재무상태표")]
        [SerializeField] private TMP_Text _totalAssetsText;
        [SerializeField] private TMP_Text _totalLiabilitiesText;
        [SerializeField] private TMP_Text _debtRatioText;
        [SerializeField] private TMP_Text _totalEquityText;

        [Header("5. Financial Statements - 핵심 투자지표")]
        [SerializeField] private TMP_Text _perText;
        [SerializeField] private TMP_Text _pbrText;
        [SerializeField] private TMP_Text _roeText;
        [SerializeField] private TMP_Text _epsText;
        [SerializeField] private TMP_Text _dividendYieldText;

        [Header("6. Recent News Card (프리팹 동적 생성 지원)")]
        [SerializeField] private GameObject _newsCardPrefab; // 프로젝트 창의 NewsCard 프리팹!
        [SerializeField] private Transform _newsContainer;   // 프리팹 생성 부모 컨테이너
        [SerializeField] private int _maxRecentNewsCount = 3; // 최근 뉴스 최대 표시 개수 (기본 3개)
        [SerializeField] private Button _newsCardButton;
        [SerializeField] private TMP_Text _newsHeadlineText;

        private void Awake()
        {
            EnsureScrollSetup();
        }

        /// <summary>
        /// ScrollRect 및 ContentSizeFitter가 안전하게 연동되도록 자동 세팅합니다.
        /// </summary>
        public void EnsureScrollSetup()
        {
            if (_scrollRect == null) _scrollRect = GetComponent<ScrollRect>();
            if (_scrollRect == null) _scrollRect = GetComponentInParent<ScrollRect>();

            if (_scrollRect != null)
            {
                _scrollRect.horizontal = false;
                _scrollRect.vertical = true;
                _scrollRect.movementType = ScrollRect.MovementType.Elastic;
                _scrollRect.inertia = true;
                _scrollRect.scrollSensitivity = 15f;

                if (_scrollRect.content == null && transform.childCount > 0)
                {
                    Transform viewport = transform.Find("Viewport");
                    if (viewport != null && viewport.childCount > 0)
                    {
                        _scrollRect.content = viewport.GetChild(0).GetComponent<RectTransform>();
                    }
                    else
                    {
                        _scrollRect.content = transform.GetChild(0).GetComponent<RectTransform>();
                    }
                }

                if (_scrollRect.content != null)
                {
                    var csf = _scrollRect.content.GetComponent<ContentSizeFitter>();
                    if (csf == null) csf = _scrollRect.content.gameObject.AddComponent<ContentSizeFitter>();
                    csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
                    csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                }
            }
        }

        /// <summary>
        /// 지정된 주식 인스턴스의 데이터로 정보 패널 전체를 동적 갱신합니다.
        /// </summary>
        public void SetStock(StockInstance stock)
        {
            if (stock == null) return;

            EnsureScrollSetup();

            // 1. 주가 통계 계산
            long currentPrice = stock.CurrentPrice;
            long highPrice = currentPrice, lowPrice = currentPrice, yearHigh = currentPrice;
            if (stock.PriceHistory != null && stock.PriceHistory.Count > 0)
            {
                highPrice = stock.PriceHistory[0];
                lowPrice = stock.PriceHistory[0];
                for (int p = 0; p < stock.PriceHistory.Count; p++)
                {
                    long val = stock.PriceHistory[p];
                    if (val > highPrice) highPrice = val;
                    if (val < lowPrice) lowPrice = val;
                }
                yearHigh = (long)(highPrice * 1.25);
            }

            int stockSeed = stock.Data.stockId.GetHashCode();
            System.Random rand = new System.Random(stockSeed);

            long volume = rand.Next(50000, 300000);
            long marketCap = currentPrice * 100000;

            // 2. 상세 재무제표 데이터 산출 (손익계산서 + 재무상태표 + 투자지표)
            long revenue = (long)(marketCap * 0.45);                          // 매출액
            long cogs = (long)(revenue * 0.52);                               // 매출원가
            long opIncome = (long)(revenue * 0.18);                           // 영업이익
            double opMargin = Math.Round((double)opIncome / revenue * 100.0, 1); // 영업이익률 (%)
            long netIncome = (long)(opIncome * 0.75);                         // 당기순이익
            double netMargin = Math.Round((double)netIncome / revenue * 100.0, 1); // 순이익률 (%)

            long totalAssets = (long)(marketCap * 1.4);                       // 총자산
            long totalLiabilities = (long)(totalAssets * 0.35);               // 총부채
            long totalEquity = totalAssets - totalLiabilities;                // 자본총계
            double debtRatio = Math.Round((double)totalLiabilities / totalEquity * 100.0, 1); // 부채비율 (%)

            long eps = Math.Max(1, netIncome / 100000);                       // 주당순이익 (EPS)
            long bps = Math.Max(1, totalEquity / 100000);                     // 주당순자산 (BPS)
            double roe = Math.Round((double)netIncome / totalEquity * 100.0, 1); // ROE (%)
            double per = Math.Round((double)currentPrice / eps, 1);           // PER
            double pbr = Math.Round((double)currentPrice / bps, 2);           // PBR
            double divYield = Math.Round(1.5 + (rand.NextDouble() * 2.0), 1); // 배당수익률 (%)

            string richDesc = GetRichCompanyDescription(stock);

            // 3. 인스펙터 직통 1:1 바인딩 반영
            if (_companyNameText != null) _companyNameText.text = stock.Data.companyName;
            if (_companyDescText != null) _companyDescText.text = richDesc;
            if (_sectorTagText != null) _sectorTagText.text = $"[{stock.Data.sector}]";

            if (_highLowText != null) _highLowText.text = $"{highPrice:N0} G / {lowPrice:N0} G";
            if (_yearHighText != null) _yearHighText.text = $"{yearHigh:N0} G";
            if (_volumeText != null) _volumeText.text = $"{volume / 1000f:F1}k";
            if (_marketCapText != null) _marketCapText.text = $"{marketCap / 1000000f:F1}M G";

            if (_revenueText != null) _revenueText.text = $"매출액: {revenue:N0} G";
            if (_cogsText != null) _cogsText.text = $"매출원가: {cogs:N0} G";
            if (_opIncomeText != null) _opIncomeText.text = $"영업이익: {opIncome:N0} G";
            if (_netIncomeText != null) _netIncomeText.text = $"당기순이익: {netIncome:N0} G";

            if (_totalAssetsText != null) _totalAssetsText.text = $"총자산: {totalAssets / 1000000f:F1}M G";
            if (_totalLiabilitiesText != null) _totalLiabilitiesText.text = $"총부채: {totalLiabilities / 1000f:F0}K G";
            if (_debtRatioText != null) _debtRatioText.text = $"부채비율: {debtRatio:F1}%";
            if (_totalEquityText != null) _totalEquityText.text = $"자본총계: {totalEquity / 1000000f:F2}M G";

            if (_perText != null) _perText.text = $"PER: {per:F1}x";
            if (_pbrText != null) _pbrText.text = $"PBR: {pbr:F2}x";
            if (_roeText != null) _roeText.text = $"ROE: {roe:F1}%";
            if (_epsText != null) _epsText.text = $"EPS: {eps:N0}G";
            if (_dividendYieldText != null) _dividendYieldText.text = $"배당수익률: {divYield:F1}%";

            string[] newsTitles = new string[]
            {
                $"[{stock.Data.companyName}] 3분기 실적 폭증 발표... 시장 기대치 상회!",
                $"[단독] {stock.Data.companyName}, 글로벌 파트너사와 신규 공급 계약 체결 임박",
                $"[시황] {stock.Data.companyName} 외국인·기관 동반 순매수세 급증"
            };

            if (_newsHeadlineText != null && newsTitles.Length > 0)
            {
                _newsHeadlineText.text = newsTitles[0];
            }

            // 4. NewsCard 프리팹 동적 생성 (최대 3개 생성)
            if (_newsCardPrefab != null)
            {
                Transform container = _newsContainer;
                if (container == null && _scrollRect != null) container = _scrollRect.content;
                if (container == null) container = transform;

                // 기존 동적 뉴스 카드 깔끔 삭제
                for (int c = container.childCount - 1; c >= 0; c--)
                {
                    Transform child = container.GetChild(c);
                    if (child.gameObject.name.IndexOf("DynamicNewsCard", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        Destroy(child.gameObject);
                    }
                }

                int countToSpawn = Math.Min(_maxRecentNewsCount, newsTitles.Length);
                for (int i = 0; i < countToSpawn; i++)
                {
                    string currentTitle = newsTitles[i];

                    GameObject spawnedCard = Instantiate(_newsCardPrefab, container);
                    spawnedCard.name = $"DynamicNewsCard_{i + 1}";
                    spawnedCard.SetActive(true);

                    TMP_Text headText = spawnedCard.GetComponentInChildren<TMP_Text>();
                    if (headText != null) headText.text = currentTitle;

                    Button cardBtn = spawnedCard.GetComponent<Button>();
                    if (cardBtn == null) cardBtn = spawnedCard.GetComponentInChildren<Button>();
                    if (cardBtn != null)
                    {
                        string targetStockId = stock.StockId;
                        string targetCompName = stock.Data.companyName;
                        cardBtn.onClick.RemoveAllListeners();
                        cardBtn.onClick.AddListener(() =>
                        {
                            // 1. 뉴스 전용 페이지로 전환
                            var appController = GetComponentInParent<StockMarketAppController>();
                            if (appController == null) appController = UnityEngine.Object.FindFirstObjectByType<StockMarketAppController>();
                            if (appController != null)
                            {
                                appController.OpenPageNews();
                            }

                            // 2. 해당 뉴스의 본문 상세 패널(NewsContent) 즉시 열기!
                            var newsPage = UnityEngine.Object.FindFirstObjectByType<UINewsPage>();
                            if (newsPage != null)
                            {
                                newsPage.ShowArticleDetail(new UINewsPage.NewsData
                                {
                                    Title = currentTitle,
                                    Publisher = $"[스톡뉴스 / {targetCompName}] | 속보 리포트",
                                    Body = $"[{targetCompName}] 기업 관련 핵심 뉴스 및 시황 리포트입니다.\n\n금일 주식 시장에서 {targetCompName} 종목과 관련된 차세대 모멘텀이 크게 부각되며 시장 참여자들의 거래량이 수직 상승하고 있습니다.\n\n전문가 리포트에 따르면 기업 실적 개선 및 신규 계약 성사에 대한 기대감이 주가 반영을 주도하고 있으며, 향후 수급 추이에 주목할 필요가 있습니다."
                                }, openedFromInfoPanel: true, sourceInfoPanel: this, targetStock: stock);
                            }
                        });
                    }
                }
            }
            else
            {
                // 씬에 이미 배치된 씬 오브젝트 버튼 사용 시
                if (_newsCardButton == null)
                {
                    var buttons = GetComponentsInChildren<Button>(true);
                    foreach (var b in buttons)
                    {
                        if (b.name.IndexOf("News", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            _newsCardButton = b;
                            break;
                        }
                    }
                }

                if (_newsCardButton != null)
                {
                    string targetStockId = stock.StockId;
                    string targetCompName = stock.Data.companyName;

                    _newsCardButton.onClick.RemoveAllListeners();
                    _newsCardButton.onClick.AddListener(() =>
                    {
                        UINewsPage newsPage = transform.root.GetComponentInChildren<UINewsPage>(true);
                        if (newsPage != null)
                        {
                            newsPage.OpenNewsForStock(targetStockId, targetCompName);
                        }
                    });
                }
            }

            // 5. 인스펙터 미할당 항목에 대한 스마트 하이라키 탐색 바인딩
            var texts = GetComponentsInChildren<TMP_Text>(true);
            foreach (var txt in texts)
            {
                string n = txt.name.Replace(" ", "").Replace("_", "").Replace(".", "");

                if (n.IndexOf("CompanyName", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    n.IndexOf("StockName", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    n.IndexOf("CompanyTitle", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    n.IndexOf("TitleText", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = stock.Data.companyName;
                }
                else if (n.IndexOf("CompanyDesc", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("Lore", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("CompanyInfo", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("Desc", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         n.IndexOf("Info", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = richDesc;
                }
                else if (n.IndexOf("SectorTag", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"[{stock.Data.sector}]";
                }
                else if (n.IndexOf("HighLow", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"{highPrice:N0} G / {lowPrice:N0} G";
                }
                else if (n.IndexOf("YearHigh", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("52Week", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"{yearHigh:N0} G";
                }
                else if (n.IndexOf("Volume", StringComparison.OrdinalIgnoreCase) >= 0 && n.IndexOf("Val", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"{volume / 1000f:F1}k";
                }
                else if (n.IndexOf("MarketCap", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"{marketCap / 1000000f:F1}M G";
                }
                else if (n.Equals("Revenue", StringComparison.OrdinalIgnoreCase) || n.IndexOf("Sales", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"매출액: {revenue:N0} G";
                }
                else if (n.Equals("COGS", StringComparison.OrdinalIgnoreCase) || n.IndexOf("Cost", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"매출원가: {cogs:N0} G";
                }
                else if (n.IndexOf("OpProfit", StringComparison.OrdinalIgnoreCase) >= 0 || 
                         n.IndexOf("OpIncome", StringComparison.OrdinalIgnoreCase) >= 0 || 
                         n.IndexOf("Operating", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"영업이익: {opIncome:N0} G";
                }
                else if (n.IndexOf("NetIncome", StringComparison.OrdinalIgnoreCase) >= 0 || 
                         n.IndexOf("NetProfit", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    txt.text = $"당기순이익: {netIncome:N0} G";
                }
                else if (n.IndexOf("TotalAsset", StringComparison.OrdinalIgnoreCase) >= 0 || n.Equals("Asset", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"총자산: {totalAssets / 1000000f:F1}M G";
                }
                else if (n.IndexOf("TotalLiabilities", StringComparison.OrdinalIgnoreCase) >= 0 || n.Equals("Liabilities", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"총부채: {totalLiabilities / 1000f:F0}K G";
                }
                else if (n.IndexOf("DebtRatio", StringComparison.OrdinalIgnoreCase) >= 0 || n.Equals("Debt", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"부채비율: {debtRatio:F1}%";
                }
                else if (n.IndexOf("TotalEquity", StringComparison.OrdinalIgnoreCase) >= 0 || n.Equals("Equity", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"자본총계: {totalEquity / 1000000f:F2}M G";
                }
                else if (n.Equals("PER", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"PER: {per:F1}x";
                }
                else if (n.Equals("PBR", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"PBR: {pbr:F2}x";
                }
                else if (n.Equals("ROE", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"ROE: {roe:F1}%";
                }
                else if (n.Equals("EPS", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"EPS: {eps:N0}G";
                }
                else if (n.IndexOf("DividendYield", StringComparison.OrdinalIgnoreCase) >= 0 || 
                         n.IndexOf("DivYield", StringComparison.OrdinalIgnoreCase) >= 0 || 
                         n.Equals("Dividend", StringComparison.OrdinalIgnoreCase))
                {
                    txt.text = $"배당수익률: {divYield:F1}%";
                }
                else if (n.IndexOf("News", StringComparison.OrdinalIgnoreCase) >= 0 || n.IndexOf("Headline", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    if (newsTitles != null && newsTitles.Length > 0)
                    {
                        txt.text = newsTitles[0];
                    }
                }
            }
        }

        /// <summary>
        /// 기업 개요 카드가 비어 보이지 않도록 3문장 레이아웃의 상세 기업 소개를 생성합니다.
        /// </summary>
        private string GetRichCompanyDescription(StockInstance stock)
        {
            string baseDesc = stock.Data.description;

            if (string.IsNullOrEmpty(baseDesc))
            {
                return $"{stock.Data.companyName}은(는) {stock.Data.sector} 분야의 독보적인 독점권을 보유한 독점 우량 상장사입니다.\n\n차세대 유통망과 독자적인 노하우를 바탕으로 안정적인 잉여 현금 흐름을 이끌어내고 있으며, 독보적인 입지를 자랑합니다.";
            }

            return $"{baseDesc}\n\n차세대 기술 및 독자적인 가치 사슬 확장을 통해 지속적인 실적 성장을 기록 중이며, 상장 이후 견고한 유보율과 차별화된 시장 점유율을 유지하고 있는 우량 기업입니다.";
        }
    }
}
