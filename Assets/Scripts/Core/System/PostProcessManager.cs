using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_01 & CORE_GDD_05: 전역 포스트 프로세싱 및 화면 필터 관리 매니저 (PostProcessManager).
    /// <para>
    /// URP의 Volume 시스템을 활용하여 인게임의 '코지 온리(Cozy-Only)' 그래픽 감성을 유기적으로 완성합니다.
    /// 기존의 사이버틱하고 차가운 글리치/CRT 느낌 대신, 아늑한 벽난로/폭우 무드나 따뜻한 백열등 분위기를 관리합니다.
    /// </para>
    /// <para>
    /// Base(기본 아늑함), Crisis(시장 위기/벽난로 무드), Warning(보안 적발 경고) 볼륨의 Weight(가중치)를
    /// 전역 이벤트 구독을 통해 실시간으로 부드럽게 Lerp(보간) 제어합니다.
    /// </para>
    /// </summary>
    public class PostProcessManager : Singleton<PostProcessManager>
    {
        [Header("URP Volumes")]
        [Tooltip("기본 코지 아늑함 분위기 볼륨 (Priority: 0 권장)")]
        [SerializeField] private Volume _baseVolume;

        [Tooltip("시장 대폭락/추심 위기 등 분위기 볼륨 (Priority: 10 권장, 비 오는 날의 따뜻한 벽난로 무드)")]
        [SerializeField] private Volume _crisisVolume;

        [Tooltip("치트 감지 등 보안 경고 분위기 볼륨 (Priority: 20 권장, 부드러운 다크 주황/엠버 무드)")]
        [SerializeField] private Volume _warningVolume;

        [Header("Transition Settings")]
        [Tooltip("화면 필터 전환 시간 (초)")]
        [SerializeField] private float _transitionDuration = 1.0f;

        [Tooltip("보안 경고 연출 시 최대 가중치 유지 시간 (초)")]
        [SerializeField] private float _warningHoldDuration = 3.0f;

        private Coroutine _crisisCoroutine;
        private Coroutine _warningCoroutine;

        protected override void Awake()
        {
            base.Awake();
            InitializeWeights();
        }

        private void OnEnable()
        {
            // 전역 이벤트 구독 등록
            EventBus.Subscribe<DataTamperedEvent>(OnDataTampered);
            EventBus.Subscribe<GlobalCrisisEvent>(OnGlobalCrisis);
        }

        private void OnDisable()
        {
            // 전역 이벤트 구독 해제
            EventBus.Unsubscribe<DataTamperedEvent>(OnDataTampered);
            EventBus.Unsubscribe<GlobalCrisisEvent>(OnGlobalCrisis);
        }

        /// <summary>
        /// 런타임 시작 시 모든 볼륨의 초기 가중치 상태를 확립합니다.
        /// </summary>
        private void InitializeWeights()
        {
            if (_baseVolume != null) _baseVolume.weight = 1.0f;
            if (_crisisVolume != null) _crisisVolume.weight = 0.0f;
            if (_warningVolume != null) _warningVolume.weight = 0.0f;

            Debug.Log("[PostProcessManager] URP 볼륨 가중치 초기화 완료 (Cozy Base = 1.0)");
        }

        // --------------------------------------------------------
        // 1. 이벤트 수신 핸들러
        // --------------------------------------------------------

        /// <summary>
        /// 무단 데이터 조작(치트 적발) 감청 시 경고 비주얼을 은은한 엠버 펄스로 발동시킵니다.
        /// </summary>
        private void OnDataTampered(DataTamperedEvent e)
        {
            Debug.LogWarning($"[PostProcessManager] 보안 조작 감지 이벤트 수신 ({e.FieldName}) -> 코지 주황 경고 화면 전환");
            
            if (_warningVolume == null)
            {
                Debug.LogWarning("[PostProcessManager] _warningVolume이 인스펙터에 등록되어 있지 않아 화면 연출을 생략합니다.");
                return;
            }

            if (_warningCoroutine != null)
            {
                StopCoroutine(_warningCoroutine);
            }
            _warningCoroutine = StartCoroutine(Co_PulseWarningVolume());
        }

        /// <summary>
        /// 주식 시장 위기(대폭락, 뱅크럽시 전조 등) 발생 시 벽난로/폭우 아늑함 필터로 전환합니다.
        /// </summary>
        private void OnGlobalCrisis(GlobalCrisisEvent e)
        {
            Debug.Log($"[PostProcessManager] 시장 위기 이벤트 수신 (Active={e.IsCrisisActive}, Msg={e.CrisisMessage}) -> 분위기 전환 시작");

            if (_crisisVolume == null)
            {
                Debug.LogWarning("[PostProcessManager] _crisisVolume이 인스펙터에 등록되어 있지 않아 화면 연출을 생략합니다.");
                return;
            }

            if (_crisisCoroutine != null)
            {
                StopCoroutine(_crisisCoroutine);
            }
            
            float targetWeight = e.IsCrisisActive ? 1.0f : 0.0f;
            _crisisCoroutine = StartCoroutine(Co_LerpVolumeWeight(_crisisVolume, targetWeight, _transitionDuration));
        }

        // --------------------------------------------------------
        // 2. 화면 필터 보간 코루틴 연산부
        // --------------------------------------------------------

        /// <summary>
        /// 특정 볼륨의 가중치를 목표치까지 부드럽게 Lerp합니다.
        /// </summary>
        private IEnumerator Co_LerpVolumeWeight(Volume volume, float targetWeight, float duration)
        {
            float startWeight = volume.weight;
            float elapsedTime = 0.0f;

            while (elapsedTime < duration)
            {
                elapsedTime += Time.deltaTime;
                float t = Mathf.SmoothStep(0.0f, 1.0f, elapsedTime / duration);
                volume.weight = Mathf.Lerp(startWeight, targetWeight, t);
                yield return null;
            }

            volume.weight = targetWeight;
            Debug.Log($"[PostProcessManager] 볼륨 '{volume.gameObject.name}'의 가중치가 성공적으로 {targetWeight}로 안착되었습니다.");
        }

        /// <summary>
        /// 보안 위반 시 주황빛 엠버 필터가 부드럽게 차올랐다가(Fade In), 유지된 후, 서서히 꺼지는(Fade Out) 펄스 연출 코루틴입니다.
        /// </summary>
        private IEnumerator Co_PulseWarningVolume()
        {
            // 1. Fade In
            yield return Co_LerpVolumeWeight(_warningVolume, 1.0f, _transitionDuration * 0.5f);

            // 2. Hold
            yield return new WaitForSeconds(_warningHoldDuration);

            // 3. Fade Out
            yield return Co_LerpVolumeWeight(_warningVolume, 0.0f, _transitionDuration);
        }

        // --------------------------------------------------------
        // 3. 외부 제어 API (Day/Night 라이트 등 연동용)
        // --------------------------------------------------------

        /// <summary>
        /// 외부 시스템(예: GlobalLightingCycle)에서 기본 베이스 볼륨의 블렌딩 강도를 부드럽게 바꿀 수 있도록 지원합니다.
        /// </summary>
        public void SetBaseVolumeWeight(float weight, float duration = 0.0f)
        {
            if (_baseVolume == null) return;

            if (duration <= 0.0f)
            {
                _baseVolume.weight = weight;
            }
            else
            {
                StartCoroutine(Co_LerpVolumeWeight(_baseVolume, weight, duration));
            }
        }
    }

    // --------------------------------------------------------
    // 4. 연동 데이터 이벤트 명세
    // --------------------------------------------------------

    /// <summary>
    /// 전역 시장 위기 상황의 온/오프 상태 및 관련 메시지를 동반하는 전역 이벤트
    /// </summary>
    public struct GlobalCrisisEvent
    {
        /// <summary>True일 경우 대폭락 위기 연출 모드로 진입, False일 경우 해제</summary>
        public bool IsCrisisActive;

        /// <summary>위기 관련 기사 또는 알림 헤드라인</summary>
        public string CrisisMessage;
    }
}
