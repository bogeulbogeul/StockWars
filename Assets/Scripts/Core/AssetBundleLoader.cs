using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_01 비동기 캐싱 번들 및 리소스 로더 (AssetBundleLoader).
    /// 배경 스프라이트, NPC 일러스트, UI 에셋 등을 Resources.LoadAsync 기반으로 비동기 로딩하고 내부 사전에 캐싱합니다.
    /// 동일 리소스 중복 로딩을 100% 차단하며, 리소스가 물리적으로 존재하지 않는 경우를 대비한
    /// 동적 2x2 플레이스홀더 더미 스프라이트 자동 생성(Failsafe) 장치를 마련해 UI 크래시를 원천 방어합니다.
    /// </summary>
    public class AssetBundleLoader : Singleton<AssetBundleLoader>
    {
        // 스프라이트 캐싱 사전
        private readonly Dictionary<string, Sprite> _spriteCache = new Dictionary<string, Sprite>();

        // 일반 오브젝트 캐싱 사전
        private readonly Dictionary<string, UnityEngine.Object> _genericCache = new Dictionary<string, UnityEngine.Object>();

        // 런타임에 동적으로 만들어진 Failsafe용 회색 더미 스프라이트
        private Sprite _failsafeDummySprite;

        protected override void Awake()
        {
            base.Awake();
            InitializeFailsafeDummy();
        }

        #region Core Async Loading APIs (비동기 에셋 로드 인터페이스)

        /// <summary>
        /// 특정 경로의 스프라이트(배경, NPC 일러스트 등)를 비동기로 로드하고 캐시합니다.
        /// 이미 캐싱되어 있다면 즉시 콜백을 반환합니다.
        /// </summary>
        /// <param name="path">Resources 폴더 기준의 상대 경로</param>
        /// <param name="onComplete">로딩이 성공/실패 완료 시 실행할 콜백</param>
        public void LoadSpriteAsync(string path, Action<Sprite> onComplete)
        {
            if (string.IsNullOrEmpty(path))
            {
                Debug.LogWarning("[AssetBundleLoader] 요청된 리소스 경로가 빈 문자열입니다. Failsafe 더미를 공급합니다.");
                onComplete?.Invoke(GetFailsafeSprite());
                return;
            }

            // 1. 캐시 사전 선행 검사
            if (_spriteCache.TryGetValue(path, out var cachedSprite))
            {
                onComplete?.Invoke(cachedSprite);
                return;
            }

            // 2. 비동기 코루틴 구동
            StartCoroutine(CoLoadSprite(path, onComplete));
        }

        /// <summary>
        /// 제네릭 형식의 일반 에셋(Prefab, TextAsset 등)을 비동기 로드하고 캐시합니다.
        /// </summary>
        public void LoadAssetAsync<T>(string path, Action<T> onComplete) where T : UnityEngine.Object
        {
            if (string.IsNullOrEmpty(path))
            {
                Debug.LogWarning("[AssetBundleLoader] 제네릭 로드 경로가 비어 있습니다.");
                onComplete?.Invoke(null);
                return;
            }

            // 캐시 대조
            if (_genericCache.TryGetValue(path, out var cachedAsset) && cachedAsset is T typedAsset)
            {
                onComplete?.Invoke(typedAsset);
                return;
            }

            StartCoroutine(CoLoadGeneric(path, onComplete));
        }

        #endregion

        #region Internals (코루틴 비동기 대기부 및 Failsafe 세팅)

        /// <summary>스프라이트 전용 비동기 로드 처리</summary>
        private IEnumerator CoLoadSprite(string path, Action<Sprite> onComplete)
        {
            ResourceRequest request = Resources.LoadAsync<Sprite>(path);
            yield return request;

            Sprite loaded = request.asset as Sprite;

            if (loaded != null)
            {
                // 성공 시 캐싱
                _spriteCache[path] = loaded;
                onComplete?.Invoke(loaded);
            }
            else
            {
                // 실패 시 경고하고 실시간 동적 Failsafe 더미 주입하여 화면 깨짐 방지
                Debug.LogWarning($"[AssetBundleLoader] 리소스를 찾을 수 없습니다: '{path}'. Failsafe 플레이스홀더를 대체 공급합니다.");
                
                // 더미 캐싱 처리로 중복 로그 폭탄 방어
                _spriteCache[path] = GetFailsafeSprite();
                onComplete?.Invoke(_spriteCache[path]);
            }
        }

        /// <summary>제네릭 에셋 비동기 로드 처리</summary>
        private IEnumerator CoLoadGeneric<T>(string path, Action<T> onComplete) where T : UnityEngine.Object
        {
            ResourceRequest request = Resources.LoadAsync<T>(path);
            yield return request;

            T loaded = request.asset as T;

            if (loaded != null)
            {
                _genericCache[path] = loaded;
                onComplete?.Invoke(loaded);
            }
            else
            {
                Debug.LogError($"[AssetBundleLoader] 제네릭 에셋 비동기 로드 실패: '{path}'");
                onComplete?.Invoke(null);
            }
        }

        /// <summary>
        /// 리소스 유실 시 UI가 하얗게 깨지며 예외 에러를 뱉는 일을 원천 차단하기 위해 2x2 사이즈의 깔끔한 회색 솔리드 스프라이트를 런타임 자동 제조합니다.
        /// </summary>
        private void InitializeFailsafeDummy()
        {
            Texture2D texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            Color placeholderColor = new Color(0.18f, 0.18f, 0.22f, 1f); // 고급스러운 어두운 회색 (Slate Dark)
            
            texture.SetPixel(0, 0, placeholderColor);
            texture.SetPixel(1, 0, placeholderColor);
            texture.SetPixel(0, 1, placeholderColor);
            texture.SetPixel(1, 1, placeholderColor);
            texture.Apply();

            _failsafeDummySprite = Sprite.Create(texture, new Rect(0, 0, 2, 2), new Vector2(0.5f, 0.5f), 100f);
            _failsafeDummySprite.name = "Failsafe_Dummy_Placeholder";
        }

        /// <summary> Failsafe 안전 스프라이트 반환 </summary>
        private Sprite GetFailsafeSprite()
        {
            if (_failsafeDummySprite == null)
            {
                InitializeFailsafeDummy();
            }
            return _failsafeDummySprite;
        }

        #endregion

        #region Cache Purge (메모리 정리를 위한 캐시 비우기)

        /// <summary>
        /// 씬 전환 시나 메모리 부족 이벤트 감지 시 로드된 모든 비동기 캐시를 비워 가비지 컬렉션을 돕습니다.
        /// </summary>
        public void ClearCache()
        {
            _spriteCache.Clear();
            _genericCache.Clear();
            Debug.Log("[AssetBundleLoader] 에셋 로더 메모리 캐시 정리가 수행되었습니다.");
        }

        #endregion
    }
}
