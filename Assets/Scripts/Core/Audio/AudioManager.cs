using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05 [씬 기획 및 UI/UX 인터페이스] 전역 오디오 믹서 및 채널링 매니저.
    /// 오디오 믹서의 데시벨(dB) 변환 믹싱, 다채널 SFX 오디오 소스 풀링(AudioSource Pooling),
    /// BGM의 부드러운 크로스페이드(Crossfade), 그리고 사운드 아틀라스 연동을 제공합니다.
    /// </summary>
    public class AudioManager : Singleton<AudioManager>
    {
        [Header("사운드 아틀라스 연동")]
        [SerializeField]
        private UI_SfxAtlas sfxAtlas;

        [Header("오디오 믹서 설정")]
        [SerializeField]
        private AudioMixer audioMixer;
        
        [SerializeField]
        private AudioMixerGroup masterGroup;
        [SerializeField]
        private AudioMixerGroup bgmGroup;
        [SerializeField]
        private AudioMixerGroup uiGroup;
        [SerializeField]
        private AudioMixerGroup sfxGroup;
        [SerializeField]
        private AudioMixerGroup ambientGroup;

        [Header("SFX 풀링 크기")]
        [SerializeField]
        private int sfxPoolSize = 12;

        // BGM 전용 오디오 소스 2개 (부드러운 크로스페이드를 위한 더블 버퍼 아키텍처)
        private AudioSource _bgmSourceActive;
        private AudioSource _bgmSourceFade;
        private Coroutine _bgmCrossfadeCoroutine;

        // Ambient 전용 오디오 소스
        private AudioSource _ambientSource;

        // SFX 오디오 소스 풀
        private List<AudioSource> _sfxSourcePool = new List<AudioSource>();
        private int _sfxPoolIndex = 0;

        // 각 오디오 채널별 현재 볼륨 값 보존 (0.0f ~ 1.0f)
        private readonly Dictionary<AudioChannel, float> _channelVolumes = new Dictionary<AudioChannel, float>();

        protected override void Awake()
        {
            base.Awake();

            // 씬 전이 시 사운드가 파괴되지 않도록 조치
            DontDestroyOnLoad(gameObject);

            InitializeAudioSources();
            InitializeVolumeDefaults();
        }

        /// <summary>
        /// 풀링용 오디오 소스 객체들을 생성하고 믹서 그룹과 바인딩합니다.
        /// </summary>
        private void InitializeAudioSources()
        {
            // 1. BGM 오디오 소스 생성
            _bgmSourceActive = gameObject.AddComponent<AudioSource>();
            _bgmSourceFade = gameObject.AddComponent<AudioSource>();
            ConfigureSource(_bgmSourceActive, bgmGroup, true, true);
            ConfigureSource(_bgmSourceFade, bgmGroup, true, true);

            // 2. Ambient 오디오 소스 생성
            _ambientSource = gameObject.AddComponent<AudioSource>();
            ConfigureSource(_ambientSource, ambientGroup, true, true);

            // 3. SFX 오디오 소스 풀링 생성
            for (int i = 0; i < sfxPoolSize; i++)
            {
                AudioSource sfxSource = gameObject.AddComponent<AudioSource>();
                ConfigureSource(sfxSource, sfxGroup, false, false);
                _sfxSourcePool.Add(sfxSource);
            }
        }

        private void ConfigureSource(AudioSource source, AudioMixerGroup group, bool loop, bool playOnAwake)
        {
            source.outputAudioMixerGroup = group;
            source.loop = loop;
            source.playOnAwake = playOnAwake;
            source.spatialBlend = 0.0f; // UI 및 2D 사운드 위주이므로 100% 2D 설정
        }

        private void InitializeVolumeDefaults()
        {
            _channelVolumes[AudioChannel.Master] = 1.0f;
            _channelVolumes[AudioChannel.BGM] = 0.8f;
            _channelVolumes[AudioChannel.UI] = 0.9f;
            _channelVolumes[AudioChannel.SFX] = 1.0f;
            _channelVolumes[AudioChannel.Ambient] = 0.7f;

            // 기본값 즉시 동적 믹싱 반영
            foreach (AudioChannel channel in System.Enum.GetValues(typeof(AudioChannel)))
            {
                ApplyChannelVolume(channel, _channelVolumes[channel]);
            }
        }

        #region 볼륨 믹싱 및 채널링 코어 연산 (Volume Log Mixing)
        /// <summary>
        /// 오디오 채널의 볼륨을 지정합니다. (0.0f ~ 1.0f)
        /// 유니티 오디오 믹서에 연동되어 정밀한 로그 데시벨(dB) 단위 변환을 보장하며,
        /// 믹서 에셋이 유실되었을 시 개별 AudioSource 볼륨을 조절하는 철저한 Fallback 안전망이 가동됩니다.
        /// </summary>
        public void SetChannelVolume(AudioChannel channel, float volume)
        {
            volume = Mathf.Clamp01(volume);
            _channelVolumes[channel] = volume;
            ApplyChannelVolume(channel, volume);
        }

        /// <summary>
        /// 지정한 채널의 현재 저장된 볼륨 값(0.0 ~ 1.0)을 반환합니다.
        /// </summary>
        public float GetChannelVolume(AudioChannel channel)
        {
            if (_channelVolumes.TryGetValue(channel, out var volume))
            {
                return volume;
            }
            return 1.0f;
        }

        private void ApplyChannelVolume(AudioChannel channel, float volume)
        {
            // 믹서 파라미터 룩업 매칭
            string mixerParamName = GetMixerParameterName(channel);

            // 1. AudioMixer가 주입되어 있을 경우 데시벨(dB) 로그 변환 믹싱 집행
            if (audioMixer != null && !string.IsNullOrEmpty(mixerParamName))
            {
                // 볼륨 0.0f는 -80dB 무음 처리, 그 외에는 20 * log10(vol) 변환
                float dB = volume > 0.0001f ? Mathf.Log10(volume) * 20f : -80f;
                audioMixer.SetFloat(mixerParamName, dB);
            }
            else
            {
                // 2. [Fallback]: 믹서가 없거나 로드 전인 빌드 환경에서는 각 소스 볼륨을 개별 소프트웨어 믹싱 처리
                ApplyFallbackSoftwareMixing(channel, volume);
            }
        }

        private string GetMixerParameterName(AudioChannel channel)
        {
            switch (channel)
            {
                case AudioChannel.Master: return "MasterVol";
                case AudioChannel.BGM: return "BGMVol";
                case AudioChannel.UI: return "UIVol";
                case AudioChannel.SFX: return "SFXVol";
                case AudioChannel.Ambient: return "AmbientVol";
                default: return string.Empty;
            }
        }

        private void ApplyFallbackSoftwareMixing(AudioChannel channel, float volume)
        {
            float masterVol = _channelVolumes.ContainsKey(AudioChannel.Master) ? _channelVolumes[AudioChannel.Master] : 1.0f;

            switch (channel)
            {
                case AudioChannel.Master:
                    // 마스터 볼륨 변경 시 다른 모든 폴백 소스 볼륨에도 전역 곱산 영향 전파
                    _bgmSourceActive.volume = GetChannelVolume(AudioChannel.BGM) * volume;
                    _bgmSourceFade.volume = GetChannelVolume(AudioChannel.BGM) * volume;
                    _ambientSource.volume = GetChannelVolume(AudioChannel.Ambient) * volume;
                    foreach (var sfx in _sfxSourcePool) sfx.volume = GetChannelVolume(AudioChannel.SFX) * volume;
                    break;
                case AudioChannel.BGM:
                    _bgmSourceActive.volume = volume * masterVol;
                    _bgmSourceFade.volume = volume * masterVol;
                    break;
                case AudioChannel.Ambient:
                    _ambientSource.volume = volume * masterVol;
                    break;
                case AudioChannel.SFX:
                case AudioChannel.UI:
                    // SFX와 UI 채널을 통칭하여 오디오 풀 볼륨에 영향 배분
                    float sfxTarget = volume * masterVol;
                    foreach (var sfx in _sfxSourcePool) sfx.volume = sfxTarget;
                    break;
            }
        }
        #endregion

        #region SFX 및 UI 효과음 플레이 로직 (SFX Playback & Pooling)
        /// <summary>
        /// 사운드 아틀라스에서 효과음 리소스를 룩업해, 오디오 풀링에 의거하여 중첩 재생(Multi-channeling)합니다.
        /// </summary>
        public void PlaySFX(SfxType type)
        {
            if (sfxAtlas == null)
            {
                Debug.LogWarning("[AudioManager] 사운드 아틀라스(SfxAtlas)가 지정되지 않았습니다. 효과음 재생 불가.");
                return;
            }

            AudioClip clip = sfxAtlas.GetClip(type);
            if (clip == null) return;

            // 1. 오디오 소스 풀에서 현재 재생 대기 상태인(isPlaying이 아닌) 가용 소스 탐색
            AudioSource targetSource = null;
            for (int i = 0; i < sfxPoolSize; i++)
            {
                // 인덱스 회전 롤링 탐색
                int index = (_sfxPoolIndex + i) % sfxPoolSize;
                if (!_sfxSourcePool[index].isPlaying)
                {
                    targetSource = _sfxSourcePool[index];
                    _sfxPoolIndex = (index + 1) % sfxPoolSize;
                    break;
                }
            }

            // 2. 만약 모든 풀이 연주 중이라면, 현재 회전 지점의 오디오 소스를 강제 재점유하여 레이턴시 극소화
            if (targetSource == null)
            {
                targetSource = _sfxSourcePool[_sfxPoolIndex];
                targetSource.Stop();
                _sfxPoolIndex = (_sfxPoolIndex + 1) % sfxPoolSize;
            }

            // 3. 믹서 폴백 및 믹서 그룹 재정비
            // 클릭음, 호버 등 UI 카테고리는 UI 믹서 그룹으로, 인게임은 SFX 그룹으로 분배 채널링
            if (type.ToString().StartsWith("UI_"))
            {
                targetSource.outputAudioMixerGroup = uiGroup != null ? uiGroup : masterGroup;
            }
            else
            {
                targetSource.outputAudioMixerGroup = sfxGroup != null ? sfxGroup : masterGroup;
            }

            // 4. 즉시 재생
            targetSource.clip = clip;
            targetSource.Play();
        }
        #endregion

        #region BGM 배경음악 재생 및 크로스페이드 (BGM Crossfade Double Buffering)
        /// <summary>
        /// 배경 음악을 지정된 오디오 클립으로 즉시 혹은 부드러운 페이드(Crossfade) 연동을 통해 전환합니다.
        /// </summary>
        public void PlayBGM(AudioClip clip, float fadeDuration = 1.0f)
        {
            if (clip == null)
            {
                StopBGM(fadeDuration);
                return;
            }

            if (_bgmSourceActive.clip == clip && _bgmSourceActive.isPlaying) return;

            if (_bgmCrossfadeCoroutine != null)
            {
                StopCoroutine(_bgmCrossfadeCoroutine);
            }

            _bgmCrossfadeCoroutine = StartCoroutine(CoBgmCrossfade(clip, fadeDuration));
        }

        private IEnumerator CoBgmCrossfade(AudioClip newClip, float duration)
        {
            // 페이드 아웃 타겟의 볼륨 확보
            float targetBgmVol = GetChannelVolume(AudioChannel.BGM) * (audioMixer != null ? 1.0f : GetChannelVolume(AudioChannel.Master));

            if (duration <= 0.01f)
            {
                // 즉시 전환
                _bgmSourceActive.clip = newClip;
                _bgmSourceActive.volume = targetBgmVol;
                _bgmSourceActive.Play();
                _bgmSourceFade.Stop();
                yield break;
            }

            // 크로스페이드 오디오 스왑 준비
            _bgmSourceFade.clip = newClip;
            _bgmSourceFade.volume = 0.0f;
            _bgmSourceFade.Play();

            float elapsed = 0.0f;
            float startActiveVol = _bgmSourceActive.volume;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float progress = elapsed / duration;

                // 선형 볼륨 크로스페이드
                _bgmSourceActive.volume = Mathf.Lerp(startActiveVol, 0.0f, progress);
                _bgmSourceFade.volume = Mathf.Lerp(0.0f, targetBgmVol, progress);
                yield return null;
            }

            _bgmSourceActive.Stop();
            _bgmSourceActive.volume = 0.0f;

            // 액티브와 페이드 오디오 소스 스왑
            AudioSource temp = _bgmSourceActive;
            _bgmSourceActive = _bgmSourceFade;
            _bgmSourceFade = temp;
        }

        /// <summary>
        /// 재생 중인 배경음악을 완전히 끕니다. (지정한 시간만큼 부드럽게 페이드 아웃)
        /// </summary>
        public void StopBGM(float fadeDuration = 1.0f)
        {
            if (_bgmCrossfadeCoroutine != null)
            {
                StopCoroutine(_bgmCrossfadeCoroutine);
            }

            if (fadeDuration <= 0.01f)
            {
                _bgmSourceActive.Stop();
                _bgmSourceFade.Stop();
            }
            else
            {
                _bgmCrossfadeCoroutine = StartCoroutine(CoBgmFadeOut(fadeDuration));
            }
        }

        private IEnumerator CoBgmFadeOut(float duration)
        {
            float elapsed = 0.0f;
            float startVol = _bgmSourceActive.volume;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                _bgmSourceActive.volume = Mathf.Lerp(startVol, 0.0f, elapsed / duration);
                yield return null;
            }

            _bgmSourceActive.Stop();
            _bgmSourceActive.volume = 0.0f;
        }
        #endregion

        #region Ambient 환경음 재생 및 스위칭
        /// <summary>
        /// 장소 앰비언트 사운드(예: 빗소리, 거래소 웅성거림)를 부드러운 페이드 교체식으로 구동합니다.
        /// </summary>
        public void PlayAmbient(AudioClip clip, float fadeDuration = 1.5f)
        {
            if (_ambientSource.clip == clip && _ambientSource.isPlaying) return;
            StartCoroutine(CoAmbientFade(clip, fadeDuration));
        }

        private IEnumerator CoAmbientFade(AudioClip clip, float duration)
        {
            float targetVol = GetChannelVolume(AudioChannel.Ambient) * (audioMixer != null ? 1.0f : GetChannelVolume(AudioChannel.Master));

            if (_ambientSource.isPlaying && duration > 0.01f)
            {
                float elapsedOut = 0.0f;
                float startVol = _ambientSource.volume;
                while (elapsedOut < duration * 0.5f)
                {
                    elapsedOut += Time.deltaTime;
                    _ambientSource.volume = Mathf.Lerp(startVol, 0.0f, elapsedOut / (duration * 0.5f));
                    yield return null;
                }
            }

            _ambientSource.Stop();
            _ambientSource.clip = clip;

            if (clip == null) yield break;

            _ambientSource.Play();

            if (duration > 0.01f)
            {
                float elapsedIn = 0.0f;
                while (elapsedIn < duration * 0.5f)
                {
                    elapsedIn += Time.deltaTime;
                    _ambientSource.volume = Mathf.Lerp(0.0f, targetVol, elapsedIn / (duration * 0.5f));
                    yield return null;
                }
            }
            else
            {
                _ambientSource.volume = targetVol;
            }
        }
        #endregion

        #region 디버그/런타임 에셋 설정 도우미 (에디터 외 환경용)
        /// <summary>
        /// 런타임 단위 테스트 또는 동적 에셋 바인딩을 위해 사운드 아틀라스를 주입합니다.
        /// </summary>
        public void SetSfxAtlas(UI_SfxAtlas atlas)
        {
            sfxAtlas = atlas;
            if (sfxAtlas != null)
            {
                sfxAtlas.InitializeMap();
            }
        }
        #endregion
    }
}
