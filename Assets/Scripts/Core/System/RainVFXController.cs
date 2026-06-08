using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_05 [076]: Rain Particle System (VFX) 제어 컴포넌트.
    /// 날씨 상태에 따라 파티클 시스템의 Emission(방출) 모듈을 조절하여,
    /// 비 효과가 켜지고 꺼질 때 즉시 사라지지 않고 자연스럽게 내리거나 잦아들도록 연출합니다.
    /// </summary>
    [RequireComponent(typeof(ParticleSystem))]
    public class RainVFXController : MonoBehaviour
    {
        [Header("State")]
        [SerializeField] private bool _isRainy = false;

        private ParticleSystem _particleSystem;
        private ParticleSystem.EmissionModule _emissionModule;

        private void Awake()
        {
            EnsureInitialized();
            
            // 초기 비활성화/활성화 상태 적용
            SetRainActive(_isRainy);
        }

        private void EnsureInitialized()
        {
            if (_particleSystem == null)
            {
                _particleSystem = GetComponent<ParticleSystem>();
                if (_particleSystem != null)
                {
                    _emissionModule = _particleSystem.emission;
                }
            }
        }

        /// <summary>
        /// 비 파티클 효과를 켜거나 끕니다. (Emission 조절 및 강제 정지/재생)
        /// </summary>
        public void SetRainActive(bool active)
        {
            _isRainy = active;
            EnsureInitialized();

            if (_particleSystem != null)
            {
                _emissionModule.enabled = active;
                
                if (active)
                {
                    if (!_particleSystem.isPlaying)
                    {
                        _particleSystem.Play();
                    }
                }
                else
                {
                    // 비가 내리지 않을 때는 이미 방출 중이던 파티클을 멈추고 즉시 지웁니다 (Play On Awake 버그 방지)
                    _particleSystem.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
                }
            }
        }

        /// <summary>
        /// 비의 세기에 따라 초당 파티클 방출 비율(Rate over Time)을 조절합니다.
        /// </summary>
        public void SetRainRate(float rateOverTime)
        {
            EnsureInitialized();

            if (_particleSystem != null)
            {
                _emissionModule.rateOverTime = rateOverTime;
            }
        }
    }
}
