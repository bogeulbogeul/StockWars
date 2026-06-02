using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;

namespace StockWars.UI
{
    /// <summary>
    /// 게임 씬이 로드되었을 때 자동으로 HUD Canvas 및 EventSystem을 생성해주는 초기화 헬퍼 클래스.
    /// (씬 제한 및 신규/레거시 인풋 시스템 호환성 최적화 버전)
    /// </summary>
    public static class HUDInitializer
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void OnAfterSceneLoad()
        {
            // 인게임 플레이어 인터페이스가 요구되는 특정 플레이 씬에서만 캔버스를 동적 로드하도록 안전 필터 추가
            string activeSceneName = SceneManager.GetActiveScene().name;
            if (activeSceneName != "SampleScene")
            {
                Debug.Log($"[HUDInitializer] 현재 활성화된 씬('{activeSceneName}')은 인게임 플레이 씬이 아니므로 메인 HUD 생성을 무시합니다.");
                return;
            }

            // 1. 이미 씬에 MainHUDMaster가 존재하는지 검사
            if (MainHUDMaster.Instance != null)
            {
                Debug.Log("[HUDInitializer] 기존 MainHUDMaster가 이미 씬에 존재합니다.");
                return;
            }

            // 2. 존재하지 않는다면 메인 HUD 마스터를 동적으로 생성
            Debug.Log("[HUDInitializer] MainHUDMaster가 없어 씬에 동적으로 생성합니다.");
            GameObject hudMasterGo = new GameObject("MainHUD_Master (Runtime)");
            hudMasterGo.AddComponent<MainHUDMaster>();

            // 3. UI 상호작용(호버, 클릭 등)을 처리하기 위해 EventSystem이 없으면 동적 생성
            if (EventSystem.current == null)
            {
                Debug.Log("[HUDInitializer] EventSystem이 존재하지 않아 동적으로 생성합니다.");
                GameObject eventSystemGo = new GameObject("EventSystem (Runtime)");
                eventSystemGo.AddComponent<EventSystem>();

                // 신규 Input System(InputSystemUIInputModule) 패키지가 로드되었는지 확인하고 적절한 모듈 연결
                Type inputSystemModuleType = Type.GetType("UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
                if (inputSystemModuleType != null)
                {
                    eventSystemGo.AddComponent(inputSystemModuleType);
                    Debug.Log("[HUDInitializer] 신규 InputSystem에 호환되는 InputSystemUIInputModule을 바인딩했습니다.");
                }
                else
                {
                    eventSystemGo.AddComponent<StandaloneInputModule>();
                    Debug.Log("[HUDInitializer] 레거시 Input에 호환되는 StandaloneInputModule을 바인딩했습니다.");
                }

                // 씬 전환 시 파괴되지 않도록 방지
                UnityEngine.Object.DontDestroyOnLoad(eventSystemGo);
            }
        }
    }
}
