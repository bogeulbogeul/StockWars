using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 가비지 컬렉터(GC) 스파이크를 방지하기 위한 고성능 오브젝트 풀링 시스템
    /// 주식 차트의 캔들스틱, 데미지 텍스트, UI 파티클 등에 필수적으로 사용됩니다.
    /// </summary>
    public class PoolManager : Singleton<PoolManager>
    {
        // 키값(이름)으로 큐를 빠르게 찾기 위한 딕셔너리
        private Dictionary<string, Queue<GameObject>> _poolDictionary;
        private Dictionary<string, GameObject> _poolParents; // 하이어라키 정리를 위한 부모 객체들
        private Dictionary<string, GameObject> _poolPrefabs; // 동적 확장을 위한 원본 프리팹 캐싱

        protected override void Awake()
        {
            base.Awake();
            _poolDictionary = new Dictionary<string, Queue<GameObject>>();
            _poolParents = new Dictionary<string, GameObject>();
            _poolPrefabs = new Dictionary<string, GameObject>();
        }

        /// <summary>
        /// 새로운 오브젝트 풀을 생성합니다. (주로 로딩 단계나 매니저 초기화 시 미리 호출)
        /// </summary>
        public void CreatePool(string poolKey, GameObject prefab, int poolSize)
        {
            if (_poolDictionary.ContainsKey(poolKey))
            {
                Debug.LogWarning($"[PoolManager] 풀 '{poolKey}'는 이미 존재합니다.");
                return;
            }

            Queue<GameObject> objectPool = new Queue<GameObject>();

            // 하이어라키 정리를 위해 빈 게임오브젝트를 부모로 생성
            GameObject poolParent = new GameObject($"{poolKey}_Pool");
            poolParent.transform.SetParent(this.transform);
            _poolParents.Add(poolKey, poolParent);
            _poolPrefabs.Add(poolKey, prefab); // 원본 프리팹 캐싱

            for (int i = 0; i < poolSize; i++)
            {
                GameObject obj = Instantiate(prefab, poolParent.transform);
                obj.SetActive(false);
                objectPool.Enqueue(obj);
            }

            _poolDictionary.Add(poolKey, objectPool);
        }

        /// <summary>
        /// 풀에서 오브젝트를 꺼냅니다. (Instantiate 대체)
        /// 풀이 비어있으면 자동으로 1개 새로 생성하여 유연하게 대처합니다.
        /// </summary>
        public GameObject SpawnFromPool(string poolKey, Vector3 position, Quaternion rotation)
        {
            if (!_poolDictionary.ContainsKey(poolKey))
            {
                Debug.LogError($"[PoolManager] 풀 '{poolKey}'가 존재하지 않습니다! 먼저 CreatePool을 호출하세요.");
                return null;
            }

            GameObject objectToSpawn;

            // 풀이 비어있으면 (예측량보다 더 많이 필요해진 경우) 하나 새로 만들어서 지급
            if (_poolDictionary[poolKey].Count == 0)
            {
                Debug.LogWarning($"[PoolManager] '{poolKey}' 풀의 용량이 부족하여 동적으로 추가 생성합니다.");
                
                // 캐싱해 둔 순정 프리팹을 복제하여 지급 (오염된 자식 객체 복제 방지)
                GameObject prefab = _poolPrefabs[poolKey];
                Transform parent = _poolParents[poolKey].transform;
                objectToSpawn = Instantiate(prefab, parent);
            }
            else
            {
                objectToSpawn = _poolDictionary[poolKey].Dequeue();
            }

            objectToSpawn.SetActive(true);
            objectToSpawn.transform.position = position;
            objectToSpawn.transform.rotation = rotation;

            return objectToSpawn;
        }

        /// <summary>
        /// 사용이 끝난 오브젝트를 풀로 반납합니다. (Destroy 대체)
        /// </summary>
        public void ReturnToPool(string poolKey, GameObject obj)
        {
            if (!_poolDictionary.ContainsKey(poolKey))
            {
                Debug.LogWarning($"[PoolManager] 풀 '{poolKey}'가 존재하지 않으므로 반납할 수 없습니다. 객체를 강제 파괴합니다.");
                Destroy(obj);
                return;
            }

            obj.SetActive(false);
            _poolDictionary[poolKey].Enqueue(obj);
        }

        /// <summary>
        /// 특정 풀을 비우고 메모리를 해제합니다. 씬 전환 시 유용합니다.
        /// </summary>
        public void ClearPool(string poolKey)
        {
            if (!_poolDictionary.ContainsKey(poolKey)) return;

            foreach (var o in _poolDictionary[poolKey])
            {
                if (o != null) Destroy(o);
            }
            _poolDictionary[poolKey].Clear();
            _poolDictionary.Remove(poolKey);
            
            if (_poolParents.ContainsKey(poolKey) && _poolParents[poolKey] != null)
            {
                Destroy(_poolParents[poolKey]);
                _poolParents.Remove(poolKey);
            }

            if (_poolPrefabs.ContainsKey(poolKey))
            {
                _poolPrefabs.Remove(poolKey);
            }
        }
    }
}
