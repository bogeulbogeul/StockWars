using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;
using System.Collections.Generic;

namespace StockWars.Core
{
    /// <summary>
    /// 씬 진입 시 크로스페이드(Crossfade) 기반 배경음 전환을 전담하는 매니저.
    /// 두 개의 AudioSource를 교차로 사용하여 끊김이나 급격한 음량 변화 없는 부드러운 전환을 보장합니다.
    /// </summary>
    public class BGMController : Singleton<BGMController>
    {
        [System.Serializable]
        public struct SceneBGMMapping
        {
            public string SceneName;
            public AudioClip BGMClip;
        }

        [Header("오디오 소스 구성")]
        private AudioSource _audioSourceA;
        private AudioSource _audioSourceB;
        private AudioSource _activeSource;
        private AudioSource _inactiveSource;

        [Header("씬별 BGM 매핑 목록")]
        [SerializeField]
        private List<SceneBGMMapping> _sceneBgmMap = new List<SceneBGMMapping>();

        [Header("기본 볼륨 설정")]
        [Range(0f, 1f)]
        [SerializeField]
        private float _masterVolume = 1f;

        [Header("기본 페이드아웃/인 전환 시간")]
        [SerializeField]
        private float _defaultFadeDuration = 1.0f;

        private Coroutine _fadeCoroutine;

        public float MasterVolume
        {
            get => _masterVolume;
            set
            {
                _masterVolume = Mathf.Clamp01(value);
                if (_activeSource != null)
                {
                    _activeSource.volume = _masterVolume;
                }
            }
        }

        protected override void Awake()
        {
            // 부모 싱글톤 Awake 실행 (DontDestroyOnLoad 자동 등록 및 중복 제거)
            base.Awake();

            // 중복 인스턴스 파괴가 수행된 경우 조기 리턴
            if (Instance != this) return;

            // 크로스페이드용 AudioSource 2개 동적 부착 및 설정
            _audioSourceA = gameObject.AddComponent<AudioSource>();
            _audioSourceB = gameObject.AddComponent<AudioSource>();

            ConfigureAudioSource(_audioSourceA);
            ConfigureAudioSource(_audioSourceB);

            _activeSource = _audioSourceA;
            _inactiveSource = _audioSourceB;

            // 씬 로드 이벤트 콜백 등록
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void ConfigureAudioSource(AudioSource source)
        {
            source.playOnAwake = false;
            source.loop = true;
            source.volume = 0f;
            source.spatialBlend = 0f; // 2D 사운드 강제
        }

        /// <summary>
        /// 씬 로드 완료 시 호출되는 콜백.
        /// 로드된 씬 이름에 맞게 지정된 BGM이 있는 경우 크로스페이드 방식으로 자동 재생합니다.
        /// </summary>
        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            AudioClip targetClip = GetBGMForScene(scene.name);
            if (targetClip != null)
            {
                PlayBGM(targetClip, _defaultFadeDuration, true);
            }
            else
            {
                // 씬 매핑에 음악이 명시되지 않았다면 서서히 소거(Fade Out)
                FadeOutBGM(_defaultFadeDuration);
            }
        }

        /// <summary>
        /// 특정 씬 이름에 해당하는 AudioClip을 매핑 리스트에서 찾습니다.
        /// </summary>
        private AudioClip GetBGMForScene(string sceneName)
        {
            if (_sceneBgmMap == null) return null;

            foreach (var mapping in _sceneBgmMap)
            {
                if (mapping.SceneName == sceneName)
                {
                    return mapping.BGMClip;
                }
            }
            return null;
        }

        /// <summary>
        /// 새로운 배경음(AudioClip)을 지정된 시간 동안 크로스페이드 방식으로 부드럽게 재생합니다.
        /// </summary>
        /// <param name="newClip">재생할 새로운 음악 클립</param>
        /// <param name="fadeDuration">전환에 소요될 시간 (초)</param>
        /// <param name="loop">반복 재생 여부</param>
        public void PlayBGM(AudioClip newClip, float fadeDuration = 1.0f, bool loop = true)
        {
            if (newClip == null)
            {
                FadeOutBGM(fadeDuration);
                return;
            }

            // 현재 재생 중인 음악과 동일하다면 전환 생략
            if (_activeSource.isPlaying && _activeSource.clip == newClip)
            {
                _activeSource.loop = loop;
                return;
            }

            if (_fadeCoroutine != null)
            {
                StopCoroutine(_fadeCoroutine);
            }

            _fadeCoroutine = StartCoroutine(CrossfadeCoroutine(newClip, fadeDuration, loop));
        }

        /// <summary>
        /// 현재 재생 중인 배경음을 서서히 줄여 멈춥니다.
        /// </summary>
        /// <param name="fadeDuration">페이드아웃 소요 시간 (초)</param>
        public void FadeOutBGM(float fadeDuration = 1.0f)
        {
            if (!_activeSource.isPlaying) return;

            if (_fadeCoroutine != null)
            {
                StopCoroutine(_fadeCoroutine);
            }

            _fadeCoroutine = StartCoroutine(FadeOutCoroutine(fadeDuration));
        }

        /// <summary>
        /// 씬별 BGM 매핑 정보를 동적으로 설정할 수 있도록 지원하는 외부 API입니다.
        /// </summary>
        public void SetSceneBGMMapping(string sceneName, AudioClip clip)
        {
            for (int i = 0; i < _sceneBgmMap.Count; i++)
            {
                if (_sceneBgmMap[i].SceneName == sceneName)
                {
                    var updated = _sceneBgmMap[i];
                    updated.BGMClip = clip;
                    _sceneBgmMap[i] = updated;
                    return;
                }
            }
            _sceneBgmMap.Add(new SceneBGMMapping { SceneName = sceneName, BGMClip = clip });
        }

        private IEnumerator CrossfadeCoroutine(AudioClip nextClip, float duration, bool loop)
        {
            // 비활성 소스에 새 클립 탑재 및 볼륨 초기화 후 재생 시작
            _inactiveSource.clip = nextClip;
            _inactiveSource.loop = loop;
            _inactiveSource.volume = 0f;
            _inactiveSource.Play();

            float elapsed = 0f;
            float startActiveVolume = _activeSource.volume;

            if (duration <= 0f)
            {
                _inactiveSource.volume = _masterVolume;
                _activeSource.volume = 0f;
                _activeSource.Stop();
            }
            else
            {
                while (elapsed < duration)
                {
                    elapsed += Time.unscaledDeltaTime;
                    float normalizedTime = elapsed / duration;

                    // 활성 소스 페이드아웃, 비활성 소스 페이드인
                    _activeSource.volume = Mathf.Lerp(startActiveVolume, 0f, normalizedTime);
                    _inactiveSource.volume = Mathf.Lerp(0f, _masterVolume, normalizedTime);

                    yield return null;
                }

                _inactiveSource.volume = _masterVolume;
                _activeSource.volume = 0f;
                _activeSource.Stop();
            }

            // 활성 및 비활성 소스 참조를 교체하여 크로스페이드 로직 마무리
            AudioSource temp = _activeSource;
            _activeSource = _inactiveSource;
            _inactiveSource = temp;

            _fadeCoroutine = null;
        }

        private IEnumerator FadeOutCoroutine(float duration)
        {
            float elapsed = 0f;
            float startVolume = _activeSource.volume;

            if (duration <= 0f)
            {
                _activeSource.volume = 0f;
                _activeSource.Stop();
            }
            else
            {
                while (elapsed < duration)
                {
                    elapsed += Time.unscaledDeltaTime;
                    _activeSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                    yield return null;
                }

                _activeSource.volume = 0f;
                _activeSource.Stop();
            }

            _fadeCoroutine = null;
        }
    }
}
