using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// Thread-safe를 지원하는 제네릭 싱글톤 추상 클래스.
    /// Manager 급 클래스들의 중복 생성을 막고 전역 접근성을 제공합니다.
    /// </summary>
    public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
    {
        private static T _instance;
        private static readonly object _lock = new object();
        private static bool _applicationIsQuitting = false;

        public static T Instance
        {
            get
            {
                if (_applicationIsQuitting)
                {
                    Debug.LogWarning($"[Singleton] 인스턴스 '{typeof(T)}' 는 이미 파괴되었습니다. 어플리케이션 종료 중에는 null을 반환합니다.");
                    return null;
                }

                if (_instance == null)
                {
                    lock (_lock)
                    {
                        if (_instance == null)
                        {
                            // 1. 씬에 이미 인스턴스가 있는지 확인
                            _instance = (T)FindAnyObjectByType(typeof(T));

                            // 2. 씬에 없다면 새로 생성
                            if (_instance == null)
                            {
                                GameObject singletonObject = new GameObject();
                                _instance = singletonObject.AddComponent<T>();
                                singletonObject.name = typeof(T).Name + " (Singleton)";
                                
                                // 씬이 전환되어도 매니저가 파괴되지 않도록 설정
                                DontDestroyOnLoad(singletonObject);
                            }
                        }
                    }
                }

                return _instance;
            }
        }

        protected virtual void Awake()
        {
            if (_instance == null)
            {
                _instance = this as T;
                DontDestroyOnLoad(gameObject);
            }
            else if (_instance != this)
            {
                // 이미 인스턴스가 존재하는데 다른 씬에서 중복 생성되려고 하면 파괴
                Destroy(gameObject);
            }
        }

        protected virtual void OnApplicationQuit()
        {
            _applicationIsQuitting = true;
        }

        protected virtual void OnDestroy()
        {
            if (_instance == this)
            {
                _applicationIsQuitting = true;
            }
        }
    }
}
