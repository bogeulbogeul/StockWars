using System;
using System.Collections.Generic;
using UnityEngine;
using StockWars.Core;

namespace StockWars.Town
{
    /// <summary>
    /// 오피스 룸의 레벨별(1~5) 동적 2.5D 아이소메트릭 다이아몬드 그리드를 생성하고,
    /// 가구의 타일 점유, 회전(90도), 배치 유효성 검사 및 영속 저장을 총괄하는 매니저.
    /// </summary>
    public class OfficeGridManager : Singleton<OfficeGridManager>
    {
        [Header("Grid Geometry Settings")]
        [Tooltip("아이소메트릭 타일 가로 폭 (월드 단위)")]
        [SerializeField] private float _tileWidth = 1.0f;
        
        [Tooltip("아이소메트릭 타일 세로 높이 (월드 단위 - 일반적으로 가로 폭의 절반)")]
        [SerializeField] private float _tileHeight = 0.5f;

        [Tooltip("그리드 생성 기준점 (오피스 바닥 중심 오프셋)")]
        [SerializeField] private Vector2 _gridOrigin = Vector2.zero;

        [Header("Tile Visuals & Prefabs")]
        [Tooltip("타일 1칸을 시각화할 프리팹 (SpriteRenderer 또는 LineRenderer 포함)")]
        [SerializeField] private GameObject _tilePrefab;

        [Tooltip("타일 기본 색상 (은은한 골드/나무 테두리)")]
        [SerializeField] private Color _tileNormalColor = new Color(1f, 1f, 1f, 0.25f);

        [Tooltip("배치 가능 시 하이라이트 색상 (초록 계열)")]
        [SerializeField] private Color _tileValidPlacementColor = new Color(0.27f, 0.83f, 0.45f, 0.65f);

        [Tooltip("배치 불가 시 하이라이트 색상 (빨강 계열)")]
        [SerializeField] private Color _tileInvalidPlacementColor = new Color(1f, 0.37f, 0.38f, 0.65f);

        [Header("Containers")]
        [SerializeField] private Transform _tilesContainer;
        [SerializeField] private Transform _wallsContainer;
        [SerializeField] private Transform _furnitureContainer;

        [Header("Modular Wall Settings (대안 B)")]
        [Tooltip("벽면 높이 (월드 단위)")]
        [SerializeField] private float _wallHeight = 1.8f;
        [Tooltip("벽 모듈 기본 색상")]
        [SerializeField] private Color _defaultWallColor = new Color(0.92f, 0.88f, 0.82f, 1f);
        [Tooltip("창문 모듈 기본 색상")]
        [SerializeField] private Color _defaultWindowColor = new Color(0.75f, 0.88f, 0.95f, 0.9f);

        [Header("Camera Adaptive Framing")]
        [SerializeField] private Camera _targetCamera;
        [SerializeField] private float _baseCameraSize = 4.5f;
        [SerializeField] private float _cameraSizePerGridIncrement = 0.5f;

        [Header("Debug & Preview")]
        [SerializeField] private bool _drawGizmos = true;
        [Range(1, 5)]
        [SerializeField] private int _debugGridLevel = 1;

        // 런타임 상태
        private int _currentGridSize = 8; // 8x8 ~ 16x16
        private GameObject[,] _spawnedTileObjects;
        private SpriteRenderer[,] _spawnedTileRenderers;
        private string[,] _gridOccupancy; // null 또는 ItemInstanceId
        private string[] _leftWallOccupancy;  // 좌측 벽면 세그먼트 점유 (크기: _currentGridSize)
        private string[] _rightWallOccupancy; // 우측 벽면 세그먼트 점유 (크기: _currentGridSize)
        private readonly List<GameObject> _spawnedWallObjects = new();

        private readonly Dictionary<string, GameObject> _placedFurnitureObjects = new();

        public int CurrentGridSize => _currentGridSize;
        public float TileWidth => _tileWidth;
        public float TileHeight => _tileHeight;

        protected override void Awake()
        {
            base.Awake();

            if (_tilesContainer == null)
            {
                var go = new GameObject("TilesContainer");
                go.transform.SetParent(transform);
                _tilesContainer = go.transform;
            }

            if (_wallsContainer == null)
            {
                var go = new GameObject("WallsContainer");
                go.transform.SetParent(transform);
                _wallsContainer = go.transform;
            }

            if (_furnitureContainer == null)
            {
                var go = new GameObject("FurnitureContainer");
                go.transform.SetParent(transform);
                _furnitureContainer = go.transform;
            }

            if (_targetCamera == null)
            {
                _targetCamera = Camera.main;
            }

            EventBus.Subscribe<OfficeLevelUpgradedEvent>(OnOfficeLevelUpgraded);
            EventBus.Subscribe<OfficeEditModeChangedEvent>(OnEditModeChanged);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<OfficeLevelUpgradedEvent>(OnOfficeLevelUpgraded);
            EventBus.Unsubscribe<OfficeEditModeChangedEvent>(OnEditModeChanged);
        }

        private void Start()
        {
            RebuildGridFromSaveData();
            LoadAndSpawnPlacedFurniture();
            SetGridVisibility(OfficeEditController.Instance != null && OfficeEditController.Instance.IsEditMode);
        }

        private void OnEditModeChanged(OfficeEditModeChangedEvent e)
        {
            SetGridVisibility(e.IsEditMode);
        }

        /// <summary>
        /// 편집 모드 진입/종료에 따라 바닥 그리드 및 보조 벽체 선의 노출 여부를 토글합니다.
        /// </summary>
        public void SetGridVisibility(bool visible)
        {
            if (_tilesContainer != null)
            {
                _tilesContainer.gameObject.SetActive(visible);
            }
            if (_wallsContainer != null)
            {
                _wallsContainer.gameObject.SetActive(visible);
            }
        }

        /// <summary>
        /// 표준 8x8 오피스 그리드를 구축합니다.
        /// </summary>
        public void RebuildGridFromSaveData()
        {
            _currentGridSize = FIXED_GRID_SIZE;
            GenerateGrid(_currentGridSize);
        }

        public const int FIXED_GRID_SIZE = 8; // 단일 표준 8 x 8 고정 그리드 (총 64칸)

        /// <summary>
        /// 단일 표준 오피스 그리드 크기 (8x8 고정)
        /// </summary>
        public static int GetGridDimension(int level = 1)
        {
            return FIXED_GRID_SIZE;
        }

        /// <summary>
        /// 표준 오피스 가구 최대 배치 한도
        /// </summary>
        public static int GetMaxFurnitureCapacity(int level = 1)
        {
            return 30; // 8x8 공간 내 충분한 데코레이션 한도
        }

        /// <summary>
        /// N x N 규격의 아이소메트릭 다이아몬드 타일 그리드를 생성합니다.
        /// </summary>
        public void GenerateGrid(int size)
        {
            ClearExistingTiles();

            _currentGridSize = size;
            _spawnedTileObjects = new GameObject[size, size];
            _spawnedTileRenderers = new SpriteRenderer[size, size];
            _gridOccupancy = new string[size, size];
            _leftWallOccupancy = new string[size];
            _rightWallOccupancy = new string[size];

            // 그리드 중심을 (0, 0) 기준으로 자동 보정하기 위한 센터 오프셋 계산
            float halfN = (size - 1) * 0.5f;

            for (int x = 0; x < size; x++)
            {
                for (int y = 0; y < size; y++)
                {
                    Vector3 worldPos = GridToWorldPosition(x, y, halfN);

                    GameObject tileGo;
                    if (_tilePrefab != null)
                    {
                        tileGo = Instantiate(_tilePrefab, worldPos, Quaternion.identity, _tilesContainer);
                    }
                    else
                    {
                        // 프리팹 미할당 시 프로그래밍 방식 기본 다이아몬드 타일 스프라이트 생성
                        tileGo = CreateDefaultTileGameObject(x, y, worldPos);
                    }

                    tileGo.name = $"Tile_{x}_{y}";
                    _spawnedTileObjects[x, y] = tileGo;

                    var sr = tileGo.GetComponentInChildren<SpriteRenderer>();
                    if (sr != null)
                    {
                        sr.color = _tileNormalColor;
                        sr.sortingOrder = -100 + (x + y); // 바닥 타일은 항상 가구 아래에 렌더링
                        _spawnedTileRenderers[x, y] = sr;
                    }
                }
            }

            // 모듈형 벽체(대안 B) 자동 증축 및 카메라 적응형 프레이밍
            GenerateModularWalls(size);
            UpdateCameraFraming(size);

            Debug.Log($"<color=#00FF7F>[OfficeGridManager] 오피스 {size}x{size} (총 {size * size}칸) 모듈형 타일 & 벽체 생성 완료!</color>");
        }

        /// <summary>
        /// 그리드 좌표 (gx, gy)를 아이소메트릭 2.5D 월드 좌표로 변환합니다.
        /// </summary>
        public Vector3 GridToWorldPosition(int gx, int gy, float centerOffset = -1f)
        {
            if (centerOffset < 0f) centerOffset = (_currentGridSize - 1) * 0.5f;

            float cx = gx - centerOffset;
            float cy = gy - centerOffset;

            float wx = _gridOrigin.x + (cx - cy) * (_tileWidth * 0.5f);
            float wy = _gridOrigin.y + (cx + cy) * (_tileHeight * 0.5f);
            float wz = (gx + gy) * 0.001f; // 미세 깊이 보정

            return new Vector3(wx, wy, wz);
        }

        /// <summary>
        /// 마우스/월드 좌표를 최근접 그리드 좌표 (gx, gy)로 역산 변환합니다.
        /// </summary>
        public bool WorldToGridPosition(Vector3 worldPos, out int gridX, out int gridY)
        {
            float centerOffset = (_currentGridSize - 1) * 0.5f;

            float dx = worldPos.x - _gridOrigin.x;
            float dy = worldPos.y - _gridOrigin.y;

            float halfW = _tileWidth * 0.5f;
            float halfH = _tileHeight * 0.5f;

            float cx = ((dx / halfW) + (dy / halfH)) * 0.5f;
            float cy = ((dy / halfH) - (dx / halfW)) * 0.5f;

            gridX = Mathf.RoundToInt(cx + centerOffset);
            gridY = Mathf.RoundToInt(cy + centerOffset);

            return IsValidGridCoordinate(gridX, gridY);
        }

        public bool IsValidGridCoordinate(int gx, int gy)
        {
            return gx >= 0 && gx < _currentGridSize && gy >= 0 && gy < _currentGridSize;
        }

        // --------------------------------------------------------
        // 2-1. 벽면 가구(문, 창문, 벽장식) 전용 좌표 및 메타데이터 헬퍼
        // --------------------------------------------------------

        /// <summary>
        /// 해당 아이템이 벽면에 부착되는 아이템(창문, 문, 벽장식 등)인지 판별합니다.
        /// </summary>
        public static bool IsWallItem(string itemId)
        {
            if (string.IsNullOrEmpty(itemId)) return false;

            if (ItemMasterTable.Instance != null)
            {
                var item = ItemMasterTable.Instance.GetItem(itemId);
                if (item != null)
                {
                    if (item.SubCategory == ItemMasterTable.FurnitureSubCategory.WallDecor) return true;
                    if (item.Install == ItemMasterTable.InstallType.Skin && item.SubCategory == ItemMasterTable.FurnitureSubCategory.Wallpaper) return false;
                }
            }

            string upper = itemId.ToUpperInvariant();
            return upper.Contains("WALL") || upper.Contains("WINDOW") || upper.Contains("DOOR") 
                || upper.Contains("FRAME") || upper.Contains("CLOCK") || upper.Contains("POSTER");
        }

        /// <summary>
        /// 벽면 가구 종류별 고정 높이(Elevation Offset)를 반환합니다.
        /// (예: 문은 바닥 0.0, 창문은 1.0~1.2, 시계/액자는 1.3~1.5)
        /// </summary>
        public static float GetWallElevation(string itemId)
        {
            string upper = itemId?.ToUpperInvariant() ?? "";
            if (upper.Contains("DOOR")) return 0.0f;                       // 바닥 밀착 높이
            if (upper.Contains("WINDOW")) return 1.0f;                     // 창문 표준 높이
            if (upper.Contains("CLOCK") || upper.Contains("FRAME") || upper.Contains("POSTER")) return 1.3f; // 벽걸이 장식 높이
            return 1.0f;
        }

        /// <summary>
        /// 좌측(North-West) 또는 우측(North-East) 벽면의 특정 세그먼트 위치와 높이를 2.5D 월드 좌표로 반환합니다.
        /// </summary>
        public Vector3 GetWallWorldPosition(bool isLeftWall, int segmentIndex, float elevation = 0f)
        {
            segmentIndex = Mathf.Clamp(segmentIndex, 0, _currentGridSize - 1);
            float halfN = (_currentGridSize - 1) * 0.5f;

            Vector3 baseTilePos = isLeftWall 
                ? GridToWorldPosition(segmentIndex, _currentGridSize - 1, halfN) 
                : GridToWorldPosition(_currentGridSize - 1, segmentIndex, halfN);

            return baseTilePos + new Vector3(0f, elevation, 0f);
        }

        /// <summary>
        /// 마우스 월드 좌표로부터 가장 가까운 벽면(좌측/우측)과 해당 벽면의 세그먼트 인덱스(0 ~ N-1)를 산출합니다.
        /// </summary>
        public bool WorldToWallPosition(Vector3 worldPos, out bool isLeftWall, out int segmentIndex)
        {
            float halfN = (_currentGridSize - 1) * 0.5f;
            float hw = _tileWidth * 0.5f;

            // X 좌표가 그리드 중심보다 왼쪽이면 좌측 벽, 오른쪽이면 우측 벽으로 자동 판별
            isLeftWall = (worldPos.x <= _gridOrigin.x);

            if (isLeftWall)
            {
                // 좌측 벽: Y = size-1 라인 (X: 0 -> size-1)
                float relX = worldPos.x - _gridOrigin.x;
                float rawSeg = (_currentGridSize - 1) + (relX / hw);
                segmentIndex = Mathf.Clamp(Mathf.RoundToInt(rawSeg), 0, _currentGridSize - 1);
            }
            else
            {
                // 우측 벽: X = size-1 라인 (Y: 0 -> size-1)
                float relX = worldPos.x - _gridOrigin.x;
                float rawSeg = (_currentGridSize - 1) - (relX / hw);
                segmentIndex = Mathf.Clamp(Mathf.RoundToInt(rawSeg), 0, _currentGridSize - 1);
            }

            return true;
        }

        /// <summary>
        /// 지정된 벽면 세그먼트에 벽 가구를 배치할 수 있는지 검사합니다.
        /// </summary>
        public bool CanPlaceWallFurniture(bool isLeftWall, int segmentIndex, string ignoreInstanceId = null)
        {
            if (segmentIndex < 0 || segmentIndex >= _currentGridSize) return false;

            string[] occArray = isLeftWall ? _leftWallOccupancy : _rightWallOccupancy;
            if (occArray == null) return true;

            string occupant = occArray[segmentIndex];
            return string.IsNullOrEmpty(occupant) || occupant == ignoreInstanceId;
        }

        /// <summary>
        /// 벽면 가구(문, 창문 등)를 벽면에 배치하고 영속화합니다.
        /// </summary>
        public bool PlaceWallFurniture(string itemId, bool isLeftWall, int segmentIndex, float elevation = -1f)
        {
            if (!CanPlaceWallFurniture(isLeftWall, segmentIndex))
            {
                Debug.LogWarning($"[OfficeGridManager] 벽면 {(isLeftWall ? "좌측" : "우측")} 세그먼트 {segmentIndex}에 {itemId} 배치 불가!");
                return false;
            }

            if (elevation < 0f) elevation = GetWallElevation(itemId);

            string instanceId = Guid.NewGuid().ToString("N");

            // 벽 점유 등록
            if (isLeftWall && _leftWallOccupancy != null) _leftWallOccupancy[segmentIndex] = instanceId;
            else if (!isLeftWall && _rightWallOccupancy != null) _rightWallOccupancy[segmentIndex] = instanceId;

            // 벽 가구 게임 오브젝트 생성
            SpawnWallFurnitureObject(instanceId, itemId, isLeftWall, segmentIndex, elevation);

            // 세이브 데이터에 저장
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.PlacedFurnitures.Add(new PlacedFurnitureDTO
                {
                    InstanceId = instanceId,
                    ItemId = itemId,
                    GridX = segmentIndex,
                    GridY = isLeftWall ? _currentGridSize - 1 : segmentIndex,
                    RotationIndex = isLeftWall ? 0 : 1,
                    Width = 1,
                    Height = 1,
                    IsWallMounted = true,
                    IsLeftWall = isLeftWall,
                    WallElevation = elevation
                });
            }

            Debug.Log($"<color=#00EAFF>[OfficeGridManager] 벽면 가구 배치 완료: {itemId} at {(isLeftWall ? "LeftWall" : "RightWall")}_{segmentIndex} (높이={elevation:F1}m)</color>");
            return true;
        }

        // --------------------------------------------------------
        // 2-2. 바닥 가구 배치 및 점유 관리
        // --------------------------------------------------------

        /// <summary>
        /// 지정된 위치와 회전 크기에 가구를 배치할 수 있는지 검사합니다.
        /// </summary>
        public bool CanPlaceFurniture(int originX, int originY, int width, int height, string ignoreInstanceId = null)
        {
            for (int dx = 0; dx < width; dx++)
            {
                for (int dy = 0; dy < height; dy++)
                {
                    int gx = originX + dx;
                    int gy = originY + dy;

                    if (!IsValidGridCoordinate(gx, gy)) return false;

                    if (_gridOccupancy != null)
                    {
                        string occupant = _gridOccupancy[gx, gy];
                        if (!string.IsNullOrEmpty(occupant) && occupant != ignoreInstanceId)
                        {
                            return false; // 이미 다른 가구가 점유 중
                        }
                    }
                }
            }
            return true;
        }

        /// <summary>
        /// 가구를 그리드에 배치하고 점유 데이터를 등록 및 세이브 데이터에 영속화합니다.
        /// </summary>
        public bool PlaceFurniture(string itemId, int originX, int originY, int rotationIndex)
        {
            // 만약 벽 아이템이라면 벽면 배치 파이프라인으로 자동 라우팅
            if (IsWallItem(itemId))
            {
                bool isLeft = (rotationIndex % 2 == 0);
                return PlaceWallFurniture(itemId, isLeft, originX);
            }

            GetRotatedDimensions(itemId, rotationIndex, out int w, out int h);

            if (!CanPlaceFurniture(originX, originY, w, h))
            {
                Debug.LogWarning($"[OfficeGridManager] ({originX}, {originY}) 위치에 {itemId} ({w}x{h}) 배치 불가!");
                return false;
            }

            string instanceId = Guid.NewGuid().ToString("N");

            // 점유 맵 갱신
            for (int dx = 0; dx < w; dx++)
            {
                for (int dy = 0; dy < h; dy++)
                {
                    if (_gridOccupancy != null) _gridOccupancy[originX + dx, originY + dy] = instanceId;
                }
            }

            // 가구 오브젝트 스폰
            SpawnFurnitureObject(instanceId, itemId, originX, originY, rotationIndex, w, h);

            // 세이브 데이터에 저장
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.PlacedFurnitures.Add(new PlacedFurnitureDTO
                {
                    InstanceId = instanceId,
                    ItemId = itemId,
                    GridX = originX,
                    GridY = originY,
                    RotationIndex = rotationIndex,
                    Width = w,
                    Height = h,
                    IsWallMounted = false
                });
            }

            Debug.Log($"<color=#00FF7F>[OfficeGridManager] 가구 배치 완료: {itemId} at ({originX},{originY}) 회전={rotationIndex * 90}도 크기={w}x{h}</color>");
            return true;
        }

        /// <summary>
        /// 가구 90도 회전에 따른 실질적 가로/세로 그리드 폭 계산 (1x2 -> 2x1 스왑 지원)
        /// </summary>
        public void GetRotatedDimensions(string itemId, int rotationIndex, out int width, out int height)
        {
            int baseW = 1;
            int baseH = 1;

            if (ItemMasterTable.Instance != null)
            {
                var item = ItemMasterTable.Instance.GetItem(itemId);
                if (item != null && item.Install == ItemMasterTable.InstallType.Grid)
                {
                    baseW = Mathf.Max(1, item.GridW);
                    baseH = Mathf.Max(1, item.GridH);
                }
            }

            // 90도(1) 또는 270도(3) 회전 시 가로세로 스왑
            if (rotationIndex % 2 == 1)
            {
                width = baseH;
                height = baseW;
            }
            else
            {
                width = baseW;
                height = baseH;
            }
        }

        /// <summary>
        /// 배치된 가구를 오피스에서 수거(인벤토리로 회수)합니다.
        /// </summary>
        public bool RemoveFurniture(string instanceId)
        {
            if (string.IsNullOrEmpty(instanceId)) return false;

            // 1. 바닥 점유 맵 해제
            if (_gridOccupancy != null)
            {
                for (int x = 0; x < _currentGridSize; x++)
                {
                    for (int y = 0; y < _currentGridSize; y++)
                    {
                        if (_gridOccupancy[x, y] == instanceId) _gridOccupancy[x, y] = null;
                    }
                }
            }

            // 2. 벽면 점유 맵 해제
            if (_leftWallOccupancy != null)
            {
                for (int i = 0; i < _leftWallOccupancy.Length; i++)
                {
                    if (_leftWallOccupancy[i] == instanceId) _leftWallOccupancy[i] = null;
                }
            }
            if (_rightWallOccupancy != null)
            {
                for (int i = 0; i < _rightWallOccupancy.Length; i++)
                {
                    if (_rightWallOccupancy[i] == instanceId) _rightWallOccupancy[i] = null;
                }
            }

            // 3. 게임 오브젝트 제거
            if (_placedFurnitureObjects.TryGetValue(instanceId, out var go))
            {
                Destroy(go);
                _placedFurnitureObjects.Remove(instanceId);
            }

            // 4. 세이브 데이터에서 제거
            if (WalletManager.Instance != null && WalletManager.Instance.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.PlacedFurnitures.RemoveAll(f => f.InstanceId == instanceId);
            }

            Debug.Log($"[OfficeGridManager] 가구 수거 완료: {instanceId}");
            return true;
        }

        /// <summary>
        /// 세이브 데이터를 기반으로 오피스에 배치되어 있던 가구들을 일괄 로드하여 렌더링합니다.
        /// </summary>
        private void LoadAndSpawnPlacedFurniture()
        {
            ClearExistingFurniture();

            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null) return;

            var placedList = WalletManager.Instance.ActiveSaveData.PlacedFurnitures;
            if (placedList == null || placedList.Count == 0) return;

            foreach (var dto in placedList)
            {
                if (dto.IsWallMounted || IsWallItem(dto.ItemId))
                {
                    float elevation = dto.WallElevation > 0f ? dto.WallElevation : GetWallElevation(dto.ItemId);
                    if (_leftWallOccupancy != null && dto.IsLeftWall && dto.GridX >= 0 && dto.GridX < _leftWallOccupancy.Length)
                    {
                        _leftWallOccupancy[dto.GridX] = dto.InstanceId;
                    }
                    else if (_rightWallOccupancy != null && !dto.IsLeftWall && dto.GridX >= 0 && dto.GridX < _rightWallOccupancy.Length)
                    {
                        _rightWallOccupancy[dto.GridX] = dto.InstanceId;
                    }

                    SpawnWallFurnitureObject(dto.InstanceId, dto.ItemId, dto.IsLeftWall, dto.GridX, elevation);
                }
                else
                {
                    if (!CanPlaceFurniture(dto.GridX, dto.GridY, dto.Width, dto.Height))
                    {
                        continue;
                    }

                    // 바닥 점유 등록
                    for (int dx = 0; dx < dto.Width; dx++)
                    {
                        for (int dy = 0; dy < dto.Height; dy++)
                        {
                            if (_gridOccupancy != null) _gridOccupancy[dto.GridX + dx, dto.GridY + dy] = dto.InstanceId;
                        }
                    }

                    SpawnFurnitureObject(dto.InstanceId, dto.ItemId, dto.GridX, dto.GridY, dto.RotationIndex, dto.Width, dto.Height);
                }
            }
        }

        /// <summary>
        /// 바닥 가구 게임 오브젝트 생성 및 스프라이트/소팅 설정
        /// </summary>
        private void SpawnFurnitureObject(string instanceId, string itemId, int gx, int gy, int rot, int w, int h)
        {
            Vector3 originPos = GridToWorldPosition(gx, gy);
            Vector3 centerPos = originPos;

            if (w > 1 || h > 1)
            {
                Vector3 endPos = GridToWorldPosition(gx + w - 1, gy + h - 1);
                centerPos = (originPos + endPos) * 0.5f;
            }

            GameObject fGo = new GameObject($"Furniture_{itemId}_{instanceId}");
            fGo.transform.SetParent(_furnitureContainer);
            fGo.transform.position = centerPos;

            SpriteRenderer sr = fGo.AddComponent<SpriteRenderer>();
            sr.sprite = ResolveFurnitureSprite(itemId);

            // 90도(1) 또는 180도(2) 회전 시 스프라이트 좌우 반전 적용
            sr.flipX = (rot == 1 || rot == 2);
            sr.sortingOrder = (gx + gy) * 2; // 아이소메트릭 Y/Depth 소팅

            _placedFurnitureObjects[instanceId] = fGo;
        }

        /// <summary>
        /// 벽면 가구(문, 창문 등) 게임 오브젝트 생성 및 벽면 슬라이딩 레일 정렬
        /// </summary>
        private void SpawnWallFurnitureObject(string instanceId, string itemId, bool isLeftWall, int segmentIndex, float elevation)
        {
            Vector3 worldPos = GetWallWorldPosition(isLeftWall, segmentIndex, elevation);

            GameObject fGo = new GameObject($"WallFurniture_{itemId}_{instanceId}");
            fGo.transform.SetParent(_furnitureContainer);
            fGo.transform.position = worldPos;

            SpriteRenderer sr = fGo.AddComponent<SpriteRenderer>();
            sr.sprite = ResolveFurnitureSprite(itemId);

            // 우측 벽일 경우 좌우 반전하여 벽면 기울기 일치
            sr.flipX = !isLeftWall;
            sr.sortingOrder = -80; // 바닥 가구보다 뒤, 벽 베이스보다는 앞

            _placedFurnitureObjects[instanceId] = fGo;
        }

        /// <summary>
        /// 가구 아이디로부터 스프라이트를 안전하게 로드합니다.
        /// </summary>
        public Sprite ResolveFurnitureSprite(string itemId)
        {
            if (string.IsNullOrEmpty(itemId)) return null;

            Sprite sp = Resources.Load<Sprite>($"Sprites/Furniture/{itemId}");
            if (sp == null) sp = Resources.Load<Sprite>($"Furniture/{itemId}");
            if (sp == null) sp = Resources.Load<Sprite>($"Sprites/Items/{itemId}");
            if (sp == null) sp = Resources.Load<Sprite>($"Items/{itemId}");
            if (sp == null) sp = Resources.Load<Sprite>($"Sprites/Props/{itemId}");
            if (sp == null) sp = Resources.Load<Sprite>(itemId);

            return sp;
        }

        /// <summary>
        /// 마우스 월드 좌표에 배치되어 있는 가구(바닥 또는 벽면)의 InstanceId 및 DTO를 검색합니다.
        /// </summary>
        public bool TryGetFurnitureAtWorldPos(Vector3 worldPos, out string instanceId, out PlacedFurnitureDTO dto)
        {
            instanceId = null;
            dto = null;

            if (WalletManager.Instance?.ActiveSaveData?.PlacedFurnitures == null) return false;

            // 1. 벽면 클릭 검사
            if (WorldToWallPosition(worldPos, out bool isLeftWall, out int segIndex))
            {
                string[] occArray = isLeftWall ? _leftWallOccupancy : _rightWallOccupancy;
                if (occArray != null && segIndex >= 0 && segIndex < occArray.Length)
                {
                    string wallInst = occArray[segIndex];
                    if (!string.IsNullOrEmpty(wallInst))
                    {
                        instanceId = wallInst;
                        dto = WalletManager.Instance.ActiveSaveData.PlacedFurnitures.Find(f => f.InstanceId == wallInst);
                        if (dto != null) return true;
                    }
                }
            }

            // 2. 바닥 그리드 클릭 검사
            if (WorldToGridPosition(worldPos, out int gx, out int gy))
            {
                if (_gridOccupancy != null && IsValidGridCoordinate(gx, gy))
                {
                    string gridInst = _gridOccupancy[gx, gy];
                    if (!string.IsNullOrEmpty(gridInst))
                    {
                        instanceId = gridInst;
                        dto = WalletManager.Instance.ActiveSaveData.PlacedFurnitures.Find(f => f.InstanceId == gridInst);
                        if (dto != null) return true;
                    }
                }
            }

            return false;
        }

        private void OnOfficeLevelUpgraded(OfficeLevelUpgradedEvent e)
        {
            Debug.Log($"<color=#FFD700>[OfficeGridManager] 오피스 업그레이드 이벤트 수신: Lv.{e.NewLevel} ({e.GridSize}x{e.GridSize})</color>");
            RebuildGridFromSaveData();
            LoadAndSpawnPlacedFurniture();
        }

        private void ClearExistingTiles()
        {
            if (_spawnedTileObjects != null)
            {
                foreach (var t in _spawnedTileObjects)
                {
                    if (t != null) Destroy(t);
                }
            }
            _spawnedTileObjects = null;
            _spawnedTileRenderers = null;
        }

        private void ClearExistingFurniture()
        {
            foreach (var kvp in _placedFurnitureObjects)
            {
                if (kvp.Value != null) Destroy(kvp.Value);
            }
            _placedFurnitureObjects.Clear();
        }

        private GameObject CreateDefaultTileGameObject(int x, int y, Vector3 pos)
        {
            GameObject go = new GameObject($"Tile_{x}_{y}");
            go.transform.SetParent(_tilesContainer);
            go.transform.position = pos;

            LineRenderer lr = go.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.positionCount = 5;
            lr.startWidth = 0.02f;
            lr.endWidth = 0.02f;
            lr.material = new Material(Shader.Find("Sprites/Default"));
            lr.startColor = _tileNormalColor;
            lr.endColor = _tileNormalColor;

            float hw = _tileWidth * 0.5f;
            float hh = _tileHeight * 0.5f;

            lr.SetPosition(0, new Vector3(0, hh, 0));   // 북
            lr.SetPosition(1, new Vector3(hw, 0, 0));  // 동
            lr.SetPosition(2, new Vector3(0, -hh, 0));  // 남
            lr.SetPosition(3, new Vector3(-hw, 0, 0)); // 서
            lr.SetPosition(4, new Vector3(0, hh, 0));   // 닫힘

            return go;
        }

        /// <summary>
        /// 레벨별 그리드 크기(N)에 맞춰 북서쪽(Left) 및 북동쪽(Right) 벽체 모듈을 자동 증축(Extrude)합니다.
        /// </summary>
        private void GenerateModularWalls(int size)
        {
            ClearExistingWalls();

            float halfN = (size - 1) * 0.5f;
            float hw = _tileWidth * 0.5f;
            float hh = _tileHeight * 0.5f;

            // 1. 좌측 뒷벽 (Y = size - 1 경계선 따라 0 ~ size-1 까지 N개 세그먼트 생성)
            for (int x = 0; x < size; x++)
            {
                Vector3 tilePos = GridToWorldPosition(x, size - 1, halfN);
                Vector3 wallBasePos = tilePos + new Vector3(-hw * 0.5f, hh * 0.5f, 0f);

                // 짝수 번호는 통유리 창문 모듈, 홀수 번호는 브릭 벽 모듈로 다채롭게 연출
                bool isWindow = (x % 2 == 0);
                GameObject wallSegment = CreateWallSegmentGameObject($"LeftWall_{x}", wallBasePos, isWindow, isLeftWall: true);
                _spawnedWallObjects.Add(wallSegment);
            }

            // 2. 우측 뒷벽 (X = size - 1 경계선 따라 0 ~ size-1 까지 N개 세그먼트 생성)
            for (int y = 0; y < size; y++)
            {
                Vector3 tilePos = GridToWorldPosition(size - 1, y, halfN);
                Vector3 wallBasePos = tilePos + new Vector3(hw * 0.5f, hh * 0.5f, 0f);

                bool isWindow = (y % 3 == 0);
                GameObject wallSegment = CreateWallSegmentGameObject($"RightWall_{y}", wallBasePos, isWindow, isLeftWall: false);
                _spawnedWallObjects.Add(wallSegment);
            }

            // 3. 중앙 최상단 코너 기둥 (Corner Pillar at (size-1, size-1))
            Vector3 cornerTilePos = GridToWorldPosition(size - 1, size - 1, halfN);
            Vector3 cornerPos = cornerTilePos + new Vector3(0f, hh, 0f);
            GameObject cornerPillar = CreateCornerPillarGameObject("CenterCornerPillar", cornerPos);
            _spawnedWallObjects.Add(cornerPillar);
        }

        private GameObject CreateWallSegmentGameObject(string segName, Vector3 basePos, bool isWindow, bool isLeftWall)
        {
            GameObject go = new GameObject(segName);
            go.transform.SetParent(_wallsContainer);
            go.transform.position = basePos;

            LineRenderer lr = go.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.positionCount = 5;
            lr.startWidth = 0.03f;
            lr.endWidth = 0.03f;
            lr.material = new Material(Shader.Find("Sprites/Default"));

            Color segColor = isWindow ? _defaultWindowColor : _defaultWallColor;
            lr.startColor = segColor;
            lr.endColor = segColor;

            float hw = _tileWidth * 0.5f;
            float hh = _tileHeight * 0.5f;
            float dirX = isLeftWall ? hw : -hw;
            float dirY = hh;

            // 벽면 사각형 4꼭지점
            lr.SetPosition(0, Vector3.zero);
            lr.SetPosition(1, new Vector3(dirX, dirY, 0));
            lr.SetPosition(2, new Vector3(dirX, dirY + _wallHeight, 0));
            lr.SetPosition(3, new Vector3(0, _wallHeight, 0));
            lr.SetPosition(4, Vector3.zero);

            return go;
        }

        private GameObject CreateCornerPillarGameObject(string pillarName, Vector3 basePos)
        {
            GameObject go = new GameObject(pillarName);
            go.transform.SetParent(_wallsContainer);
            go.transform.position = basePos;

            LineRenderer lr = go.AddComponent<LineRenderer>();
            lr.useWorldSpace = false;
            lr.positionCount = 2;
            lr.startWidth = 0.04f;
            lr.endWidth = 0.04f;
            lr.material = new Material(Shader.Find("Sprites/Default"));
            lr.startColor = new Color(0.7f, 0.6f, 0.5f, 1f);
            lr.endColor = new Color(0.7f, 0.6f, 0.5f, 1f);

            lr.SetPosition(0, Vector3.zero);
            lr.SetPosition(1, new Vector3(0, _wallHeight + 0.2f, 0));

            return go;
        }

        /// <summary>
        /// 그리드 크기에 맞춰 메인 카메라를 중앙에 맞추고 줌(Orthographic Size)을 자동 보정합니다.
        /// </summary>
        public void UpdateCameraFraming(int size)
        {
            if (_targetCamera == null) _targetCamera = Camera.main;
            if (_targetCamera == null || !_targetCamera.orthographic) return;

            int levelIndex = Mathf.Clamp((size - 8) / 2, 0, 4);
            float targetSize = _baseCameraSize + levelIndex * _cameraSizePerGridIncrement;

            _targetCamera.orthographicSize = targetSize;
            _targetCamera.transform.position = new Vector3(_gridOrigin.x, _gridOrigin.y + (size * 0.1f), -10f);
        }

        /// <summary>
        /// 글로벌 바닥 스킨 적용 (세이브 데이터 및 타일 비주얼 일괄 반영)
        /// </summary>
        public void ApplyFloorSkin(string floorItemId)
        {
            if (WalletManager.Instance?.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.AppliedFloorId = floorItemId;
            }

            // 바닥 스킨별 기본 컬러/틴트 매핑
            Color floorColor = _tileNormalColor;
            if (floorItemId.Contains("OAK")) floorColor = new Color(0.88f, 0.75f, 0.60f, 0.5f);
            else if (floorItemId.Contains("CONCRETE") || floorItemId.Contains("GRAY")) floorColor = new Color(0.65f, 0.65f, 0.65f, 0.5f);
            else if (floorItemId.Contains("MARBLE") || floorItemId.Contains("WHITE")) floorColor = new Color(0.95f, 0.95f, 0.98f, 0.5f);
            else if (floorItemId.Contains("CHECK")) floorColor = new Color(0.85f, 0.80f, 0.90f, 0.5f);

            if (_spawnedTileRenderers != null)
            {
                foreach (var sr in _spawnedTileRenderers)
                {
                    if (sr != null) sr.color = floorColor;
                }
            }
        }

        /// <summary>
        /// 글로벌 벽지 스킨 적용 (세이브 데이터 및 벽 모듈 비주얼 일괄 반영)
        /// </summary>
        public void ApplyWallpaperSkin(string wallpaperItemId)
        {
            if (WalletManager.Instance?.ActiveSaveData != null)
            {
                WalletManager.Instance.ActiveSaveData.AppliedWallpaperId = wallpaperItemId;
            }

            Color wallColor = _defaultWallColor;
            if (wallpaperItemId.Contains("DARK")) wallColor = new Color(0.35f, 0.35f, 0.40f, 1f);
            else if (wallpaperItemId.Contains("REDBRICK")) wallColor = new Color(0.75f, 0.45f, 0.35f, 1f);
            else if (wallpaperItemId.Contains("PIXEL")) wallColor = new Color(0.60f, 0.45f, 0.75f, 1f);

            foreach (var wGo in _spawnedWallObjects)
            {
                if (wGo != null)
                {
                    var lr = wGo.GetComponent<LineRenderer>();
                    if (lr != null && !wGo.name.Contains("Window"))
                    {
                        lr.startColor = wallColor;
                        lr.endColor = wallColor;
                    }
                }
            }
        }

        private void ClearExistingWalls()
        {
            foreach (var w in _spawnedWallObjects)
            {
                if (w != null) Destroy(w);
            }
            _spawnedWallObjects.Clear();
        }

        private void OnDrawGizmos()
        {
            if (!_drawGizmos) return;

            int size = Application.isPlaying ? _currentGridSize : GetGridDimension(_debugGridLevel);
            float halfN = (size - 1) * 0.5f;

            Gizmos.color = new Color(0.8f, 0.7f, 0.5f, 0.4f);

            for (int x = 0; x < size; x++)
            {
                for (int y = 0; y < size; y++)
                {
                    Vector3 center = GridToWorldPosition(x, y, halfN);
                    float hw = _tileWidth * 0.5f;
                    float hh = _tileHeight * 0.5f;

                    Vector3 n = center + new Vector3(0, hh, 0);
                    Vector3 e = center + new Vector3(hw, 0, 0);
                    Vector3 s = center + new Vector3(0, -hh, 0);
                    Vector3 w = center + new Vector3(-hw, 0, 0);

                    Gizmos.DrawLine(n, e);
                    Gizmos.DrawLine(e, s);
                    Gizmos.DrawLine(s, w);
                    Gizmos.DrawLine(w, n);
                }
            }
        }
    }
}
