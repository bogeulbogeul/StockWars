using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_04 [찌라시 시스템] 알바 성공 시 48종 시나리오 중 확률적 찌라시 1개를 생성·지급하는 엔진.
    ///
    /// 획득 조건 (MOD_GDD_04_SLIM 1.1절):
    ///   - 알바 S등급 → 30% 확률, A등급 → 15%, B등급 → 5%, C등급 → 0%
    ///   - 야간 알바(22:00~02:00 로컬 시간) → 확률 2배
    ///   - [회복력] LV3 보너스 → 추가 +5%
    ///
    /// 데이터 구조 (MOD_GDD_04_SLIM 2절):
    ///   - CSV: Resources/Rumors.csv (StockId, Type, Tier1Text, Tier2Text, Tier3Text)
    ///   - 데모 범위: 3종목 × 2타입 = 6개, 이후 24종목 × 2타입 = 48개로 확장
    ///
    /// 이 클래스는 JobSessionCompletedEvent를 구독하여 자동 발동됩니다.
    /// </summary>
    public class RumorGenerator : Singleton<RumorGenerator>
    {
        // ──────────────────────────────────────────────────────────
        //  CSV 경로
        // ──────────────────────────────────────────────────────────
        private const string RUMOR_CSV_PATH = "Rumors";

        // ──────────────────────────────────────────────────────────
        //  런타임 풀
        // ──────────────────────────────────────────────────────────
        private List<RumorData> _pool = new();
        private bool _isLoaded = false;

        protected override void Awake()
        {
            base.Awake();
            LoadRumorPool();

            // JobSystemController의 세션 완료 이벤트 구독
            EventBus.Subscribe<JobSessionCompletedEvent>(OnJobSessionCompleted);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<JobSessionCompletedEvent>(OnJobSessionCompleted);
        }

        // ──────────────────────────────────────────────────────────
        //  찌라시 데이터 구조체
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 찌라시 정보 타입 (호재/악재)
        /// </summary>
        public enum RumorType { Bullish, Bearish }

        /// <summary>
        /// 찌라시 1개의 전체 데이터 (MOD_GDD_04_SLIM 2.1절 C# 스키마 기준).
        /// </summary>
        [Serializable]
        public class RumorData
        {
            public string    StockId;        // 연동 종목 ID (예: "CloudBerry")
            public RumorType Type;           // Bullish / Bearish
            public string    Tier1Text;      // 비유적·암시적 텍스트
            public string    Tier2Text;      // 섹터·방향 명시 텍스트
            public string    Tier3Text;      // 종목명·시점·근거 완전 명시 텍스트
        }

        /// <summary>
        /// 플레이어 인벤토리에 삽입되는 찌라시 인스턴스.
        /// 열람 여부, 만료 타이머 등 런타임 상태를 포함합니다.
        /// </summary>
        [Serializable]
        public class RumorInstance
        {
            public string    StockId;
            public RumorType Type;
            public string    Tier1Text;
            public string    Tier2Text;
            public string    Tier3Text;
            public DateTime  AcquiredAt;
            public bool      IsViewed;
            public DateTime? FirstViewedAt; // 열람 시각 (null = 미열람)
            public bool      IsMisinformation; // 5% 오보 여부 (분석력 LV5 이후 가시)
        }

        // ──────────────────────────────────────────────────────────
        //  CSV 로드
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// Resources/Rumors.csv를 파싱하여 찌라시 풀을 구성합니다.
        /// Awake 시 1회 자동 호출됩니다.
        /// </summary>
        public void LoadRumorPool()
        {
            if (_isLoaded) return;

            _pool.Clear();
            TextAsset csv = Resources.Load<TextAsset>(RUMOR_CSV_PATH);

            if (csv == null)
            {
                Debug.LogWarning("[RumorGenerator] Resources/Rumors.csv를 찾을 수 없습니다. " +
                                 "하드코딩된 데모 샘플 3종목으로 대체하여 초기화합니다.");
                LoadHardcodedDemoSamples();
                _isLoaded = true;
                Debug.Log($"[RumorGenerator] 데모 샘플 로드 완료: {_pool.Count}개 시나리오.");
                return;
            }

            string[] lines = csv.text.Split('\n');
            int parsed = 0;

            for (int i = 1; i < lines.Length; i++) // 0번 행 = 헤더
            {
                string line = lines[i].Trim();
                if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;

                string[] cols = SplitCsvLine(line);
                if (cols.Length < 5)
                {
                    Debug.LogWarning($"[RumorGenerator] Rumors.csv 행 {i + 1}: 컬럼 수 부족 ({cols.Length}) → 스킵");
                    continue;
                }

                var data = new RumorData
                {
                    StockId   = cols[0].Trim().Trim('"'),
                    Type      = Enum.TryParse<RumorType>(cols[1].Trim(), out var t) ? t : RumorType.Bullish,
                    Tier1Text = cols[2].Trim().Trim('"'),
                    Tier2Text = cols[3].Trim().Trim('"'),
                    Tier3Text = cols[4].Trim().Trim('"'),
                };

                _pool.Add(data);
                parsed++;
            }

            _isLoaded = true;
            Debug.Log($"[RumorGenerator] Rumors.csv 로드 완료: {parsed}개 시나리오 등록됨 (목표 48종).");
        }

        // ──────────────────────────────────────────────────────────
        //  이벤트 핸들러 (알바 완료 → 찌라시 판정)
        // ──────────────────────────────────────────────────────────

        private void OnJobSessionCompleted(JobSessionCompletedEvent e)
        {
            // C등급(RumorChance = 0)은 판정 자체를 생략
            if (e.RumorChance <= 0f) return;

            float finalChance = CalculateFinalRumorChance(e.RumorChance);
            float roll = UnityEngine.Random.value;

            if (roll > finalChance)
            {
                Debug.Log($"[RumorGenerator] 찌라시 미획득 (확률={finalChance:P1}, 주사위={roll:F4})");
                return;
            }

            // 찌라시 1개 생성 및 플레이어 인벤토리 삽입
            RumorInstance instance = GenerateRandomRumor();
            if (instance == null)
            {
                Debug.LogWarning("[RumorGenerator] 풀에 가용 시나리오가 없어 찌라시를 생성할 수 없습니다.");
                return;
            }

            DeliverRumor(instance);

            Debug.Log($"[RumorGenerator] ★ 찌라시 획득! [{instance.StockId} / {instance.Type}] " +
                      $"(확률={finalChance:P1}, 오보={instance.IsMisinformation})");
        }

        // ──────────────────────────────────────────────────────────
        //  확률 연산
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 야간 시간대 보너스 및 [회복력] LV3 보너스를 합산하여 최종 획득 확률을 반환합니다.
        /// </summary>
        private float CalculateFinalRumorChance(float baseChance)
        {
            float chance = baseChance;

            // 야간 알바 보너스 (22:00~02:00 → 확률 2배)
            if (IsNightShift())
            {
                chance *= 2f;
                Debug.Log($"[RumorGenerator] 야간 알바 보너스 적용 → 찌라시 확률 2배 ({baseChance:P1} → {chance:P1})");
            }

            // [회복력] LV3 패시브 +5%
            if (StatCore.Instance != null)
            {
                chance += StatCore.Instance.GetJobRumorFindBonus();
            }

            return Mathf.Clamp01(chance);
        }

        /// <summary>
        /// 현재 로컬 시각이 야간 알바 시간대(22:00~02:00)에 해당하는지 판별합니다.
        /// </summary>
        private bool IsNightShift()
        {
            int hour = DateTime.Now.Hour;
            return hour >= 22 || hour < 2;
        }

        // ──────────────────────────────────────────────────────────
        //  시나리오 무작위 선택
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 풀에서 찌라시 시나리오 1개를 무작위로 선택하여 RumorInstance를 생성합니다.
        /// 오보 여부(5%)와 획득 시각을 이 시점에 확정합니다.
        /// </summary>
        public RumorInstance GenerateRandomRumor()
        {
            if (_pool.Count == 0) return null;

            RumorData data = _pool[UnityEngine.Random.Range(0, _pool.Count)];

            // 5% 오보 판정 (ReliabilitySystem, MOD_GDD_04_SLIM 1.4절)
            bool isMisinformation = UnityEngine.Random.value < 0.05f;

            return new RumorInstance
            {
                StockId           = data.StockId,
                Type              = data.Type,
                Tier1Text         = data.Tier1Text,
                Tier2Text         = data.Tier2Text,
                Tier3Text         = data.Tier3Text,
                AcquiredAt        = DateTime.Now,
                IsViewed          = false,
                FirstViewedAt     = null,
                IsMisinformation  = isMisinformation,
            };
        }

        // ──────────────────────────────────────────────────────────
        //  인벤토리 삽입 및 이벤트 발행
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 생성된 찌라시를 플레이어 세이브 데이터(인벤토리)에 삽입하고 전역 이벤트를 발행합니다.
        /// </summary>
        private void DeliverRumor(RumorInstance instance)
        {
            // 세이브 데이터에 삽입 (WalletManager를 통한 DTO 접근)
            if (WalletManager.Instance != null)
            {
                WalletManager.Instance.ActiveSaveData.RumorInventory.Add(instance);
            }

            // 보상 화면 슬라이드 알림 이벤트 발행
            EventBus.Publish(new RumorAcquiredEvent
            {
                StockId          = instance.StockId,
                RumorType        = instance.Type,
                AcquiredAt       = instance.AcquiredAt,
                IsMisinformation = instance.IsMisinformation  // UI에는 분석 LV5 + 보정 전까지 숨김
            });
        }

        // ──────────────────────────────────────────────────────────
        //  분석력 기반 마스킹 조회 API
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 플레이어의 현재 [분석력] 레벨에 따라 마스킹이 적용된 최적 Tier 텍스트를 반환합니다.
        /// (MOD_GDD_04_SLIM 1.3절 마스킹 테이블 기준)
        /// </summary>
        /// <param name="instance">조회할 찌라시 인스턴스</param>
        /// <returns>플레이어가 실제로 볼 수 있는 텍스트 (InsightMaskingEngine 연동 전 임시 Tier 분기)</returns>
        public string GetMaskedText(RumorInstance instance)
        {
            if (StatCore.Instance == null) return MaskAll(instance.Tier1Text);

            int analysisLv = StatCore.Instance.GetBaseStat(StatType.Analysis);

            // Tier3: 완전 해독 (LV 4 이상이면 전체 열람, LV 5는 오보 포함 표시)
            if (analysisLv >= 4) return instance.Tier3Text;
            // Tier2: 섹터/방향 추론 가능 (LV 2~3)
            if (analysisLv >= 2) return instance.Tier2Text;
            // Tier1: 비유적 힌트만 (LV 0~1)
            return instance.Tier1Text;
        }

        /// <summary>
        /// Tier 1 텍스트에 80% 가림을 적용하여 사실상 무의미한 텍스트를 반환합니다. (LV 1 이하)
        /// InsightMaskingEngine(186번) 구현 전 임시 플레이스홀더 처리입니다.
        /// </summary>
        private string MaskAll(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            // 단어 단위로 80%를 █ 블록으로 대체
            string[] words = text.Split(' ');
            for (int i = 0; i < words.Length; i++)
            {
                if (UnityEngine.Random.value < 0.8f)
                    words[i] = new string('█', words[i].Length);
            }
            return string.Join(" ", words);
        }

        // ──────────────────────────────────────────────────────────
        //  하드코딩 데모 샘플 (CSV 없을 때 폴백)
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// CSV 파일이 없을 때 MOD_GDD_04_SLIM 3절의 3종목 6개 시나리오를 직접 등록합니다.
        /// 데모 빌드 전용 폴백 데이터입니다.
        /// </summary>
        private void LoadHardcodedDemoSamples()
        {
            // ── 클라우드 베리 (IT 섹터) ──
            _pool.Add(new RumorData
            {
                StockId   = "CloudBerry", Type = RumorType.Bullish,
                Tier1Text = "형씨, 파란색 열매 맺는 나무가 조만간 하늘 뚫는다는데? 나만 믿고 미리 타보라니까?",
                Tier2Text = "IT 쪽에서 대박 소식 들려와. 베리 어쩌구가 대공황 급 계약 따냈다는데? 아, 설마 패치워크인가?",
                Tier3Text = "클라우드 베리가 내일 정오에 잭팟 터뜨릴 거야. 공시 뜨자마자 풀매수 때려. 알았지?"
            });
            _pool.Add(new RumorData
            {
                StockId   = "CloudBerry", Type = RumorType.Bearish,
                Tier1Text = "야, 구름 동네에 불났대. 다 타버려서 복구도 안 된다는데? 빨리 도망쳐!",
                Tier2Text = "클라우드 쪽 서버실이 통째로 날아갔어. 베리네 집인지 모모네 집인지 모르겠는데 암튼 박살 났어.",
                Tier3Text = "클라우드 베리 메인 센터에 화재 났어. 고객 데이터 다 날아가서 내일 하한가 직행이야. 당장 팔아!"
            });

            // ── 스타더스트 (엔터 섹터) ──
            _pool.Add(new RumorData
            {
                StockId   = "Stardust", Type = RumorType.Bullish,
                Tier1Text = "별가루(스타더스트) 동네에 대왕 별이 하나 내려앉았어. 이거 뜨면 끝장이지, 응?",
                Tier2Text = "엔터 대장 스타더스트가 그 유명한 월드클래스 가수랑 계약 도장 찍었대. 주가 펌핑 가즈아!",
                Tier3Text = "스타더스트가 오늘 밤에 글로벌 팝스타랑 전속 계약 공시 띄울 거야. 지금 풀매수 때려라."
            });
            _pool.Add(new RumorData
            {
                StockId   = "Stardust", Type = RumorType.Bearish,
                Tier1Text = "별가루 애들 중 하나가 판돈 크게 걸다가 걸렸대. 별이 지는 소리 들리지? 빨리 팔아.",
                Tier2Text = "엔터 쪽 스타더스트 소속 메인 급이 불법 도박 조사받는 중이래. 뉴스 뜨면 바로 상폐 가니까 튀어!",
                Tier3Text = "스타더스트 간판 아이돌 멤버가 카지노에서 걸렸어. 내일 아침 보도 나오니까 무조건 전량 매도해."
            });

            // ── 포레스트 랩 (바이오 섹터) ──
            _pool.Add(new RumorData
            {
                StockId   = "ForestLab", Type = RumorType.Bullish,
                Tier1Text = "숲속 연구실(포레스트)에서 불로초 만들었대. 형 믿지? 이거 뜨면 바로 졸업이야.",
                Tier2Text = "바이오 대장 포레스트 랩이 미국에서 암 고치는 약 승인받았어. 이제 달러로 긁어모은다니까?",
                Tier3Text = "포레스트 랩 신약이 FDA 관문 넘었어. 내일 아침 공시 뜨면 넌 연락도 안 될 거야. 지금 사."
            });
            _pool.Add(new RumorData
            {
                StockId   = "ForestLab", Type = RumorType.Bearish,
                Tier1Text = "숲 동네 약 먹고 사람 죽었대. 연구실 폐쇄되고 난리 났으니까 너도 같이 죽기 싫으면 팔아.",
                Tier2Text = "바이오 쪽 포레스트 랩 임상 환자들이 단체로 위독하대. 시판 중지 각이니까 하한가 가기 전에 던져.",
                Tier3Text = "포레스트 랩 임상 3건에서 치명적인 부작용 발견됐어. 내일 아침 보도 나오니까 무조건 팔아."
            });
        }

        // ──────────────────────────────────────────────────────────
        //  CSV 파서 유틸리티
        // ──────────────────────────────────────────────────────────

        private static string[] SplitCsvLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            var current = new System.Text.StringBuilder();

            foreach (char ch in line)
            {
                if (ch == '"')        { inQuotes = !inQuotes; }
                else if (ch == ',' && !inQuotes) { result.Add(current.ToString()); current.Clear(); }
                else                  { current.Append(ch); }
            }
            result.Add(current.ToString());
            return result.ToArray();
        }

        // ──────────────────────────────────────────────────────────
        //  풀 조회 유틸리티
        // ──────────────────────────────────────────────────────────

        /// <summary>현재 로드된 전체 찌라시 시나리오 수를 반환합니다.</summary>
        public int GetPoolCount() => _pool.Count;

        /// <summary>특정 종목의 찌라시 데이터 목록을 반환합니다. (디버그/UI용)</summary>
        public List<RumorData> GetRumorsForStock(string stockId)
        {
            var result = new List<RumorData>();
            foreach (var d in _pool)
                if (d.StockId.Equals(stockId, StringComparison.OrdinalIgnoreCase))
                    result.Add(d);
            return result;
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  이벤트 구조체
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// 찌라시가 인벤토리에 정상 지급되었을 때 발행됩니다. (UI 슬라이드 알림 및 메일 시스템 트리거용)
    /// </summary>
    public struct RumorAcquiredEvent
    {
        public string    StockId;
        public RumorGenerator.RumorType RumorType;
        public DateTime  AcquiredAt;
        public bool      IsMisinformation; // 분석 LV5 이전 UI에는 표시 금지
    }
}
