using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_04 [찌라시 시스템] 알바 성공 시 144종 시나리오 중 확률적 찌라시 1개를 생성·지급하는 엔진.
    ///
    /// 획득 조건 (MOD_GDD_04_SLIM 1.1절):
    ///   - 알바 S등급 → 30% 확률, A등급 → 15%, B등급 → 5%, C등급 → 0%
    ///   - 야간 알바(22:00~02:00 로컬 시간) → 확률 2배
    ///   - [회복력] LV3 보너스 → 추가 +5%
    ///
    /// 데이터 구조 (MOD_GDD_04_SLIM 2절):
    ///   - CSV: Resources/Rumors.csv (StockId, Type, Tier1Text, Tier2Text, Tier3Text)
    ///   - 현재 규모: 72종목 × 2타입 = 144개 시나리오 (IT/엔터/인프라/바이오/유통/에너지/금융/항공우주)
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

        // Shuffle Bag: 소진 후 재셔플하여 한 사이클 내 중복 없이 순환
        private Queue<int> _drawQueue = new();
        private int _lastDrawnIndex = -1; // 사이클 경계 연속 중복 방지용

        protected override void Awake()
        {
            base.Awake();
            LoadRumorPool();

            // JobSystemController의 세션 완료 및 GameTickEvent 구독
            EventBus.Subscribe<JobSessionCompletedEvent>(OnJobSessionCompleted);
            EventBus.Subscribe<GameTickEvent>(OnGameTick);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<JobSessionCompletedEvent>(OnJobSessionCompleted);
            EventBus.Unsubscribe<GameTickEvent>(OnGameTick);
        }

        // ──────────────────────────────────────────────────────────
        //  찌라시 데이터 구조체
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 찌라시 정보 타입 (호재/악재)
        /// </summary>
        public enum RumorType { Bullish, Bearish }

        /// <summary>
        /// 찌라시 정보 출처 (M199)
        /// </summary>
        public enum RumorSource { Coincidence, Broker, Darknet }

        /// <summary>
        /// 찌라시 1개의 전체 데이터 (MOD_GDD_04_SLIM 2.1절 C# 스키마 기준).
        /// </summary>
        /// <remarks>GC 부담 감소를 위해 struct로 선언. 생성 후 변경 없는 순수 정적 데이터입니다.</remarks>
        [Serializable]
        public struct RumorData
        {
            public string    StockId;        // 연동 종목 ID — MarketManager와 동일한 대문자 포맷 (예: "CLOUDBERRY")
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
            public string    StockId;          // 연동 종목 ID — 항상 대문자 (MarketManager.GetStock() 호환)
            public RumorType Type;
            public string    Tier1Text;
            public string    Tier2Text;
            public string    Tier3Text;
            public string    MaskedTier1Text;  // MaskAll() 결과 고정 캐시 — 생성 시 1회 계산, UI 재호출에도 불변
            public DateTime  AcquiredAt;
            public bool      IsViewed;
            public DateTime? FirstViewedAt; // 열람 시각 (null = 미열람)
            public bool      IsMisinformation; // 5% 오보 여부 (분석력 LV5 이후 가시)
            public bool      IsExpiringSoon;   // 만료 5분 전 플래그
            public RumorSource Source;         // 찌라시 출처 정보
        }

        // ──────────────────────────────────────────────────────────
        //  CSV 로드
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// Resources/Rumors.csv를 파싱하여 찌라시 풀을 구성합니다.
        /// Awake 시 1회 자동 호출됩니다.
        /// </summary>
        private void LoadRumorPool()
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
                RebuildDrawQueue();
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
                    StockId   = cols[0].Trim().Trim('"').ToUpper(), // MarketManager와 대소문자 통일
                    Type      = Enum.TryParse<RumorType>(cols[1].Trim(), out var t) ? t : RumorType.Bullish,
                    Tier1Text = cols[2].Trim().Trim('"'),
                    Tier2Text = cols[3].Trim().Trim('"'),
                    Tier3Text = cols[4].Trim().Trim('"'),
                };

                _pool.Add(data);
                parsed++;
            }

            _isLoaded = true;
            RebuildDrawQueue();
            Debug.Log($"[RumorGenerator] Rumors.csv 로드 완료: {parsed}개 시나리오 등록됨 (목표 48종).");
        }

        // ──────────────────────────────────────────────────────────
        //  이벤트 핸들러 (알바 완료 → 찌라시 판정)
        // ──────────────────────────────────────────────────────────

        private void OnJobSessionCompleted(JobSessionCompletedEvent e)
        {
            // C등급(RumorChance = 0)은 판정 자체를 생략
            float rumorChance = Mathf.Clamp01(e.RumorChance); // 방어적 검증: 발행자의 비정상 값 차단
            if (rumorChance <= 0f) return;

            float finalChance = CalculateFinalRumorChance(rumorChance);
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
        /// 최종 획득 확률을 반환합니다. (중복 연산 방지를 위해 JobResultCalculator에서 계산된 완결된 값을 전적으로 수용합니다.)
        /// </summary>
        private float CalculateFinalRumorChance(float baseChance)
        {
            return Mathf.Clamp01(baseChance);
        }

        /// <summary>
        /// 현재 로컬 시각이 야간 알바 시간대(22:00~02:00)에 해당하는지 판별합니다.
        /// </summary>
        /// <remarks>
        /// 단위 테스트 시 <see cref="NowProvider"/>에 Func를 주입하면 임의 시각으로 재현 가능합니다.
        /// 예) RumorGenerator.NowProvider = () => new DateTime(2026, 1, 1, 23, 0, 0);
        /// </remarks>
        // ReSharper disable once MemberCanBePrivate.Global
        internal static Func<DateTime> NowProvider = null;

        private bool IsNightShift()
        {
            int hour = (NowProvider?.Invoke() ?? DateTime.Now).Hour;
            return hour >= 22 || hour < 2;
        }

        // ──────────────────────────────────────────────────────────
        //  시나리오 무작위 선택
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// Shuffle Bag 방식으로 찌라시 시나리오 1개를 선택하여 RumorInstance를 생성합니다.
        /// 한 사이클 내 중복 없이 전체 풀을 순환하며, 소진 시 자동 재셔플합니다.
        /// 오보 여부(5%)와 획득 시각은 이 시점에 확정됩니다.
        /// </summary>
        public RumorInstance GenerateRandomRumor()
        {
            if (_pool.Count == 0) return null;

            // 큐 소진 시 새 사이클 시작
            if (_drawQueue.Count == 0)
            {
                RebuildDrawQueue();
                Debug.Log($"[RumorGenerator] 찌라시 풀 1사이클 소진 → 재셔플 ({_pool.Count}개)");
            }

            int index = _drawQueue.Dequeue();
            _lastDrawnIndex = index;
            RumorData data = _pool[index];

            // 5% 오보 판정 (ReliabilitySystem, MOD_GDD_04_SLIM 1.4절)
            bool isMisinformation = UnityEngine.Random.value < 0.05f;

            // 찌라시 출처 랜덤 설정 (우연 50%, 브로커 35%, 다크넷 15%)
            float rand = UnityEngine.Random.value;
            RumorSource source = rand < 0.50f ? RumorSource.Coincidence :
                                 (rand < 0.85f ? RumorSource.Broker : RumorSource.Darknet);

            return new RumorInstance
            {
                StockId           = data.StockId,
                Type              = data.Type,
                Tier1Text         = data.Tier1Text,
                Tier2Text         = data.Tier2Text,
                Tier3Text         = data.Tier3Text,
                MaskedTier1Text   = string.Empty, // InsightMaskingEngine 도입으로 고정 캐시 무효화
                AcquiredAt        = DateTime.UtcNow,
                IsViewed          = false,
                FirstViewedAt     = null,
                IsMisinformation  = isMisinformation,
                IsExpiringSoon    = false,
                Source            = source
            };
        }

        /// <summary>
        /// 찌라시를 열람 상태로 변경하고 만료 타이머 기준 시각(UTC)을 기록합니다.
        /// </summary>
        public void ViewRumor(RumorInstance rumor)
        {
            if (rumor == null) return;
            
            if (!rumor.IsViewed)
            {
                rumor.IsViewed = true;
                rumor.FirstViewedAt = DateTime.UtcNow;
                Debug.Log($"[RumorGenerator] 찌라시 열람됨: [{rumor.StockId} / {rumor.Type}], 만료 타이머 시작 (UTC: {rumor.FirstViewedAt})");
            }
        }

        private void OnGameTick(GameTickEvent e)
        {
            UpdateRumorTimers();
        }

        /// <summary>
        /// 인벤토리 내의 모든 찌라시 만료 타이머를 갱신하고, 만료된 찌라시를 삭제합니다. (열람 후 60분)
        /// </summary>
        private void UpdateRumorTimers()
        {
            if (WalletManager.Instance == null) return;

            var inventory = WalletManager.Instance.ActiveSaveData.RumorInventory;
            if (inventory == null || inventory.Count == 0) return;

            DateTime nowUtc = DateTime.UtcNow;

            for (int i = inventory.Count - 1; i >= 0; i--)
            {
                var rumor = inventory[i];
                if (rumor.IsViewed && rumor.FirstViewedAt.HasValue)
                {
                    double elapsedMinutes = (nowUtc - rumor.FirstViewedAt.Value).TotalMinutes;

                    if (elapsedMinutes >= 60.0)
                    {
                        // 60분 경과: 자동 만료 및 인벤토리 제거
                        inventory.RemoveAt(i);
                        Debug.Log($"[RumorGenerator] 찌라시 만료 자동 삭제: [{rumor.StockId} / {rumor.Type}] (열람 후 {elapsedMinutes:F1}분 경과)");

                        // 만료 전역 이벤트 발행
                        EventBus.Publish(new RumorExpiredEvent
                        {
                            StockId = rumor.StockId,
                            RumorType = rumor.Type
                        });
                    }
                    else if (elapsedMinutes >= 55.0)
                    {
                        // 55분 경과 (만료 5분 전): 붉은 깜빡임 연출 활성화
                        if (!rumor.IsExpiringSoon)
                        {
                            rumor.IsExpiringSoon = true;
                            Debug.Log($"[RumorGenerator] 찌라시 만료 5분 전 돌입 (붉은 깜빡임 활성화): [{rumor.StockId} / {rumor.Type}]");

                            // 깜빡임 돌입 이벤트 발행
                            EventBus.Publish(new RumorExpiringSoonEvent
                            {
                                StockId = rumor.StockId,
                                RumorType = rumor.Type
                            });
                        }
                    }
                }
            }
        }

        /// <summary>
        /// 풀 전체 인덱스를 Fisher-Yates 셔플하여 _drawQueue를 채웁니다.
        /// 사이클 경계에서 이전 마지막 항목이 다음 첫 번째로 나오는 것을 방지합니다.
        /// </summary>
        private void RebuildDrawQueue()
        {
            var indices = Enumerable.Range(0, _pool.Count).ToList();

            // Fisher-Yates 셔플
            for (int i = indices.Count - 1; i > 0; i--)
            {
                int j = UnityEngine.Random.Range(0, i + 1);
                (indices[i], indices[j]) = (indices[j], indices[i]);
            }

            // 사이클 경계 연속 중복 방지: 첫 번째 항목이 이전 마지막과 같으면 두 번째와 스왑
            if (_lastDrawnIndex >= 0 && indices.Count > 1 && indices[0] == _lastDrawnIndex)
            {
                (indices[0], indices[1]) = (indices[1], indices[0]);
            }

            _drawQueue = new Queue<int>(indices);
        }

        // ──────────────────────────────────────────────────────────
        //  인벤토리 삽입 및 이벤트 발행
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 생성된 찌라시를 플레이어 세이브 데이터(인벤토리)에 삽입하고 전역 이벤트를 발행합니다.
        /// </summary>
        private const int MAX_RUMOR_INVENTORY = 20; // GDD 인벤토리 최대 보유량

        private void DeliverRumor(RumorInstance instance)
        {
            // 세이브 데이터에 삽입 (WalletManager를 통한 DTO 접근)
            if (WalletManager.Instance != null)
            {
                var inv = WalletManager.Instance.ActiveSaveData.RumorInventory;
                if (inv.Count >= MAX_RUMOR_INVENTORY)
                {
                    Debug.LogWarning($"[RumorGenerator] 찌라시 인벤토리 상한({MAX_RUMOR_INVENTORY}개) 도달 — 가장 오래된 항목을 제거합니다.");
                    inv.RemoveAt(0);
                }
                inv.Add(instance);

                // M200: 시장 영향력(Drift) 엔진용 24시간 활성 찌라시 등록
                double targetImpact = UnityEngine.Random.Range(0.05f, 0.15f); // 5% ~ 15% 변동 목표
                var marketRumor = new ActiveMarketRumor
                {
                    StockId = instance.StockId,
                    RumorType = instance.Type,
                    AcquiredAtUtc = instance.AcquiredAt,
                    TargetImpactRate = targetImpact,
                    IsMisinformation = instance.IsMisinformation
                };
                WalletManager.Instance.ActiveSaveData.ActiveMarketRumors.Add(marketRumor);
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
        /// 플레이어의 현재 [분석력] 레벨에 따라 마스킹이 적용된 최적 텍스트를 반환합니다.
        /// (MOD_GDD_04_SLIM 1.3절 마스킹 테이블 및 186번 InsightMaskingEngine 연동)
        /// </summary>
        /// <param name="instance">조회할 찌라시 인스턴스</param>
        /// <returns>플레이어가 실제로 볼 수 있는 텍스트</returns>
        public string GetMaskedText(RumorInstance instance)
        {
            if (instance == null) return string.Empty;

            int analysisLv = StatCore.Instance != null ? StatCore.Instance.GetBaseStat(StatType.Analysis) : 1;
            int annaTrust = WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null
                ? WalletManager.Instance.ActiveSaveData.AnnaTrust
                : 0;

            // 시드: 찌라시 획득 시간 기반 (항상 동일한 결과 보장)
            int seed = (int)(instance.AcquiredAt.Ticks % int.MaxValue);

            // Tier3(가장 구체적인 정보)를 원본으로 사용하여 알고리즘 가림 처리 (안나 신뢰도 연동)
            string masked = InsightMaskingEngine.ApplyMasking(instance.Tier3Text, instance.StockId, analysisLv, seed, annaTrust);

            // M216: 복원 연동 이벤트 발행 (안나의 조력이 활성화된 경우만)
            if (annaTrust > 0 && analysisLv < 5)
            {
                float baseRatio = analysisLv switch { 1 => 0.80f, 2 => 0.60f, 3 => 0.40f, 4 => 0.15f, _ => 0.80f };
                float bonus = Mathf.Min((annaTrust / 10) * 0.05f, 0.30f);
                
                EventBus.Publish(new CipherDecryptionCompletedEvent
                {
                    StockId = instance.StockId,
                    AnnaTrust = annaTrust,
                    TargetRatioAfterBonus = Mathf.Max(0f, baseRatio - bonus)
                });
            }

            return masked;
        }

        /// <summary>
        /// 찌라시 출처(RumorSource)의 한글 번역 명칭을 반환합니다. (M199)
        /// </summary>
        public static string GetSourceLocalizedName(RumorSource source)
        {
            return source switch
            {
                RumorSource.Coincidence => "우연한 귀동냥",
                RumorSource.Broker => "정보 브로커",
                RumorSource.Darknet => "다크넷 마켓",
                _ => "알 수 없음"
            };
        }

        /// <summary>
        /// M213: 찌라시 인스턴스의 현재 암시장 거래(판매/구매) 가치를 산출합니다.
        /// 찌라시 출처(희귀도), 연동 종목의 변동성 티어, 만료 시간(번 타이머)에 따라 동적으로 가격이 변동합니다.
        /// </summary>
        public static long GetRumorMarketPrice(RumorInstance instance)
        {
            if (instance == null) return 0;

            // 1. 기본 베이스 가격 책정 (출처 희귀도 비례)
            double basePrice = instance.Source switch
            {
                RumorSource.Coincidence => 1000.0, // 우연: 1,000G
                RumorSource.Broker => 3000.0,      // 브로커: 3,000G
                RumorSource.Darknet => 7000.0,     // 다크넷: 7,000G
                _ => 1000.0
            };

            // 2. 연동 종목 변동성 티어 가중치 적용
            double volatilityMultiplier = 1.0;
            if (MarketManager.Instance != null)
            {
                var stock = MarketManager.Instance.GetStock(instance.StockId);
                if (stock != null)
                {
                    volatilityMultiplier = stock.Data.volatilityTier switch
                    {
                        VolatilityTier.S => 2.0, // S티어: 200% 가치
                        VolatilityTier.A => 1.5, // A티어: 150% 가치
                        VolatilityTier.B => 1.2, // B티어: 120% 가치
                        VolatilityTier.C => 1.0, // C티어: 100% 가치
                        _ => 1.0
                    };
                }
            }

            // 3. 만료 시간에 따른 지수적 가치 감쇄 (번 타이머 반영)
            // 열람한 시점부터 60분간 타이머가 작동하며, 미열람 시에는 100% 가치 유지.
            double decayMultiplier = 1.0;
            if (instance.FirstViewedAt.HasValue)
            {
                double elapsedMinutes = (DateTime.UtcNow - instance.FirstViewedAt.Value).TotalMinutes;
                double remainingMinutes = 60.0 - elapsedMinutes;

                if (remainingMinutes <= 0)
                {
                    decayMultiplier = 0.0; // 완전히 만료된 정보는 가치 0
                }
                else
                {
                    // 남은 시간 비례 지수 감쇄 (남은 시간이 절반(30분)이 되면 가치는 약 25%로 하락)
                    // 공식: (남은시간 / 60)^2
                    decayMultiplier = Math.Pow(remainingMinutes / 60.0, 2.0);
                }
            }

            // 4. 최종 정산
            double finalPrice = basePrice * volatilityMultiplier * decayMultiplier;

            // 정수형 골드 가치로 형변환 및 최소 1G 보장 (만료되지 않았다면)
            long price = (long)Math.Round(finalPrice);
            if (decayMultiplier > 0.0)
            {
                price = Math.Max(1L, price);
            }
            else
            {
                price = 0L;
            }

            return price;
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
                StockId   = "CLOUDBERRY", Type = RumorType.Bullish,
                Tier1Text = "형씨, 파란색 열매 맺는 나무가 조만간 하늘 뚫는다는데? 나만 믿고 미리 타보라니까?",
                Tier2Text = "IT 쪽에서 대박 소식 들려와. 베리 어쩌구가 대공황 급 계약 따냈다는데? 아, 설마 패치워크인가?",
                Tier3Text = "클라우드 베리가 내일 정오에 잭팟 터뜨릴 거야. 공시 뜨자마자 풀매수 때려. 알았지?"
            });
            _pool.Add(new RumorData
            {
                StockId   = "CLOUDBERRY", Type = RumorType.Bearish,
                Tier1Text = "야, 구름 동네에 불났대. 다 타버려서 복구도 안 된다는데? 빨리 도망쳐!",
                Tier2Text = "클라우드 쪽 서버실이 통째로 날아갔어. 베리네 집인지 모모네 집인지 모르겠는데 암튼 박살 났어.",
                Tier3Text = "클라우드 베리 메인 센터에 화재 났어. 고객 데이터 다 날아가서 내일 하한가 직행이야. 당장 팔아!"
            });

            // ── 스타더스트 (엔터 섹터) ──
            _pool.Add(new RumorData
            {
                StockId   = "STARDUST", Type = RumorType.Bullish,
                Tier1Text = "별가루(스타더스트) 동네에 대왕 별이 하나 내려앉았어. 이거 뜨면 끝장이지, 응?",
                Tier2Text = "엔터 대장 스타더스트가 그 유명한 월드클래스 가수랑 계약 도장 찍었대. 주가 펌핑 가즈아!",
                Tier3Text = "스타더스트가 오늘 밤에 글로벌 팝스타랑 전속 계약 공시 띄울 거야. 지금 풀매수 때려라."
            });
            _pool.Add(new RumorData
            {
                StockId   = "STARDUST", Type = RumorType.Bearish,
                Tier1Text = "별가루 애들 중 하나가 판돈 크게 걸다가 걸렸대. 별이 지는 소리 들리지? 빨리 팔아.",
                Tier2Text = "엔터 쪽 스타더스트 소속 메인 급이 불법 도박 조사받는 중이래. 뉴스 뜨면 바로 상폐 가니까 튀어!",
                Tier3Text = "스타더스트 간판 아이돌 멤버가 카지노에서 걸렸어. 내일 아침 보도 나오니까 무조건 전량 매도해."
            });

            // ── 포레스트 랩 (바이오 섹터) ──
            _pool.Add(new RumorData
            {
                StockId   = "FORESTLAB", Type = RumorType.Bullish,
                Tier1Text = "숲속 연구실(포레스트)에서 불로초 만들었대. 형 믿지? 이거 뜨면 바로 졸업이야.",
                Tier2Text = "바이오 대장 포레스트 랩이 미국에서 암 고치는 약 승인받았어. 이제 달러로 긁어모은다니까?",
                Tier3Text = "포레스트 랩 신약이 FDA 관문 넘었어. 내일 아침 공시 뜨면 넌 연락도 안 될 거야. 지금 사."
            });
            _pool.Add(new RumorData
            {
                StockId   = "FORESTLAB", Type = RumorType.Bearish,
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

            for (int i = 0; i < line.Length; i++)
            {
                char ch = line[i];
                if (ch == '"')
                {
                    // RFC 4180: 인용부호 내 연속 "" → 리터럴 큰따옴표 처리 (#2 버그 수정)
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        current.Append('"');
                        i++; // 두 번째 " 건너뛰
                    }
                    else
                    {
                        inQuotes = !inQuotes;
                    }
                }
                else if (ch == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(ch);
                }
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
        public List<RumorData> GetRumorsForStock(string stockId) =>
            _pool.Where(d => d.StockId.Equals(stockId, StringComparison.OrdinalIgnoreCase)).ToList();
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

    /// <summary>
    /// 찌라시가 만료되어 인벤토리에서 삭제될 때 발생합니다.
    /// </summary>
    public struct RumorExpiredEvent
    {
        public string StockId;
        public RumorGenerator.RumorType RumorType;
    }

    /// <summary>
    /// 찌라시가 만료 5분 전(55분 경과)에 도달해 붉은 깜빡임 연출이 필요할 때 발생합니다.
    /// </summary>
    public struct RumorExpiringSoonEvent
    {
        public string StockId;
        public RumorGenerator.RumorType RumorType;
    }

    /// <summary>
    /// M216: 안나의 신뢰도(AnnaTrust) 보너스에 의해 마스킹 단어가 알고리즘적으로 일부 영구 해독되었을 때 발행됩니다.
    /// </summary>
    public struct CipherDecryptionCompletedEvent
    {
        public string StockId;
        public int AnnaTrust;
        public float TargetRatioAfterBonus;
    }
}
