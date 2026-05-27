using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

namespace StockWars.Core
{
    /// <summary>
    /// 씬 전환 시 비동기 로딩 및 페이드 연출을 전담하는 매니저
    /// UI 컴포넌트와의 강결합(의존성)을 끊기 위해 EventBus를 통해 페이드 신호를 발송합니다.
    /// </summary>
    public class SceneSwitcher : Singleton<SceneSwitcher>
    {
        // 씬 전환 중인지 체크하는 플래그 (중복 광클 로딩 방지)
        public bool IsLoading { get; private set; } = false;

        /// <summary>
        /// 새로운 씬을 비동기로 로드하며 페이드아웃/인 연출을 진행합니다.
        /// </summary>
        /// <param name="sceneName">로드할 씬의 이름</param>
        /// <param name="fadeDuration">페이드에 걸리는 시간</param>
        public void LoadSceneAsync(string sceneName, float fadeDuration = 0.5f)
        {
            if (IsLoading)
            {
                Debug.LogWarning("[SceneSwitcher] 이미 씬을 전환 중입니다. 중복 호출이 무시됩니다.");
                return;
            }

            StartCoroutine(LoadSceneCoroutine(sceneName, fadeDuration));
        }

        private IEnumerator LoadSceneCoroutine(string sceneName, float fadeDuration)
        {
            IsLoading = true;

            // 1. 페이드 아웃 연출 (EventBus를 통해 전역 UI 캔버스에 명령 하달)
            EventBus.Publish(new ScreenFadeEvent { IsFadeOut = true, Duration = fadeDuration });

            // 페이드 아웃 연출이 끝날 때까지 대기
            yield return new WaitForSeconds(fadeDuration);

            // 2. 비동기 씬 로딩 시작 및 자동 활성화 방지
            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName);
            asyncLoad.allowSceneActivation = false; // 90%에서 로딩을 멈추고 대기함
            
            // 로딩이 90%(0.9f)에 도달할 때까지 대기
            while (asyncLoad.progress < 0.9f)
            {
                // TODO: 향후 로딩 프로그레스바 구현 시 asyncLoad.progress 활용 가능
                yield return null;
            }

            // 준비 완료. 씬을 활성화하여 화면에 띄움
            asyncLoad.allowSceneActivation = true;
            
            // 씬 활성화가 완전히 끝날 때까지 대기 (isDone은 이때 true가 됨)
            while (!asyncLoad.isDone)
            {
                yield return null;
            }

            // 3. 페이드 인 연출 (씬 로딩이 완전히 끝난 후 화면을 밝게 만듦)
            EventBus.Publish(new ScreenFadeEvent { IsFadeOut = false, Duration = fadeDuration });

            // 페이드 인 연출 시간만큼 대기
            yield return new WaitForSeconds(fadeDuration);

            IsLoading = false;
        }
    }

    /// <summary>
    /// 화면 페이드 인/아웃을 지시하는 이벤트 DTO
    /// UI 스크립트(예: FadeUI)가 이 이벤트를 구독하여 실제 검은 화면 애니메이션을 재생합니다.
    /// </summary>
    public struct ScreenFadeEvent
    {
        public bool IsFadeOut; // true면 화면이 어두워짐, false면 밝아짐
        public float Duration; // 연출 진행 시간
    }
}
