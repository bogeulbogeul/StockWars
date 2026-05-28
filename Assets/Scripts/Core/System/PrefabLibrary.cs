using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 모든 NPC, 가구, UI 조각들의 인스턴스화를 위한 리소스 로드 및 캐싱 엔진.
    /// 싱글톤으로 작동하며 Resources 폴더 내의 프리팹들을 동적으로 불러오고 수명 주기를 보존합니다.
    /// </summary>
    public class PrefabLibrary : Singleton<PrefabLibrary>
    {
        // 중복 로딩을 피하기 위한 프리팹 캐시
        private readonly Dictionary<string, GameObject> _prefabCache = new Dictionary<string, GameObject>();

        /// <summary>
        /// 지정된 경로의 프리팹을 캐시에서 가져오거나, 없으면 Resources.Load로 로드하여 캐싱합니다.
        /// </summary>
        public GameObject GetPrefab(string path)
        {
            if (string.IsNullOrEmpty(path))
            {
                Debug.LogWarning("[PrefabLibrary] 로드하려는 프리팹 경로가 비어 있습니다.");
                return null;
            }

            if (_prefabCache.TryGetValue(path, out var prefab))
            {
                return prefab;
            }

            GameObject loadedPrefab = Resources.Load<GameObject>(path);
            if (loadedPrefab != null)
            {
                _prefabCache[path] = loadedPrefab;
            }
            else
            {
                Debug.LogError($"[PrefabLibrary] 프리팹을 로드할 수 없습니다. 경로: '{path}'\n(※ 모바일/콘솔 등 타깃 빌드에서는 대소문자를 엄격히 구분하므로 오타를 확인하세요.)");
            }

            return loadedPrefab;
        }

        /// <summary>
        /// 프리팹을 로드하고 씬에 생성(Instantiate)합니다.
        /// </summary>
        public GameObject Spawn(string path, Transform parent = null)
        {
            GameObject prefab = GetPrefab(path);
            if (prefab == null) return null;

            return Instantiate(prefab, parent);
        }

        /// <summary>
        /// 프리팹을 로드 및 생성하고, 지정한 컴포넌트 타입을 반환합니다.
        /// (루트 컴포넌트 탐색 실패 시 하위 자식 오브젝트까지 재탐색하여 안전성을 강화합니다.)
        /// </summary>
        public T Spawn<T>(string path, Transform parent = null) where T : Component
        {
            GameObject go = Spawn(path, parent);
            if (go == null) return null;

            // 1차로 루트 오브젝트에서 컴포넌트 탑색
            T component = go.GetComponent<T>();
            
            // 2차로 하위 자식(Children)까지 안전하게 탐색
            if (component == null)
            {
                component = go.GetComponentInChildren<T>();
            }

            if (component == null)
            {
                Debug.LogError($"[PrefabLibrary] 생성된 객체 '{go.name}' 및 하위 자식들 중에서 컴포넌트 '{typeof(T).Name}'를 찾을 수 없습니다.");
            }
            return component;
        }

        /// <summary>
        /// NPC 프리팹을 로드하고 생성합니다. (경로: Prefabs/Entities/NPCs/{npcId})
        /// </summary>
        public GameObject SpawnNPC(string npcId, Transform parent = null)
        {
            return Spawn($"Prefabs/Entities/NPCs/{npcId}", parent);
        }

        /// <summary>
        /// 가구 프리팹을 로드하고 생성합니다. (경로: Prefabs/Entities/Furniture/{furnitureId})
        /// </summary>
        public GameObject SpawnFurniture(string furnitureId, Transform parent = null)
        {
            return Spawn($"Prefabs/Entities/Furniture/{furnitureId}", parent);
        }

        /// <summary>
        /// UI 프리팹을 로드하고 생성합니다. (경로: Prefabs/UI/{uiName})
        /// </summary>
        public GameObject SpawnUI(string uiName, Transform parent = null)
        {
            return Spawn($"Prefabs/UI/{uiName}", parent);
        }

        /// <summary>
        /// 캐시된 모든 프리팹 정보를 수동으로 비워 메모리를 관리합니다.
        /// (※ 주의: 씬 전환 비동기 로딩 구간처럼 씬 내부 객체가 완전히 파괴된 안전한 타이밍에 호출할 것을 권장합니다.)
        /// </summary>
        public void ClearCache()
        {
            _prefabCache.Clear();
            Resources.UnloadUnusedAssets();
            Debug.Log("[PrefabLibrary] 프리팹 캐시가 안전하게 청소되었습니다.");
        }
    }
}
