using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_01: 개발자 치트 및 테스트 전용 콘솔 프레임워크 (Developer Debug Console).
    /// <para>
    /// 플레이 모드 구동 시 틸드(`) 또는 탭(Tab) 키를 입력하여 콘솔 창을 토글할 수 있습니다.
    /// </para>
    /// <para>
    /// 자금 주입, 레벨 조절, 스탯 투자 및 초기화, 일일 노동 리셋, 주가 강제 조작, 수배도 조정 등의
    /// 광범위한 테스트 치트 명령어를 텍스트 콘솔 및 원클릭 단축 버튼 형태로 제공합니다.
    /// </para>
    /// <para>
    /// 치트 명령 적용 직후 무결성 엔진인 `DataIntegrity`와 그림자 값을 즉각 강제 동기화하여 보안 오경보를 완벽히 차단합니다.
    /// </para>
    /// </summary>
    public class DebugConsole : Singleton<DebugConsole>
    {
        [Header("Key Configuration")]
        [Tooltip("디버그 콘솔을 토글할 입력 키")]
        public KeyCode toggleKey = KeyCode.BackQuote; // 틸드(`) 키
        public KeyCode alternativeToggleKey = KeyCode.Tab; // 탭 키

        private bool _showConsole = false;
        private string _inputCommand = "";
        private Vector2 _scrollPosition = Vector2.zero;
        private readonly List<string> _consoleLogs = new List<string>();

        // GUI 그리기용 스타일 및 레이아웃 설정
        private Rect _windowRect = new Rect(20, 20, 600, 450);
        private GUIStyle _logStyle;
        private GUIStyle _inputStyle;
        private GUIStyle _buttonStyle;
        private GUIStyle _headerStyle;

        // --------------------------------------------------------
        // 1. 초기화 및 라이프사이클
        // --------------------------------------------------------

        protected override void Awake()
        {
            base.Awake();
            AddLog("===== StockWars Debug Console Initialized =====");
            AddLog("도움말이 필요하시면 '/help' 또는 '/?'를 입력하세요.");
        }

        private void Update()
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            // 토글 키 입력 감지
            if (Input.GetKeyDown(toggleKey) || Input.GetKeyDown(alternativeToggleKey))
            {
                _showConsole = !_showConsole;
            }
#endif
        }

        private void AddLog(string message)
        {
            _consoleLogs.Add($"[{DateTime.Now:HH:mm:ss}] {message}");
            if (_consoleLogs.Count > 100)
            {
                _consoleLogs.RemoveAt(0);
            }
            _scrollPosition.y = float.MaxValue; // 스크롤을 항상 가장 아래로 고정
        }

        // --------------------------------------------------------
        // 2. OnGUI 화면 렌더링 및 단축 버튼 설계
        // --------------------------------------------------------

        private void OnGUI()
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            if (!_showConsole) return;

            // GUI 스타일 지연 세팅
            InitializeStyles();

            // 최상위 윈도우 컨테이너 렌더링
            _windowRect = GUILayout.Window(999, _windowRect, DrawConsoleWindow, "🛠️ DEVELOPER DEBUG CONSOLE (치트 엔진)", GUILayout.Width(650), GUILayout.Height(480));
#endif
        }

        private void InitializeStyles()
        {
            if (_logStyle != null) return;

            _logStyle = new GUIStyle(GUI.skin.label)
            {
                normal = { textColor = Color.green },
                fontSize = 13,
                wordWrap = true,
                fontStyle = FontStyle.Normal
            };

            _inputStyle = new GUIStyle(GUI.skin.textField)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };

            _buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = 12,
                fontStyle = FontStyle.Bold
            };

            _headerStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.yellow }
            };
        }

        private void DrawConsoleWindow(int windowID)
        {
            // 윈도우 드래그 허용 범위 지정 (상단 타이틀 영역)
            GUI.DragWindow(new Rect(0, 0, 10000, 20));

            GUILayout.BeginHorizontal();

            // ── 좌측 영역: 텍스트 터미널 콘솔 로그 ──
            GUILayout.BeginVertical(GUILayout.Width(450));
            
            GUILayout.Label("💬 실행 로그 및 명령 결과:", _headerStyle);
            
            _scrollPosition = GUILayout.BeginScrollView(_scrollPosition, GUI.skin.box, GUILayout.Height(350));
            foreach (var log in _consoleLogs)
            {
                GUILayout.Label(log, _logStyle);
            }
            GUILayout.EndScrollView();

            // 명령어 텍스트 필드 영역
            GUILayout.BeginHorizontal();
            GUI.SetNextControlName("ConsoleInputField");
            _inputCommand = GUILayout.TextField(_inputCommand, _inputStyle, GUILayout.Width(350));
            
            // 엔터 입력 시 명령 즉시 실행
            if (Event.current.isKey && Event.current.keyCode == KeyCode.Return && GUI.GetNameOfFocusedControl() == "ConsoleInputField")
            {
                if (!string.IsNullOrEmpty(_inputCommand))
                {
                    ExecuteCommand(_inputCommand);
                    _inputCommand = "";
                    Event.current.Use(); // 이벤트 소거
                }
            }

            if (GUILayout.Button("실행", _buttonStyle, GUILayout.Width(70)))
            {
                if (!string.IsNullOrEmpty(_inputCommand))
                {
                    ExecuteCommand(_inputCommand);
                    _inputCommand = "";
                }
            }
            GUILayout.EndHorizontal();

            GUILayout.EndVertical();

            GUILayout.Space(15);

            // ── 우측 영역: 마우스 원클릭 단축 치트 버튼 (개발 속도 비약적 가속) ──
            GUILayout.BeginVertical();
            GUILayout.Label("⚡ 빠른 단축 버튼:", _headerStyle);

            if (GUILayout.Button("💰 +50,000 Gold", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/gold 50000");
            }
            if (GUILayout.Button("💰 +100,000 Gold", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/gold 100000");
            }
            if (GUILayout.Button("📈 플레이어 레벨 업", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/level_up");
            }
            if (GUILayout.Button("🧬 스탯 포인트 +5", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/stat_points 5");
            }
            if (GUILayout.Button("🧹 모든 능력치 초기화", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/reset_stats");
            }
            if (GUILayout.Button("☕ 일일 알바 횟수 리셋", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/reset_jobs");
            }
            if (GUILayout.Button("🛡️ 수배도 해제 (Normal)", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/wanted Normal");
            }
            if (GUILayout.Button("🚨 적색 수배 발령 (Notice)", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/wanted RedNotice");
            }
            if (GUILayout.Button("💾 즉시 강제 저장 (Save)", _buttonStyle, GUILayout.Height(30)))
            {
                ExecuteCommand("/save");
            }

            GUILayout.EndVertical();

            GUILayout.EndHorizontal();
        }

        // --------------------------------------------------------
        // 3. 명령어 파싱 및 실행 코어 연산부
        // --------------------------------------------------------

        private void ExecuteCommand(string rawCommand)
        {
            AddLog($"> {rawCommand}");

            string[] parts = rawCommand.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return;

            string cmd = parts[0].ToLower();

            if (WalletManager.Instance == null || WalletManager.Instance.ActiveSaveData == null)
            {
                AddLog("[에러] 세이브 데이터 컨텍스트가 로드되지 않았습니다.");
                return;
            }

            var saveData = WalletManager.Instance.ActiveSaveData;

            try
            {
                switch (cmd)
                {
                    // 1. 자금 조절 치트
                    case "/gold":
                    case "/add_gold":
                        if (parts.Length < 2)
                        {
                            AddLog("사용법: /gold [액수] (예: /gold 50000)");
                            break;
                        }
                        long goldAmount = long.Parse(parts[1]);
                        if (goldAmount >= 0)
                        {
                            WalletManager.Instance.AddCash(goldAmount);
                            AddLog($"[성공] 가용 현금 {goldAmount:N0}G를 안전하게 입금했습니다.");
                        }
                        else
                        {
                            WalletManager.Instance.SpendCash(Math.Abs(goldAmount));
                            AddLog($"[성공] 가용 현금 {Math.Abs(goldAmount):N0}G를 인출/회수했습니다.");
                        }
                        break;

                    // 2. 레벨 조절 치트
                    case "/level":
                    case "/set_level":
                        if (parts.Length < 2)
                        {
                            AddLog("사용법: /level [레벨수치] (예: /level 3)");
                            break;
                        }
                        int targetLevel = int.Parse(parts[1]);
                        saveData.PlayerLevel = targetLevel;
                        
                        // 레벨업 전역 이벤트 강제 트리거를 통해 UI 동기화
                        EventBus.Publish(new PlayerLevelUpEvent
                        {
                            NewLevel = targetLevel,
                            GainedLevels = 0
                        });
                        AddLog($"[성공] 플레이어 레벨을 LV {targetLevel}으로 수동 강제 설정했습니다.");
                        break;

                    case "/level_up":
                        saveData.PlayerLevel++;
                        EventBus.Publish(new PlayerLevelUpEvent
                        {
                            NewLevel = saveData.PlayerLevel,
                            GainedLevels = 1
                        });
                        AddLog($"[성공] 플레이어 레벨을 올렸습니다: LV {saveData.PlayerLevel - 1} -> LV {saveData.PlayerLevel}");
                        break;

                    // 3. 스탯 포인트 조절 치트
                    case "/stat_points":
                        if (parts.Length < 2)
                        {
                            AddLog("사용법: /stat_points [포인트량] (예: /stat_points 5)");
                            break;
                        }
                        int pts = int.Parse(parts[1]);
                        saveData.AvailableStatPoints = pts;
                        AddLog($"[성공] 사용 가능한 스탯 포인트를 {pts} 포인트로 설정했습니다.");
                        break;

                    // 4. 특정 능력치 베이스 레벨 강제 조절 치트
                    case "/set_stat":
                        if (parts.Length < 3)
                        {
                            AddLog("사용법: /set_stat [Analysis/Negotiation/Management/Resilience] [레벨 0~5]");
                            break;
                        }
                        if (Enum.TryParse<StatType>(parts[1], true, out var statType))
                        {
                            int statLv = Mathf.Clamp(int.Parse(parts[2]), 0, 5);
                            var stats = saveData.Stats;
                            switch (statType)
                            {
                                case StatType.Analysis: stats.BaseAnalysisLv = statLv; break;
                                case StatType.Negotiation: stats.BaseNegotiationLv = statLv; break;
                                case StatType.Management: stats.BaseTradingLv = statLv; break;
                                case StatType.Resilience: stats.BaseRecoveryLv = statLv; break;
                            }
                            saveData.Stats = stats;
                            AddLog($"[성공] {statType} 베이스 레벨을 LV {statLv}로 변경했습니다.");
                        }
                        else
                        {
                            AddLog($"[실패] 존재하지 않는 스탯 타입입니다: {parts[1]}");
                        }
                        break;

                    // 5. 정식 스탯 초기화
                    case "/reset_stats":
                        if (StatCore.Instance != null)
                        {
                            StatCore.Instance.ResetAllBaseStats();
                            AddLog("[성공] 모든 베이스 투자 스탯을 회수하고 사용 가능 포인트로 초기화 반환 완료.");
                        }
                        break;

                    // 6. 일일 알바 횟수 리셋
                    case "/reset_jobs":
                        saveData.DailyJobsUsed = 0;
                        AddLog("[성공] 금일 사용 완료한 노동(알바) 횟수를 0으로 깨끗이 리셋했습니다.");
                        break;

                    // 7. 수배 상태 조정 치트
                    case "/wanted":
                        if (parts.Length < 2)
                        {
                            AddLog("사용법: /wanted [Normal/Warning/RedNotice]");
                            break;
                        }
                        if (Enum.TryParse<WantedStatus>(parts[1], true, out var wanted))
                        {
                            saveData.WantedStatus = wanted;
                            AddLog($"[성공] 플레이어 수배 등급을 [{wanted}] 상태로 조율했습니다.");
                        }
                        else
                        {
                            AddLog($"[실패] 규격에 없는 수배 등급입니다: {parts[1]}");
                        }
                        break;

                    // 8. 명성 수치 주입 치트
                    case "/renown":
                        if (parts.Length < 2)
                        {
                            AddLog("사용법: /renown [수치] (예: /renown 1000)");
                            break;
                        }
                        long rw = long.Parse(parts[1]);
                        saveData.RenownPoints = Math.Max(0L, saveData.RenownPoints + rw);
                        AddLog($"[성공] 누적 명성 포인트를 {rw}G 만큼 조정했습니다. (현재 총액: {saveData.RenownPoints})");
                        break;

                    // 9. 특정 주식 실시간 주가 강제 조작 치트
                    case "/stock_price":
                        if (parts.Length < 3)
                        {
                            AddLog("사용법: /stock_price [종목ID] [원하는가격] (예: /stock_price CLOUDBERRY 1500)");
                            break;
                        }
                        string stockId = parts[1].ToUpper();
                        long targetPrice = long.Parse(parts[2]);
                        
                        if (MarketManager.Instance != null)
                        {
                            var stock = MarketManager.Instance.GetStock(stockId);
                            if (stock != null)
                            {
                                stock.CurrentPrice = targetPrice;
                                if (targetPrice > stock.PeakPrice)
                                {
                                    stock.PeakPrice = targetPrice;
                                }
                                AddLog($"[성공] {stockId} 종목의 가격을 {targetPrice:N0}G로 전격 치트 조작 완료했습니다.");
                            }
                            else
                            {
                                AddLog($"[실패] 시장에서 검색되지 않는 종목 ID입니다: {stockId}");
                            }
                        }
                        break;

                    // 10. 강제 즉시 백업 저장
                    case "/save":
                        if (AutoSaveRouter.Instance != null)
                        {
                            AutoSaveRouter.Instance.TriggerInstantSave();
                            AddLog("[성공] 현재까지의 모든 게임 진행 상황을 물리 파일에 원자적으로 수동 강제 저장 완료!");
                        }
                        break;

                    // 도움말 출력
                    case "/help":
                    case "/?":
                        AddLog("=== 사용 가능한 치트 명령어 리스트 ===");
                        AddLog("💰 /gold [액수] : 가용 골드 주입 (음수 입력시 차감)");
                        AddLog("📈 /level [레벨] : 수동 레벨 변경");
                        AddLog("🧬 /stat_points [포인트] : 스탯 포인트 주입");
                        AddLog("🧬 /set_stat [스탯명] [레벨] : Analysis / Negotiation / Management / Resilience");
                        AddLog("🧹 /reset_stats : 투자된 능력치 전체 회수 리셋");
                        AddLog("☕ /reset_jobs : 일일 수행 노동 횟수 완전 리셋");
                        AddLog("🛡️ /wanted [Normal/Warning/RedNotice] : 수배 상태 수동 조정");
                        AddLog("🏷️ /renown [수치] : 명성 포인트 가감");
                        AddLog("📊 /stock_price [종목ID] [수치] : 주가 수동 수치 조작");
                        AddLog("💾 /save : 디스크에 즉시 자동 강제 물리 저장");
                        break;

                    default:
                        AddLog($"[실패] 존재하지 않거나 처리할 수 없는 치트 명령어입니다: {cmd}");
                        break;
                }

                // ── 4. 중요 보안 연동 ──
                // 치트 동작 후 무결성 데이터와 그림자 값을 즉각 강제 재동기화하여 보안 오경보를 완벽 차단!
                if (DataIntegrity.Instance != null)
                {
                    DataIntegrity.Instance.SyncShadows();
                }
            }
            catch (Exception ex)
            {
                AddLog($"[에러] 치트 명령을 수행하는 도중 예외가 던져졌습니다: {ex.Message}");
            }
        }
    }
}
