using System;
using System.Collections.Generic;
using System.Globalization;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// MOD_GDD_03 [상점/아이템 시스템] CSV 기반 가구·의상 200종 스탯 대량 로드 및 런타임 조회 엔진.
    /// Resources/Items/ 폴더의 CSV 파일을 파싱하여 아이템 마스터 테이블을 구축하고,
    /// ItemId 또는 카테고리/등급/규모 기준으로 아이템 데이터를 반환하는 API를 제공합니다.
    /// </summary>
    public class ItemMasterTable : Singleton<ItemMasterTable>
    {
        // ──────────────────────────────────────────────────────────
        //  CSV 파일 경로 (Resources 기준 상대경로)
        // ──────────────────────────────────────────────────────────
        private const string FURNITURE_CSV_PATH = "Items/FurnitureMaster";
        private const string APPAREL_CSV_PATH   = "Items/ApparelMaster";

        // ──────────────────────────────────────────────────────────
        //  내부 테이블
        // ──────────────────────────────────────────────────────────
        private readonly Dictionary<string, ItemData> _table = new();
        private bool _isLoaded = false;

        protected override void Awake()
        {
            base.Awake();
            LoadAllItems();
        }

        // ──────────────────────────────────────────────────────────
        //  아이템 데이터 구조체
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 아이템 카테고리 (MOD_GDD_03-2 분류 기준)
        /// </summary>
        public enum ItemCategory
        {
            Furniture,      // 가구 (벽지/바닥/타일/책상/의자/침대/벽장식/장식품/파티션/수납)
            Apparel,        // 의상 (상의/하의/원피스/신발/악세사리/헤어)
            Consumable,     // 소모품 (에너지 드링크, 각성제 등)
        }

        /// <summary>
        /// 가구 규모 (Small/Middle/Big, MOD_GDD_03-2 A절)
        /// </summary>
        public enum FurnitureScale
        {
            None,    // 의상·소모품 등 비가구 아이템
            Small,   // 6~8 그리드 (Lv.1~2)
            Middle,  // 10~15 그리드 (Lv.3~4)
            Big      // 20+ 그리드 (Lv.5)
        }

        /// <summary>
        /// 가구 세부 카테고리 (상점 UI 필터 기준)
        /// </summary>
        public enum FurnitureSubCategory
        {
            None,
            Wallpaper,      // 벽지 (Skin형)
            Floor,          // 바닥 (Skin형)
            Tile,           // 타일 (1x1 Grid)
            Desk,           // 책상
            Chair,          // 의자
            Bed,            // 침대
            WallDecor,      // 벽 장식 (마을 이동 게이트 포함)
            Decor,          // 장식품·러그
            Partition,      // 파티션
            Storage,        // 수납
            Consumable      // 기능성 소모품
        }

        /// <summary>
        /// 설치 방식 (Skin형 vs Grid형)
        /// </summary>
        public enum InstallType
        {
            Skin,   // 원클릭 전체 적용 (벽지, 바닥)
            Grid    // 그리드 배치형
        }

        /// <summary>
        /// 아이템 마스터 데이터 (CSV 1행 = 1개 ItemData).
        /// </summary>
        [Serializable]
        public class ItemData
        {
            // ── 공통 필드 ──
            public string           ItemId       = string.Empty;  // 고유 ID (예: "FURN_DESK_001")
            public string           DisplayName  = string.Empty;  // 상점 표시명
            public ItemCategory     Category;                     // 대분류
            public ItemRarity       Rarity;                       // 희귀도 (N/U/R/E/L)
            public long             Price;                        // 구매 골드

            // ── 가구 전용 필드 ──
            public FurnitureScale       Scale;       // Small / Middle / Big
            public FurnitureSubCategory SubCategory; // 세부 카테고리
            public InstallType          Install;     // Skin / Grid
            public int                  GridW;       // 가로 그리드 (Skin형 = 0)
            public int                  GridH;       // 세로 그리드 (Skin형 = 0)
            public int                  MinLevelReq; // 해금 최소 캐릭터 레벨

            // ── 스탯 효과 필드 ──
            public float BonusAnalysis;    // 분석력 보너스 (0 = 효과 없음)
            public float BonusNegotiation; // 협상력 보너스
            public float BonusManagement;  // 운용력 보너스
            public float BonusResilience;  // 회복력 보너스

            // ── 특수 효과 필드 ──
            public string SpecialEffect = string.Empty; // 비고·특수효과 텍스트 (null 전파 방지)

            // ── 의상 전용 필드 ──
            public AvatarPart ApparelPart;                  // 부위 (가구이면 무시)
            public string     ThemeTag = string.Empty;      // 테마 태그 (null 전파 방지)

            /// <summary>
            /// 테이블 원본 보호를 위한 방어적 복사본을 반환합니다.
            /// 반환된 복사본을 수정해도 내부 테이블에 영향이 없습니다.
            /// </summary>
            public ItemData Clone() => (ItemData)MemberwiseClone();
        }

        // ──────────────────────────────────────────────────────────
        //  CSV 로드 진입점
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// 가구·의상 CSV 마스터 파일을 파싱하여 내부 테이블에 등록합니다.
        /// Awake 시 1회 자동 호출되며, 이후 GetItem() API를 통해 O(1) 조회가 가능합니다.
        /// </summary>
        public void LoadAllItems()
        {
            if (_isLoaded) return;

            _table.Clear();
            LoadCsv(FURNITURE_CSV_PATH);
            LoadCsv(APPAREL_CSV_PATH);

            _isLoaded = true;
            Debug.Log($"[ItemMasterTable] 아이템 마스터 로드 완료: 총 {_table.Count}종 등록됨.");

            EventBus.Publish(new ItemTableLoadedEvent { TotalCount = _table.Count });
        }

        // ──────────────────────────────────────────────────────────
        //  내부 CSV 파서
        // ──────────────────────────────────────────────────────────

        private void LoadCsv(string resourcePath)
        {
            TextAsset csvAsset = Resources.Load<TextAsset>(resourcePath);
            if (csvAsset == null)
            {
                Debug.LogWarning($"[ItemMasterTable] CSV 파일을 찾을 수 없습니다: Resources/{resourcePath}.csv — " +
                                 $"아이템 없이 빈 테이블로 계속 진행합니다.");
                return;
            }

            string[] lines = csvAsset.text.Split('\n');
            if (lines.Length < 2)
            {
                Debug.LogWarning($"[ItemMasterTable] CSV에 데이터 행이 없습니다: {resourcePath}");
                return;
            }

            // 헤더 파싱 (첫 행)
            // NOTE: .Trim()으로 Windows CRLF(\r\n) 저장 파일의 잔여 \r 제거.
            //       미제거 시 마지막 컬럼명이 "ThemeTag\r"가 되어 switch 매칭 실패 → 항상 null.
            string[] headers = SplitCsvLine(lines[0].Trim());
            int parsed = 0, skipped = 0;

            for (int i = 1; i < lines.Length; i++)
            {
                string line = lines[i].Trim();
                if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;

                string[] cols = SplitCsvLine(line);
                if (cols.Length < headers.Length)
                {
                    Debug.LogWarning($"[ItemMasterTable] {resourcePath} 행 {i + 1}: 컬럼 수 불일치 (예상 {headers.Length}, 실제 {cols.Length}) → 스킵");
                    skipped++;
                    continue;
                }

                ItemData item = ParseRow(headers, cols);
                if (item == null || string.IsNullOrEmpty(item.ItemId))
                {
                    skipped++;
                    continue;
                }

                if (_table.ContainsKey(item.ItemId))
                {
                    Debug.LogWarning($"[ItemMasterTable] 중복 ItemId 감지: '{item.ItemId}' → 덮어쓰기");
                }

                _table[item.ItemId] = item;
                parsed++;
            }

            Debug.Log($"[ItemMasterTable] {resourcePath}: 파싱 완료 ({parsed}개 등록, {skipped}개 스킵)");
        }

        private ItemData ParseRow(string[] headers, string[] cols)
        {
            var item = new ItemData();

            // NOTE: try-catch 제거. 모든 파싱은 TryParse 기반으로 예외를 발생시키지 않습니다.
            //       파싱 실패는 기본값 적용 + LogWarning으로 명시적으로 처리합니다.
            // NOTE: float/int/long.TryParse에 InvariantCulture 명시.
            //       미명시 시 한국/독일 등 OS에서 소수점 구분자 혼용으로 스탯 보너스가 모두 0이 됩니다.
            for (int c = 0; c < headers.Length; c++)
            {
                string h = headers[c].Trim();
                string v = cols[c].Trim().Trim('"');

                switch (h)
                {
                    case "ItemId":       item.ItemId      = v; break;
                    case "DisplayName":  item.DisplayName = v; break;
                    case "Category":     item.Category    = ParseEnum<ItemCategory>(v); break;
                    case "Rarity":       item.Rarity      = ParseRarity(v); break;
                    case "Price":
                        if (!long.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out long p))
                            Debug.LogWarning($"[ItemMasterTable] Price 파싱 실패 ('{v}') → 0G 적용");
                        item.Price = p;
                        break;
                    case "Scale":        item.Scale       = ParseEnum<FurnitureScale>(v); break;
                    case "SubCategory":  item.SubCategory = ParseEnum<FurnitureSubCategory>(v); break;
                    case "Install":      item.Install     = ParseEnum<InstallType>(v); break;
                    case "GridW":
                        if (!int.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out int gw))
                            Debug.LogWarning($"[ItemMasterTable] GridW 파싱 실패 ('{v}') → 0 적용");
                        item.GridW = gw;
                        break;
                    case "GridH":
                        if (!int.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out int gh))
                            Debug.LogWarning($"[ItemMasterTable] GridH 파싱 실패 ('{v}') → 0 적용");
                        item.GridH = gh;
                        break;
                    case "MinLevelReq":
                        item.MinLevelReq = int.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out int ml) ? ml : 1;
                        break;
                    case "BonusAnalysis":
                        if (!float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float ba))
                            Debug.LogWarning($"[ItemMasterTable] BonusAnalysis 파싱 실패 ('{v}') → 0 적용");
                        item.BonusAnalysis = ba;
                        break;
                    case "BonusNegotiation":
                        if (!float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float bn))
                            Debug.LogWarning($"[ItemMasterTable] BonusNegotiation 파싱 실패 ('{v}') → 0 적용");
                        item.BonusNegotiation = bn;
                        break;
                    case "BonusManagement":
                        if (!float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float bm))
                            Debug.LogWarning($"[ItemMasterTable] BonusManagement 파싱 실패 ('{v}') → 0 적용");
                        item.BonusManagement = bm;
                        break;
                    case "BonusResilience":
                        if (!float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float br))
                            Debug.LogWarning($"[ItemMasterTable] BonusResilience 파싱 실패 ('{v}') → 0 적용");
                        item.BonusResilience = br;
                        break;
                    case "SpecialEffect":  item.SpecialEffect = v; break;
                    case "ApparelPart":    item.ApparelPart   = ParseEnum<AvatarPart>(v); break;
                    case "ThemeTag":       item.ThemeTag      = v; break;
                }
            }

            return item;
        }

        // ──────────────────────────────────────────────────────────
        //  공개 조회 API
        // ──────────────────────────────────────────────────────────

        /// <summary>
        /// ItemId로 단일 아이템 데이터를 조회합니다. 존재하지 않으면 null을 반환합니다.
        /// </summary>
        /// <remarks>
        /// 반환값은 테이블 원본의 방어적 복사본(Clone)입니다.
        /// 반환된 객체를 수정해도 내부 테이블 원본에 영향이 없습니다.
        /// </remarks>
        public ItemData GetItem(string itemId)
        {
            if (!_isLoaded) LoadAllItems();
            return _table.TryGetValue(itemId, out var item) ? item.Clone() : null;
        }

        /// <summary>
        /// 특정 카테고리의 모든 아이템 리스트를 반환합니다.
        /// </summary>
        public List<ItemData> GetByCategory(ItemCategory category)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (item.Category == category) result.Add(item);
            return result;
        }

        /// <summary>
        /// 가구 세부 카테고리로 필터링된 아이템 리스트를 반환합니다.
        /// </summary>
        public List<ItemData> GetBySubCategory(FurnitureSubCategory subCategory)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (item.SubCategory == subCategory) result.Add(item);
            return result;
        }

        /// <summary>
        /// 가구 규모(Small/Middle/Big)로 필터링된 아이템 리스트를 반환합니다.
        /// </summary>
        public List<ItemData> GetByScale(FurnitureScale scale)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (item.Scale == scale) result.Add(item);
            return result;
        }

        /// <summary>
        /// 희귀도로 필터링된 아이템 리스트를 반환합니다.
        /// </summary>
        public List<ItemData> GetByRarity(ItemRarity rarity)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (item.Rarity == rarity) result.Add(item);
            return result;
        }

        /// <summary>
        /// 플레이어 레벨 이하의 해금 조건을 충족하는 모든 아이템 리스트를 반환합니다.
        /// </summary>
        public List<ItemData> GetUnlockedItems(int playerLevel)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (item.MinLevelReq <= playerLevel) result.Add(item);
            return result;
        }

        /// <summary>
        /// 테마 태그 문자열로 동일 세트 아이템을 모두 반환합니다. (풀세트 달성 판정용)
        /// </summary>
        public List<ItemData> GetByTheme(string themeTag)
        {
            var result = new List<ItemData>();
            foreach (var item in _table.Values)
                if (!string.IsNullOrEmpty(item.ThemeTag) &&
                    item.ThemeTag.Equals(themeTag, StringComparison.OrdinalIgnoreCase))
                    result.Add(item);
            return result;
        }

        /// <summary>
        /// 전체 아이템 수를 반환합니다. (디버그/통계용)
        /// </summary>
        public int GetTotalCount() => _table.Count;

        // ──────────────────────────────────────────────────────────
        //  유틸리티 파서
        // ──────────────────────────────────────────────────────────

        private static T ParseEnum<T>(string value) where T : struct, Enum
        {
            if (Enum.TryParse<T>(value, ignoreCase: true, out var result)) return result;
            Debug.LogWarning($"[ItemMasterTable] Enum 파싱 실패: '{value}' → {typeof(T).Name} 기본값 적용");
            return default;
        }

        private static ItemRarity ParseRarity(string v)
        {
            // 폴백 시 무증상 방지: 매핑에 없는 값이면 LogWarning으로 CSV 오타를 즉시 발견
            return v.ToUpperInvariant() switch
            {
                "N" or "NORMAL" or "COMMON"  => ItemRarity.Common,
                "U" or "UNCOMMON"            => ItemRarity.Uncommon,
                "R" or "RARE"               => ItemRarity.Rare,
                "E" or "EPIC"               => ItemRarity.Epic,
                "L" or "LEGENDARY"          => ItemRarity.Legendary,
                var unknown                  => LogAndFallback(unknown)
            };

            static ItemRarity LogAndFallback(string unknown)
            {
                Debug.LogWarning($"[ItemMasterTable] ParseRarity: 알 수 없는 희귀도 값 '{unknown}' " +
                                 $"→ Common 폴백. CSV 오타를 확인하세요.");
                return ItemRarity.Common;
            }
        }

        /// <summary>
        /// 쉼표 구분 CSV 행을 쌍따옴표 필드를 고려하여 분리합니다.
        /// </summary>
        private static string[] SplitCsvLine(string line)
        {
            var result = new List<string>();
            bool inQuotes = false;
            var current = new System.Text.StringBuilder();

            foreach (char ch in line)
            {
                if (ch == '"')
                {
                    inQuotes = !inQuotes;
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
        //  런타임 핫 리로드 (에디터 전용)
        // ──────────────────────────────────────────────────────────

#if UNITY_EDITOR
        /// <summary>
        /// [에디터 전용] CSV 파일이 수정되었을 때 런타임 중 데이터를 즉시 재로드합니다.
        /// </summary>
        [ContextMenu("Force Reload Item Table")]
        public void ForceReload()
        {
            _isLoaded = false;
            LoadAllItems();
            Debug.Log("[ItemMasterTable] 에디터 핫 리로드 완료.");
        }
#endif
    }

    // ──────────────────────────────────────────────────────────────
    //  이벤트 구조체
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// 아이템 마스터 테이블이 최초 로드 완료되었을 때 발행됩니다. (UI 상점 초기화 트리거용)
    /// </summary>
    public struct ItemTableLoadedEvent
    {
        public int TotalCount;
    }
}
