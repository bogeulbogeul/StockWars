using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_01: 마우스 조작 상황에 따른 맞춤형 Cozy 마우스 커서 및 클릭 애니메이션 제어 매니저 (CursorManager).
    /// <para>
    /// 기본 화살표 커서 대신, 아늑한 분위기의 '손바닥(Hover)', '돋보기(Inspect)', '주먹(Drag)' 등 상황에 어울리는
    /// 커서로 실시간 변경하며, 스프라이트 배열을 활용하여 은은한 커서 미세 애니메이션도 재생 가능합니다.
    /// </para>
    /// </summary>
    public class CursorManager : Singleton<CursorManager>
    {
        public enum CursorType
        {
            Default,    // 기본 귀여운 화살표
            Inspect,    // 상세 분석 (돋보기)
            Disable     // 잠김/사용 불가
        }

        [Serializable]
        public struct CursorConfig
        {
            public CursorType type;
            [Tooltip("단일 프레임 정적 텍스처 (애니메이션 프레임이 비어 있을 때 사용)")]
            public Texture2D staticTexture;
            [Tooltip("애니메이션 프레임 시퀀스")]
            public Texture2D[] animationFrames;
            [Tooltip("초당 프레임 수 (애니메이션 재생 속도)")]
            public float frameRate;
            [Tooltip("커서 클릭 판정 중심점 (좌상단은 0,0 / 정중앙은 가로세로 절반)")]
            public Vector2 hotspot;
            [Tooltip("애니메이션 무한 루프 여부")]
            public bool loop;
        }

        [Header("Cursor Settings")]
        [SerializeField] private List<CursorConfig> _cursorConfigs = new List<CursorConfig>();

        [Header("Default Fallback Settings")]
        [Tooltip("인스펙터 미설정 시 기본적으로 호버될 손가락 모양 커서 핫스팟")]
        [SerializeField] private Vector2 _defaultHotspot = Vector2.zero;

        [Header("Click Impact Animation Settings")]
        [Tooltip("마우스 좌클릭 시 즉시 재생할 짤막한 1회성 클릭 피드백 프레임 시퀀스 (예: 화살표 찌그러짐, 꼬마 별가루 등)")]
        [SerializeField] private Texture2D[] _clickFrames;
        [Tooltip("클릭 애니메이션의 초당 프레임 재생 속도")]
        [SerializeField] private float _clickFrameRate = 20f;
        [Tooltip("클릭 애니메이션의 핫스팟 중심점")]
        [SerializeField] private Vector2 _clickHotspot = Vector2.zero;

        private Dictionary<CursorType, CursorConfig> _configMap = new Dictionary<CursorType, CursorConfig>();
        private CursorType _currentType = (CursorType)(-1); // 최초 1회 강제 물리 커서 설정을 보장하기 위해 무효값으로 초기화
        private Coroutine _animationCoroutine;
        private Coroutine _clickAnimationCoroutine;
        private int _currentFrameIndex = 0;
        private bool _isClickAnimating = false;

        protected override void Awake()
        {
            base.Awake();
            InitializeConfigMap();
        }

        private void Start()
        {
            ResetToDefault();
        }

        private void Update()
        {
            // 인게임 창 어디서든 좌클릭을 누르는 즉시 물리적 찰떡 반응인 클릭 1회성 애니메이션을 가동
            if (Input.GetMouseButtonDown(0))
            {
                TriggerClickAnimation();
            }
        }

        /// <summary>
        /// 인스펙터 리스트를 빠르게 룩업하기 위한 딕셔너리로 재구성합니다.
        /// </summary>
        private void InitializeConfigMap()
        {
            _configMap.Clear();
            foreach (var config in _cursorConfigs)
            {
                if (!_configMap.ContainsKey(config.type))
                {
                    _configMap.Add(config.type, config);
                }
            }
        }

        /// <summary>
        /// 상황에 맞춰 마우스 커서 타입을 변경합니다.
        /// </summary>
        public void SetCursor(CursorType type)
        {
            if (_currentType == type) return;

            _currentType = type;

            // 만약 현재 클릭 임팩트 애니메이션이 플레이 중인 특수 상황이라면, 
            // 커서 타입 상태 기록만 갱신해 두고 실제 외형 덮어쓰기는 클릭 애니메이션 종료 후 복원 루틴에 위임합니다.
            if (_isClickAnimating) return;

            // 기존 진행 중인 커서 애니메이션 중지
            if (_animationCoroutine != null)
            {
                StopCoroutine(_animationCoroutine);
                _animationCoroutine = null;
            }

            if (!_configMap.TryGetValue(type, out CursorConfig config))
            {
                // 설정되지 않은 타입은 시스템 기본 커서로 복구
                Cursor.SetCursor(null, Vector2.zero, CursorMode.Auto);
                return;
            }

            // 애니메이션 프레임이 있는 경우 코루틴 실행, 없으면 단적 세팅
            if (config.animationFrames != null && config.animationFrames.Length > 0)
            {
                _animationCoroutine = StartCoroutine(Co_AnimateCursor(config));
            }
            else
            {
                Cursor.SetCursor(config.staticTexture, config.hotspot, CursorMode.Auto);
            }
        }

        /// <summary>
        /// 커서를 언제든 기본 디폴트 상태로 되돌립니다.
        /// </summary>
        public void ResetToDefault()
        {
            SetCursor(CursorType.Default);
        }

        /// <summary>
        /// 좌클릭 타격감을 주기 위해 1회성 클릭 피드백 시퀀스를 재생합니다.
        /// </summary>
        public void TriggerClickAnimation()
        {
            if (_clickFrames == null || _clickFrames.Length == 0) return;

            if (_clickAnimationCoroutine != null)
            {
                StopCoroutine(_clickAnimationCoroutine);
            }

            _clickAnimationCoroutine = StartCoroutine(Co_PlayClickAnimation());
        }

        /// <summary>
        /// 클릭 애니메이션을 1회 전부 순환한 뒤, 원래 가지고 있어야 할 마우스 커서 원본 텍스처로 자동 복구합니다.
        /// </summary>
        private IEnumerator Co_PlayClickAnimation()
        {
            _isClickAnimating = true;

            // 현재 상시로 재생 중인 커서 프레임 애니메이션 루틴을 일시 정지
            if (_animationCoroutine != null)
            {
                StopCoroutine(_animationCoroutine);
                _animationCoroutine = null;
            }

            float delay = 1f / (_clickFrameRate > 0 ? _clickFrameRate : 20f);

            for (int i = 0; i < _clickFrames.Length; i++)
            {
                if (_clickFrames[i] != null)
                {
                    Cursor.SetCursor(_clickFrames[i], _clickHotspot, CursorMode.Auto);
                }
                yield return new WaitForSeconds(delay);
            }

            _isClickAnimating = false;

            // 클릭 직전 혹은 도중에 바뀐 정식 커서 모양 상태로 자연스럽게 롤백
            RestoreActiveCursor();
        }

        /// <summary>
        /// 클릭 애니메이션 완료 후 현재 지정되어 있는 최신 커서 타입으로 복구해 주는 헬퍼 메서드입니다.
        /// </summary>
        private void RestoreActiveCursor()
        {
            if (!_configMap.TryGetValue(_currentType, out CursorConfig config))
            {
                Cursor.SetCursor(null, Vector2.zero, CursorMode.Auto);
                return;
            }

            if (config.animationFrames != null && config.animationFrames.Length > 0)
            {
                _animationCoroutine = StartCoroutine(Co_AnimateCursor(config));
            }
            else
            {
                Cursor.SetCursor(config.staticTexture, config.hotspot, CursorMode.Auto);
            }
        }

        /// <summary>
        /// 커서 프레임을 프레임레이트에 따라 순환 재생하는 애니메이션 코루틴입니다.
        /// </summary>
        private IEnumerator Co_AnimateCursor(CursorConfig config)
        {
            float delay = 1f / (config.frameRate > 0 ? config.frameRate : 10f);
            _currentFrameIndex = 0;

            while (true)
            {
                Texture2D currentFrame = config.animationFrames[_currentFrameIndex];
                Cursor.SetCursor(currentFrame, config.hotspot, CursorMode.Auto);

                _currentFrameIndex++;
                if (_currentFrameIndex >= config.animationFrames.Length)
                {
                    if (config.loop)
                    {
                        _currentFrameIndex = 0;
                    }
                    else
                    {
                        // 루프가 아닌 경우 마지막 프레임 고정 후 코루틴 종료
                        _currentFrameIndex = config.animationFrames.Length - 1;
                        yield break;
                    }
                }

                yield return new WaitForSeconds(delay);
            }
        }
    }
}
