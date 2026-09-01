using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 프로필 전용 독립 페이지(Page_Profile) 컨트롤러입니다.
    /// 총 평가 자산, 원금, 수익률, 보유 주식 목록(StocksHold) 및 자산/종목 비중(Graph) UI를 실시간으로 바인딩합니다.
    /// </summary>
    public class UIProfilePage : MonoBehaviour
    {
        [Header("Header Card (자산 요약 영역)")]
        [SerializeField] private TMP_Text _totalPriceText; // TotalPrice ("1,250,000 G")
        [SerializeField] private TMP_Text _realPriceText;  // RealPrice ("원금: 1,000,000 G")
        [SerializeField] private TMP_Text _percentText;    // Percent ("수익률: (+25.0%)")

        [Header("Stocks Hold View (보유 주식 목록 영역)")]
        [SerializeField] private Transform _holdingsContainer; // StocksHold/Viewport/Content
        [SerializeField] private GameObject _holdingRowPrefab;

        [Header("Graph View (자산/종목 비중 영역)")]
        [SerializeField] private TMP_Text _graphTitleText;     // Graph/Title ("종목 비중")
        [SerializeField] private Transform _graphContainer;    // Graph/Content

        private List<GameObject> _spawnedHoldingRows = new List<GameObject>();

        private void Awake()
        {
            EnsureSetup();
        }

        private void OnEnable()
        {
            EnsureSetup();
            RefreshProfileUI();
        }

        /// <summary>
        /// Page_Profile 자식 오브젝트들을 인스펙터 슬롯 미지정 시에도 100% 자동 탐색 바인딩합니다.
        /// </summary>
        public void EnsureSetup()
        {
            // 1. HeaderCard 자식 텍스트 바인딩 (유저 지정 텍스트 완전 보존)
            Transform headerCard = transform.Find("HeaderCard");
            if (headerCard != null)
            {
                if (_totalPriceText == null)
                {
                    Transform t = headerCard.Find("TotalPrice");
                    if (t != null) _totalPriceText = t.GetComponent<TMP_Text>();
                }
                if (_realPriceText == null)
                {
                    Transform t = headerCard.Find("RealPrice");
                    if (t != null) _realPriceText = t.GetComponent<TMP_Text>();
                }
                if (_percentText == null)
                {
                    Transform t = headerCard.Find("Percent");
                    if (t != null) _percentText = t.GetComponent<TMP_Text>();
                }
            }

            // 2. StocksHold 보유 주식 목록 컨테이너 바인딩 및 좌우 여백(Padding 15px) 보정 (삐져나옴 방지!)
            Transform stocksHoldTrans = transform.Find("StocksHold");
            if (_holdingsContainer == null && stocksHoldTrans != null)
            {
                Transform content = stocksHoldTrans.Find("Viewport/Content");
                if (content == null) content = stocksHoldTrans.Find("Content");
                if (content != null) _holdingsContainer = content;
            }

            if (_holdingsContainer != null)
            {
                var csf = _holdingsContainer.GetComponent<ContentSizeFitter>();
                if (csf == null) csf = _holdingsContainer.gameObject.AddComponent<ContentSizeFitter>();
                csf.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
                csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

                var vlg = _holdingsContainer.GetComponent<VerticalLayoutGroup>();
                if (vlg == null) vlg = _holdingsContainer.gameObject.AddComponent<VerticalLayoutGroup>();
                vlg.spacing = 6f;
                vlg.padding = new RectOffset(15, 15, 12, 12); // 좌우 15px 패딩으로 안쪽 정갈한 안착 (왼쪽 삐져나옴 해결!)
                vlg.childControlWidth = true;
                vlg.childControlHeight = true;
                vlg.childForceExpandWidth = true;
                vlg.childForceExpandHeight = false;
            }

            // 3. Graph 비중 컨테이너 바인딩
            Transform graphTrans = transform.Find("Graph");
            if (graphTrans != null)
            {
                if (_graphTitleText == null)
                {
                    Transform t = graphTrans.Find("Title");
                    if (t != null) _graphTitleText = t.GetComponent<TMP_Text>();
                }
                if (_graphContainer == null)
                {
                    Transform t = graphTrans.Find("Content");
                    if (t != null) _graphContainer = t;
                }
            }
        }

        /// <summary>
        /// 프로필 페이지 전체 데이터를 최신 세이브/시장 시세 기준으로 바인딩합니다.
        /// </summary>
        public void RefreshProfileUI()
        {
            EnsureSetup();

            long cash = 0;
            long netWorth = 0;
            long portfolioValue = 0;

            if (WalletManager.Instance != null)
            {
                cash = WalletManager.Instance.GetCash();
            }

            if (NetWorthCore.Instance != null)
            {
                netWorth = NetWorthCore.Instance.GetNetWorth();
                portfolioValue = NetWorthCore.Instance.GetPortfolioValue();
            }
            else
            {
                netWorth = cash;
            }

            // 원금 (매수 금액 계산)
            long investedCapital = Math.Max(1L, netWorth - portfolioValue);
            double profitRate = 0.0;

            if (portfolioValue > 0)
            {
                // 주식 보유 중인 경우 총 자산 변동률 연산
                profitRate = ((double)(netWorth - investedCapital) / investedCapital) * 100.0;
            }

            // 1. HeaderCard 바인딩
            if (_totalPriceText != null)
            {
                _totalPriceText.text = $"{netWorth:N0} G";
            }
            if (_realPriceText != null)
            {
                _realPriceText.text = $"원금: {investedCapital:N0} G";
            }
            if (_percentText != null)
            {
                string sign = profitRate >= 0 ? "+" : "";
                _percentText.text = $"수익률: ({sign}{profitRate:F1}%)";
                _percentText.color = profitRate >= 0 ? new Color(0.85f, 0.25f, 0.2f, 1f) : new Color(0.2f, 0.5f, 0.85f, 1f);
            }

            // 2. StocksHold 보유 주식 목록 렌더링
            RenderHoldingsList();

            // 3. Graph 자산 비중 렌더링
            RenderGraphAllocation(cash, portfolioValue, netWorth);
        }

        private void RenderHoldingsList()
        {
            Transform container = _holdingsContainer;
            if (container == null) return;

            // 기존 행 정리
            for (int c = container.childCount - 1; c >= 0; c--)
            {
                Transform child = container.GetChild(c);
                if (child.gameObject.name.StartsWith("SpawnedHoldingRow", StringComparison.OrdinalIgnoreCase))
                {
                    Destroy(child.gameObject);
                }
            }
            _spawnedHoldingRows.Clear();

            // 세이브 데이터로부터 보유 주식 리스트 가져오기
            var activeSave = WalletManager.Instance?.ActiveSaveData;
            List<StockInstance> heldStocks = new List<StockInstance>();

            if (MarketManager.Instance != null && activeSave != null && activeSave.Portfolio != null)
            {
                foreach (var kvp in activeSave.Portfolio)
                {
                    StockHoldingsDTO holdings = kvp.Value;
                    if (holdings != null && holdings.Quantity > 0)
                    {
                        var stock = MarketManager.Instance.GetStock(kvp.Key);
                        if (stock != null)
                        {
                            int qty = holdings.Quantity;
                            double avgCost = holdings.AveragePurchasePrice > 0 ? holdings.AveragePurchasePrice : (double)stock.Data.listingPrice;
                            long currentVal = (long)(stock.CurrentPrice * qty);
                            double profitPct = avgCost > 0 ? (((double)stock.CurrentPrice - avgCost) / avgCost) * 100.0 : 0.0;

                            GameObject rowGo = CreateHoldingRow(container, stock.Data.companyName, qty, stock.CurrentPrice, currentVal, profitPct);
                            _spawnedHoldingRows.Add(rowGo);

                            // 종목 행 클릭 시 해당 종목 매매/결제 주문창(UITradePage)으로 즉시 이동
                            Button rowBtn = rowGo.GetComponent<Button>();
                            if (rowBtn != null)
                            {
                                var s = stock;
                                rowBtn.onClick.RemoveAllListeners();
                                rowBtn.onClick.AddListener(() =>
                                {
                                    var appController = GetComponentInParent<StockMarketAppController>();
                                    if (appController == null) appController = UnityEngine.Object.FindFirstObjectByType<StockMarketAppController>();
                                    if (appController != null)
                                    {
                                        appController.OpenPageTrade();
                                    }
                                    var tradePage = UnityEngine.Object.FindFirstObjectByType<UITradePage>();
                                    if (tradePage != null)
                                    {
                                        tradePage.Initialize(s.StockId, false, s.CurrentPrice); // 해당 종목의 주문/결제창 즉시 바인딩!
                                    }
                                });
                            }
                        }
                    }
                }
            }
            if (_spawnedHoldingRows.Count == 0)
            {
                // 보유 주식이 없을 경우 가이드 텍스트 행 표시
                GameObject emptyRow = CreateHoldingRow(container, "보유 주식이 없습니다", 0, 0, 0, 0);
                _spawnedHoldingRows.Add(emptyRow);
            }

            RectTransform containerRect = container as RectTransform;
            if (containerRect != null)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(containerRect);
            }
        }

        private GameObject CreateHoldingRow(Transform parent, string name, int qty, long price, long totalVal, double profitPct)
        {
            GameObject rowObj = new GameObject("SpawnedHoldingRow", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(LayoutElement));
            rowObj.transform.SetParent(parent, false);

            LayoutElement le = rowObj.GetComponent<LayoutElement>();
            le.minHeight = 36f;
            le.preferredHeight = 40f;
            le.flexibleWidth = 1f;

            Image img = rowObj.GetComponent<Image>();
            img.color = new Color(0.96f, 0.92f, 0.85f, 1f);

            GameObject textObj = new GameObject("InfoText", typeof(RectTransform), typeof(CanvasRenderer), typeof(TextMeshProUGUI));
            textObj.transform.SetParent(rowObj.transform, false);

            RectTransform textRect = textObj.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = new Vector2(12, 4);
            textRect.offsetMax = new Vector2(-12, -4);

            TextMeshProUGUI tmp = textObj.GetComponent<TextMeshProUGUI>();
            tmp.color = new Color(0.18f, 0.12f, 0.05f, 1f); // 진한 밤색 선명한 서체 색상 지정 (흰색 묻힘 해결!)

            if (_totalPriceText != null && _totalPriceText.font != null)
            {
                tmp.font = _totalPriceText.font;
            }

            if (qty > 0)
            {
                string sign = profitPct >= 0 ? "+" : "";
                tmp.text = $"<color=#1F140A><b>{name}</b></color>  <size=80%><color=#554433>({qty}주 | {price:N0}G)</color></size>\n<size=85%><color=#332211>평가액: {totalVal:N0}G</color> <color={(profitPct >= 0 ? "#D9534F" : "#2A75C0")}>({sign}{profitPct:F1}%)</color></size>";
            }
            else
            {
                tmp.text = name;
                tmp.alignment = TextAlignmentOptions.Center;
                tmp.color = new Color(0.45f, 0.35f, 0.25f, 1f);
            }
            tmp.fontSize = 15;

            return rowObj;
        }

        private static readonly Color[] SegmentColors = new Color[]
        {
            new Color(0.82f, 0.40f, 0.25f, 1f), // 테라코타 레드
            new Color(0.30f, 0.55f, 0.85f, 1f), // 스카이 블루
            new Color(0.85f, 0.65f, 0.25f, 1f), // 골드 옐로우
            new Color(0.35f, 0.65f, 0.45f, 1f), // 올리브 그린
            new Color(0.60f, 0.40f, 0.70f, 1f), // 바이올렛
            new Color(0.70f, 0.55f, 0.45f, 1f)  // 베이지 브라운 (현금)
        };

        private void RenderGraphAllocation(long cash, long stockValue, long totalWorth)
        {
            if (_graphContainer == null) return;

            // 1. Graph/Content 컨테이너를 가로 분할 HorizontalLayoutGroup으로 자동 설정
            var hlg = _graphContainer.GetComponent<HorizontalLayoutGroup>();
            if (hlg == null) hlg = _graphContainer.gameObject.AddComponent<HorizontalLayoutGroup>();
            hlg.spacing = 4f;
            hlg.childControlWidth = true;
            hlg.childControlHeight = true;
            hlg.childForceExpandWidth = true;
            hlg.childForceExpandHeight = true;
            hlg.padding = new RectOffset(6, 6, 6, 6);

            // 기존 자식 세그먼트 정리
            for (int c = _graphContainer.childCount - 1; c >= 0; c--)
            {
                Destroy(_graphContainer.GetChild(c).gameObject);
            }

            if (totalWorth <= 0) totalWorth = 1;

            var activeSave = WalletManager.Instance?.ActiveSaveData;
            List<(string name, double ratio, Color color)> segments = new List<(string, double, Color)>();

            int colorIdx = 0;
            if (MarketManager.Instance != null && activeSave != null && activeSave.Portfolio != null)
            {
                foreach (var kvp in activeSave.Portfolio)
                {
                    StockHoldingsDTO holdings = kvp.Value;
                    if (holdings != null && holdings.Quantity > 0)
                    {
                        var stock = MarketManager.Instance.GetStock(kvp.Key);
                        if (stock != null)
                        {
                            long val = (long)(stock.CurrentPrice * holdings.Quantity);
                            double ratio = ((double)val / totalWorth) * 100.0;
                            if (ratio > 0.5) // 0.5% 이상 의미 있는 비중만 표시
                            {
                                Color col = SegmentColors[colorIdx % (SegmentColors.Length - 1)];
                                segments.Add((stock.Data.companyName, ratio, col));
                                colorIdx++;
                            }
                        }
                    }
                }
            }

            // 현금 비중 추가
            double cashRatio = ((double)cash / totalWorth) * 100.0;
            if (cashRatio > 0.5)
            {
                segments.Add(("현금", cashRatio, SegmentColors[SegmentColors.Length - 1]));
            }

            // 2. 비율(flexibleWidth)에 따라 세그먼트 칸 동적 생성
            foreach (var seg in segments)
            {
                GameObject segObj = new GameObject($"Seg_{seg.name}", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(LayoutElement));
                segObj.transform.SetParent(_graphContainer, false);

                LayoutElement le = segObj.GetComponent<LayoutElement>();
                le.flexibleWidth = Mathf.Max(1f, (float)seg.ratio); // 비율만큼 가로너비 자동 확장!
                le.flexibleHeight = 1f;

                Image img = segObj.GetComponent<Image>();
                img.color = seg.color;

                GameObject textObj = new GameObject("Label", typeof(RectTransform), typeof(CanvasRenderer), typeof(TextMeshProUGUI));
                textObj.transform.SetParent(segObj.transform, false);

                RectTransform textRect = textObj.GetComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.offsetMin = new Vector2(4, 2);
                textRect.offsetMax = new Vector2(-4, -2);

                TextMeshProUGUI tmp = textObj.GetComponent<TextMeshProUGUI>();
                if (_totalPriceText != null && _totalPriceText.font != null)
                {
                    tmp.font = _totalPriceText.font;
                }
                // 비중이 충분히 큰 경우만 2줄 노출, 소형 칸은 깔끔히 숫자만 또는 빈칸 처리하여 찌그러짐 방지!
                tmp.text = seg.ratio >= 10.0 ? $"{seg.name}\n{seg.ratio:F0}%" : (seg.ratio >= 4.0 ? $"{seg.ratio:F0}%" : "");
                tmp.fontSize = 11;
                tmp.alignment = TextAlignmentOptions.Center;
                tmp.color = Color.white;
                tmp.enableAutoSizing = true;
                tmp.fontSizeMin = 8;
                tmp.fontSizeMax = 12;
            }

            RectTransform containerRect = _graphContainer as RectTransform;
            if (containerRect != null)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(containerRect);
            }
        }
    }
}
