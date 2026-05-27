using UnityEngine;
using System;
using System.IO;
using System.Text;
using System.Linq;

namespace StockWars.Core
{
    /// <summary>
    /// 빌드 또는 에디터 플레이 중 예외(Exception) 및 심각한 에러 발생 시 로그를 파일로 추출하고,
    /// 디버깅 및 사용자 제보 편의를 위해 UI 에러 팝업 이벤트를 발행하는 무결성 모니터링 엔진.
    /// 디렉토리 용량 잠식을 피하기 위해 최대 로그 수량(기본 20개) 초과 시 오래된 파일을 자동 삭제합니다.
    /// </summary>
    public class ErrorLogger : Singleton<ErrorLogger>
    {
        [Header("로그 설정")]
        [SerializeField] private int _maxLogFiles = 20;
        [SerializeField] private bool _captureExceptionsOnly = false; // true면 Exception만, false면 Error/Assert까지 캡처

        private string _logFolderPath;
        private readonly object _fileLock = new object();

        protected override void Awake()
        {
            base.Awake();
            if (Instance != this) return;

            // 저장용 로그 폴더 경로 지정 및 생성
            _logFolderPath = Path.Combine(Application.persistentDataPath, "Logs");
            
            try
            {
                if (!Directory.Exists(_logFolderPath))
                {
                    Directory.CreateDirectory(_logFolderPath);
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[ErrorLogger] 로그 폴더 생성 실패: {ex.Message}");
            }

            // 유니티 런타임 로그 콜백 구독
            Application.logMessageReceived += OnLogMessageReceived;
        }

        protected override void OnDestroy()
        {
            base.OnDestroy();
            Application.logMessageReceived -= OnLogMessageReceived;
        }

        /// <summary>
        /// 유니티 로그 콜백 이벤트 처리기. 에러 또는 예외 발생 시 동작합니다.
        /// </summary>
        private void OnLogMessageReceived(string logString, string stackTrace, LogType type)
        {
            // 필터링 판정
            bool isTarget = false;
            if (_captureExceptionsOnly)
            {
                isTarget = (type == LogType.Exception);
            }
            else
            {
                isTarget = (type == LogType.Error || type == LogType.Exception || type == LogType.Assert);
            }

            if (!isTarget) return;

            // 파일 및 디렉토리 안전성 보장용 동기화 블록
            lock (_fileLock)
            {
                try
                {
                    // 1. 오래된 에러 로그 정리 (용량 누출 방지)
                    CleanupOldLogFiles();

                    // 2. 신규 에러 로그 파일 생성 및 저장
                    string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                    string fileName = $"error_{timestamp}_{UnityEngine.Random.Range(100, 999)}.log";
                    string filePath = Path.Combine(_logFolderPath, fileName);

                    StringBuilder sb = new StringBuilder();
                    sb.AppendLine("==================================================");
                    sb.AppendLine($" STOCKWARS RUNTIME ERROR LOG");
                    sb.AppendLine("==================================================");
                    sb.AppendLine($"발생 시각: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                    sb.AppendLine($"앱 버전: {Application.version}");
                    sb.AppendLine($"플랫폼: {Application.platform}");
                    sb.AppendLine($"로그 타입: {type}");
                    sb.AppendLine("--------------------------------------------------");
                    sb.AppendLine("오류 메시지:");
                    sb.AppendLine(logString);
                    sb.AppendLine("--------------------------------------------------");
                    sb.AppendLine("호출 스택 (Stack Trace):");
                    sb.AppendLine(stackTrace);
                    sb.AppendLine("==================================================");

                    File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);

                    Debug.LogWarning($"[ErrorLogger] 심각한 오류 검출! 로그 저장 완료: {filePath}");
                }
                catch (Exception ex)
                {
                    // 파일 입출력 에러 등으로 인한 무한 루프 예방을 위해 시스템 콘솔로만 출력
                    Console.WriteLine($"[ErrorLogger] 에러 로그 파일 생성 중 치명적 오류: {ex.Message}");
                }
            }

            // 3. UI 갱신 또는 디버깅 팝업을 띄우기 위해 EventBus를 통해 이벤트 전파
            EventBus.Publish(new ExceptionOccurredEvent
            {
                Message = logString,
                StackTrace = stackTrace,
                LogType = type,
                Time = DateTime.Now
            });
        }

        /// <summary>
        /// 로그 폴더 내 파일 개수를 제한하고, 한도를 초과하면 가장 오래된 로그 파일부터 자동 삭제합니다.
        /// </summary>
        private void CleanupOldLogFiles()
        {
            try
            {
                if (!Directory.Exists(_logFolderPath)) return;

                var directoryInfo = new DirectoryInfo(_logFolderPath);
                var logFiles = directoryInfo.GetFiles("error_*.log")
                                           .OrderBy(f => f.CreationTimeUtc)
                                           .ToList();

                if (logFiles.Count >= _maxLogFiles)
                {
                    int deleteCount = logFiles.Count - _maxLogFiles + 1;
                    for (int i = 0; i < deleteCount; i++)
                    {
                        logFiles[i].Delete();
                        Debug.Log($"[ErrorLogger] 오래된 에러 로그가 자동 삭제되었습니다: {logFiles[i].Name}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ErrorLogger] 오래된 파일 정리 중 오류: {ex.Message}");
            }
        }
    }

    #region ErrorLogger Events (에러 전역 이벤트 구조체)

    /// <summary>
    /// 게임 내에서 처리되지 않은 심각한 에러/예외 발생 시 발행되는 전역 이벤트.
    /// 에러 팝업 UI 스크립트가 이 이벤트를 구독하여 화면에 오류 코드 및 스택을 표시합니다.
    /// </summary>
    public struct ExceptionOccurredEvent
    {
        public string Message;
        public string StackTrace;
        public LogType LogType;
        public DateTime Time;
    }

    #endregion
}
