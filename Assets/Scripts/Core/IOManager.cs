using System;
using System.IO;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 게임 세이브 데이터의 물리적 디바이스 입출력(File I/O)을 총괄하는 코어 매니저.
    /// 윈도우 환경(%APPDATA%/StockWars/Saves/) 및 기타 플랫폼을 유연하게 감지하는 경로 매퍼를 포함하며,
    /// 크래시 방지용 2중 백업 복구(SaveSafetyCheck) 및 데모 버전 세이브 데이터 이관 프로토콜을 탑재하고 있습니다.
    /// 스팀 클라우드 연동 및 백신 검사로 인한 로컬 파일 공유 위반(File Lock)을 완전히 방어하는 Retry Pattern을 장착했습니다.
    /// 세이브/로드 시 MarketManager의 96종 실시간 주가/거래량 상태를 백그라운드에서 완전히 자동 패키징/복원 연동합니다.
    /// </summary>
    public class IOManager : Singleton<IOManager>
    {
        private string _savesDirectoryPath;

        protected override void Awake()
        {
            base.Awake();
            InitializeDirectory();
        }

        /// <summary>
        /// 실행 플랫폼별 표준 세이브 디렉토리를 확인하고 생성합니다.
        /// </summary>
        private void InitializeDirectory()
        {
            try
            {
#if UNITY_EDITOR_WIN || UNITY_STANDALONE_WIN
                // 윈도우 환경 표준: %APPDATA%/StockWars/Saves/
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
                _savesDirectoryPath = Path.Combine(appData, "StockWars", "Saves");
#else
                // 타 플랫폼(모바일/맥 등) 표준: persistentDataPath/Saves/
                _savesDirectoryPath = Path.Combine(Application.persistentDataPath, "Saves");
#endif
                if (!Directory.Exists(_savesDirectoryPath))
                {
                    Directory.CreateDirectory(_savesDirectoryPath);
                    Debug.Log($"[IOManager] Created saves directory at: {_savesDirectoryPath}");
                }
                else
                {
                    Debug.Log($"[IOManager] Saves directory verified at: {_savesDirectoryPath}");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[IOManager] Failed to initialize directory: {ex.Message}");
            }
        }

        /// <summary>
        /// 특정 슬롯에 세이브 데이터(암호화) 및 메타데이터(평문 JSON)를 원자적으로 저장합니다. (SaveSafetyCheck 2중 백업)
        /// </summary>
        /// <param name="slotIndex">세이브 슬롯 번호 (1 이상)</param>
        /// <param name="saveData">저장할 마스터 데이터</param>
        /// <param name="metadata">슬롯에 표시할 메타데이터</param>
        public void SaveGame(int slotIndex, SaveDataDTO saveData, SaveMetadata metadata)
        {
            if (saveData == null) throw new ArgumentNullException(nameof(saveData));
            if (metadata == null) throw new ArgumentNullException(nameof(metadata));

            string baseName = $"Save_Slot_{slotIndex}";
            string datPath = Path.Combine(_savesDirectoryPath, $"{baseName}.dat");
            string tmpPath = Path.Combine(_savesDirectoryPath, $"{baseName}.dat.tmp");
            string bakPath = Path.Combine(_savesDirectoryPath, $"{baseName}.dat.bak");
            string metaPath = Path.Combine(_savesDirectoryPath, $"{baseName}_Meta.json");

            try
            {
                // [자동 연동] 96개 주식 종목의 런타임 현재가, 거래량 잔고, 최고가 및 168 히스토리 패키징 저장
                if (MarketManager.Instance != null)
                {
                    saveData.MarketState = MarketManager.Instance.SaveMarketState();
                }

                // 1. 임시 파일(.tmp)에 암호화된 세이브 바디 선 작성 (Retry 지원)
                string encryptedData = DataSerializer.SerializeAndEncrypt(saveData);
                WriteFileWithRetry(tmpPath, encryptedData);

                // 2. 메타데이터 파일(.json 평문) 저장 (인스펙터 슬롯 리스트 로딩 최적화, Retry 지원)
                metadata.LastSaveTime = DateTime.UtcNow; // 마지막 세이브 시간 UTC 기록
                string metaJson = Newtonsoft.Json.JsonConvert.SerializeObject(metadata, Newtonsoft.Json.Formatting.Indented);
                WriteFileWithRetry(metaPath, metaJson);

                // 3. 기존 세이브 파일이 있다면 백업(.bak)으로 전환하여 크래시 롤백 대비 (Retry 지원)
                if (File.Exists(datPath))
                {
                    DeleteFileWithRetry(bakPath); // 기존 구형 백업 파기
                    MoveFileWithRetry(datPath, bakPath);
                }

                // 4. 안전 쓰기가 끝난 임시 파일(.tmp)을 본 파일(.dat)로 이름 변경하여 활성화 (Retry 지원)
                MoveFileWithRetry(tmpPath, datPath);

                // 5. 트랜잭션이 최종 성공한 경우 백업 파일 파일 안전 제거 (Retry 지원)
                DeleteFileWithRetry(bakPath);

                Debug.Log($"[IOManager] Successfully saved slot {slotIndex} with SaveSafetyCheck protection.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[IOManager] Critical error occurred during saving slot {slotIndex}: {ex.Message}");
                
                // 에러 발생 시 임시 파일 자원 복원 및 Failsafe 복구
                DeleteFileWithRetry(tmpPath);
                
                // 만약 백업본(.bak)이 존재하고 원본(.dat)이 손상된 상황이라면 백업본 복귀 시도
                if (File.Exists(bakPath) && !File.Exists(datPath))
                {
                    MoveFileWithRetry(bakPath, datPath);
                    Debug.LogWarning("[IOManager] Saved slot recovery executed from backup (.bak) due to write crash.");
                }
                throw;
            }
        }

        /// <summary>
        /// 특정 슬롯의 암호화 세이브 데이터를 검증 후 복구하여 반환합니다. 
        /// 파일이 손상되었거나 유실되었을 경우 백업(.bak) 파일로의 자동 복구를 지능적으로 시도합니다.
        /// </summary>
        public SaveDataDTO LoadGame(int slotIndex)
        {
            string baseName = $"Save_Slot_{slotIndex}";
            string datPath = Path.Combine(_savesDirectoryPath, $"{baseName}.dat");
            string bakPath = Path.Combine(_savesDirectoryPath, $"{baseName}.dat.bak");

            // 1. 본 세이브 파일 유실 시 백업본 복구 자동 시도 (Retry 지원)
            if (!File.Exists(datPath) && File.Exists(bakPath))
            {
                MoveFileWithRetry(bakPath, datPath);
                Debug.LogWarning($"[IOManager] Recovered missing save file for slot {slotIndex} using backup (.bak).");
            }

            if (!File.Exists(datPath))
            {
                Debug.LogWarning($"[IOManager] Save file for slot {slotIndex} does not exist.");
                return null;
            }

            try
            {
                // Retry 적용하여 파일 리딩 수행
                string encryptedContent = ReadFileWithRetry(datPath);
                SaveDataDTO loadedData = DataSerializer.DecryptAndDeserialize<SaveDataDTO>(encryptedContent);

                // [자동 연동] 로드 성공 시 96종 전체의 런타임 시장 상태 복구 적용
                if (loadedData != null && MarketManager.Instance != null)
                {
                    MarketManager.Instance.LoadMarketState(loadedData.MarketState);
                }

                return loadedData;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[IOManager] Corrupted or tampered save file detected in slot {slotIndex}: {ex.Message}");
                
                // 해시 불일치 또는 데이터 크래시 발생 시 백업본 재검증 Failsafe 시도
                if (File.Exists(bakPath))
                {
                    try
                    {
                        Debug.LogWarning($"[IOManager] Attempting Failsafe recovery from backup (.bak) for slot {slotIndex}...");
                        string bakContent = ReadFileWithRetry(bakPath);
                        SaveDataDTO recoveredData = DataSerializer.DecryptAndDeserialize<SaveDataDTO>(bakContent);
                        
                        // [자동 연동] 백업본 복구 성공 시 96종 전체 런타임 주식 시장 상태 복구 복원
                        if (recoveredData != null && MarketManager.Instance != null)
                        {
                            MarketManager.Instance.LoadMarketState(recoveredData.MarketState);
                        }

                        // 복호화 및 검증 성공 시 깨진 파일 제거 및 복구 교체
                        DeleteFileWithRetry(datPath);
                        MoveFileWithRetry(bakPath, datPath);
                        return recoveredData;
                    }
                    catch (Exception bakEx)
                    {
                        Debug.LogError($"[IOManager] Backup file is also corrupted: {bakEx.Message}");
                    }
                }
                throw;
            }
        }

        /// <summary>
        /// 인스펙터/슬롯 선택 화면용 가벼운 메타데이터(.json)만 빠르게 역직렬화하여 읽습니다.
        /// </summary>
        public SaveMetadata LoadMetadata(int slotIndex)
        {
            string metaPath = Path.Combine(_savesDirectoryPath, $"Save_Slot_{slotIndex}_Meta.json");
            if (!File.Exists(metaPath)) return null;

            try
            {
                string json = ReadFileWithRetry(metaPath);
                return Newtonsoft.Json.JsonConvert.DeserializeObject<SaveMetadata>(json);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[IOManager] Failed to load metadata for slot {slotIndex}: {ex.Message}");
                return null;
            }
        }

        #region Demo Save Migration (데모 세이브 이관 프로토콜)

        /// <summary>
        /// Saves 디렉토리 내에 데모 플레이 파일(Save_Demo.dat)이 존재하는지 여부를 체크합니다.
        /// </summary>
        public bool HasDemoSave()
        {
            string demoPath = Path.Combine(_savesDirectoryPath, "Save_Demo.dat");
            return File.Exists(demoPath);
        }

        /// <summary>
        /// 데모 데이터를 정식 버전 데이터로 이관하고, 성공 시 IsDemoVeteran 특전 활성화 플래그가 박힌 SaveDataDTO 객체를 반환합니다.
        /// 이관 후 중복 프롬프트를 예방하기 위해 데모 파일은 '.migrated' 확장자로 보관 처리됩니다.
        /// </summary>
        /// <param name="migratedData">이관 복구된 정식 규격 데이터</param>
        /// <returns>마이그레이션 성공 여부</returns>
        public bool CheckAndMigrateDemoData(out SaveDataDTO migratedData)
        {
            migratedData = null;
            string demoPath = Path.Combine(_savesDirectoryPath, "Save_Demo.dat");
            string archivePath = Path.Combine(_savesDirectoryPath, "Save_Demo.dat.migrated");

            if (!File.Exists(demoPath))
            {
                Debug.LogWarning("[IOManager] Demo save file is missing. Aborting migration.");
                return false;
            }

            try
            {
                // 1. 데모 파일 내용 해독 및 무결성 검증
                string encryptedDemo = ReadFileWithRetry(demoPath);
                SaveDataDTO demoData = DataSerializer.DecryptAndDeserialize<SaveDataDTO>(encryptedDemo);

                // [자동 연동] 데모 파일 로드 성공 시 96종 전체의 시장 상태 복원
                if (demoData != null && MarketManager.Instance != null)
                {
                    MarketManager.Instance.LoadMarketState(demoData.MarketState);
                }

                // 2. 데모 완료 특전 활성화 플래그 주입
                demoData.IsDemoVeteran = true;
                
                // 3. 레벨 스탯 한계 체크 및 보정 (데모 최대 레벨 = 3 규격 준수)
                if (demoData.PlayerLevel > GlobalConstants.MAX_DEMO_LEVEL)
                {
                    demoData.PlayerLevel = GlobalConstants.MAX_DEMO_LEVEL;
                }

                migratedData = demoData;

                // 4. 데모 세이브 아카이브 처리 (중복 이관 실행 방지)
                DeleteFileWithRetry(archivePath);
                MoveFileWithRetry(demoPath, archivePath);

                Debug.Log("[IOManager] Demo Save Data successfully migrated! IsDemoVeteran flag is now active.");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[IOManager] Critical error occurred during Demo Data Migration: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region Thread-safe Retry System (OS 파일 락 충돌 방지 유틸리티)

        /// <summary>
        /// 스팀 클라우드 동기화나 백신 등으로 인해 파일이 일시적으로 잠겼을(Lock) 때, 딜레이를 두고 재시도하여 쓰기를 수행합니다.
        /// </summary>
        private void WriteFileWithRetry(string path, string content)
        {
            const int maxRetries = 3;
            const int delayMs = 100;

            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    File.WriteAllText(path, content, System.Text.Encoding.UTF8);
                    return; // 성공 시 리턴
                }
                catch (IOException)
                {
                    if (i == maxRetries - 1) throw; // 마지막 시도도 실패 시 예외 투척
                    System.Threading.Thread.Sleep(delayMs); // 대기 후 재시도
                }
            }
        }

        /// <summary>
        /// 잠김 상태의 파일을 대기 후 재시도하여 읽습니다.
        /// </summary>
        private string ReadFileWithRetry(string path)
        {
            const int maxRetries = 3;
            const int delayMs = 100;

            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    return File.ReadAllText(path, System.Text.Encoding.UTF8);
                }
                catch (IOException)
                {
                    if (i == maxRetries - 1) throw;
                    System.Threading.Thread.Sleep(delayMs);
                }
            }
            return null;
        }

        /// <summary>
        /// 잠김 상태의 파일을 대기 후 재시도하여 삭제합니다.
        /// </summary>
        private void DeleteFileWithRetry(string path)
        {
            if (!File.Exists(path)) return;

            const int maxRetries = 3;
            const int delayMs = 100;

            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    File.Delete(path);
                    return;
                }
                catch (IOException)
                {
                    if (i == maxRetries - 1) throw;
                    System.Threading.Thread.Sleep(delayMs);
                }
            }
        }

        /// <summary>
        /// 잠김 상태의 파일을 대기 후 재시도하여 이동(이름 변경)합니다.
        /// </summary>
        private void MoveFileWithRetry(string sourcePath, string destPath)
        {
            const int maxRetries = 3;
            const int delayMs = 100;

            for (int i = 0; i < maxRetries; i++)
            {
                try
                {
                    if (File.Exists(destPath))
                    {
                        File.Delete(destPath);
                    }
                    File.Move(sourcePath, destPath);
                    return;
                }
                catch (IOException)
                {
                    if (i == maxRetries - 1) throw;
                    System.Threading.Thread.Sleep(delayMs);
                }
            }
        }

        #endregion
    }
}
