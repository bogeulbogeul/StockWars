using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// 백버튼(ESC 키 또는 UI 뒤로가기 버튼) 입력을 전역적으로 제어하고,
    /// 활성화된 UI 창들의 히스토리를 Stack 구조로 관리하여 순차적인 창 닫기 및 메인 메뉴 전환을 전담하는 매니저.
    /// </summary>
    public class UI_Navigation : Singleton<UI_Navigation>
    {
        [Header("설정 및 디버그")]
        [SerializeField] private bool _enableEscapeKey = true;
        
        // 내비게이션 스택 요소 (GameObject와 이전 씬 활성화 여부 보관용 구조체)
        private struct NavigationItem
        {
            public GameObject PanelObject;
            public bool DeactivatedPrevious; // 이 창이 열릴 때 이전 창이 비활성화되었는지 여부
        }

        private readonly Stack<NavigationItem> _navigationStack = new Stack<NavigationItem>();

        protected override void Awake()
        {
            base.Awake();
            if (Instance != this) return;
        }

        private void Update()
        {
            // 키보드 ESC 키 입력 감지 (전형적인 PC 플랫폼 백버튼)
            if (_enableEscapeKey && Input.GetKeyDown(KeyCode.Escape))
            {
                OnBackButtonPressed();
            }
        }

        /// <summary>
        /// 새로운 UI 창(패널)을 스택에 밀어 넣고 활성화합니다.
        /// </summary>
        /// <param name="panel">열고자 하는 UI Panel GameObject</param>
        /// <param name="deactivatePrevious">true일 경우 바로 하위에 있던 UI 창을 비활성화하여 드로우콜을 절약합니다.</param>
        public void PushPanel(GameObject panel, bool deactivatePrevious = false)
        {
            if (panel == null) return;

            NavigationItem item = new NavigationItem
            {
                PanelObject = panel,
                DeactivatedPrevious = false
            };

            // 1. 하위에 열려있던 창이 있다면 필요한 경우 화면에서 가리기 (드로우콜 최적화)
            if (_navigationStack.Count > 0 && deactivatePrevious)
            {
                var topItem = _navigationStack.Peek();
                if (topItem.PanelObject != null && topItem.PanelObject.activeSelf)
                {
                    topItem.PanelObject.SetActive(false);
                    item.DeactivatedPrevious = true;
                }
            }

            // 2. 타겟 패널 활성화
            panel.SetActive(true);

            // 3. 스택에 등록
            _navigationStack.Push(item);

            Debug.Log($"[UI_Navigation] UI 진입: {panel.name} (스택 크기: {_navigationStack.Count})");
        }

        /// <summary>
        /// 가장 상단에 열려있는 UI 패널을 스택에서 꺼내고 비활성화합니다.
        /// </summary>
        /// <returns>스택에 남은 창이 있어 처리에 성공했는지 여부</returns>
        public bool PopPanel()
        {
            if (_navigationStack.Count == 0) return false;

            // 1. 최상단 패널 꺼내기
            var poppedItem = _navigationStack.Pop();

            // 2. 패널 비활성화 (보안상 파괴되지 않은 오브젝트만 대상)
            if (poppedItem.PanelObject != null)
            {
                poppedItem.PanelObject.SetActive(false);
                Debug.Log($"[UI_Navigation] UI 퇴출: {poppedItem.PanelObject.name} (스택 크기: {_navigationStack.Count})");
            }

            // 3. 이전 창이 이 창 때문에 가려졌었다면(Deactivated) 다시 켜주기
            if (poppedItem.DeactivatedPrevious && _navigationStack.Count > 0)
            {
                var nextItem = _navigationStack.Peek();
                if (nextItem.PanelObject != null)
                {
                    nextItem.PanelObject.SetActive(true);
                }
            }

            return true;
        }

        /// <summary>
        /// 전역 백버튼/ESC 입력이 감지되었을 때 실행되는 컨트롤러 핵심 로직.
        /// </summary>
        public void OnBackButtonPressed()
        {
            // 1. 열려 있는 하위 UI 창이 있다면 하나씩 닫음
            if (PopPanel())
            {
                return;
            }

            // 2. 열려 있는 창이 하나도 없는 클린 화면인 상태에서 ESC를 누르면 pause/메인메뉴/종료 팝업 요구 신호 발생
            Debug.Log("[UI_Navigation] 스택이 비어있는 상태에서 백버튼 입력 감지 -> 시스템 메뉴 호출 이벤트 발행");
            EventBus.Publish(new SystemMenuToggleRequestEvent());
        }

        /// <summary>
        /// 내비게이션 스택에 쌓인 모든 UI 요소를 일괄 비활성화하고 스택을 초기화합니다.
        /// </summary>
        public void ClearHistory()
        {
            while (_navigationStack.Count > 0)
            {
                var item = _navigationStack.Pop();
                if (item.PanelObject != null)
                {
                    item.PanelObject.SetActive(false);
                }
            }
            _navigationStack.Clear();
            Debug.Log("[UI_Navigation] 모든 UI 내비게이션 히스토리가 소거되었습니다.");
        }

        /// <summary>
        /// UI를 정리하고 메인 타이틀 씬으로 전환합니다.
        /// </summary>
        public void GoToMainMenu()
        {
            ClearHistory();

            if (SceneSwitcher.Instance != null)
            {
                SceneSwitcher.Instance.LoadSceneAsync("MainMenu");
            }
            else
            {
                UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
            }
        }
    }

    #region Navigation Events (내비게이션 전역 이벤트 구조체)

    /// <summary>
    /// 열린 서브창이 없는 클린 상태에서 ESC 키를 눌렀을 때 발행되는 요청 이벤트.
    /// HUDController 또는 GameManager가 이 신호를 받아 게임 일시정지 설정 메뉴 창을 띄웁니다.
    /// </summary>
    public struct SystemMenuToggleRequestEvent { }

    #endregion
}
