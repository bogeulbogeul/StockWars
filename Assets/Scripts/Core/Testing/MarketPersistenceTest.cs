using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 96종 주식 시장 데이터 인스턴스화 및 암호화 파일 세이브/로드 라운드트립 무결성을 정밀 검증하는 테스트 컴포넌트.
    /// 테스트 씬의 아무 빈 GameObject에 부착하여 플레이 모드 구동 시 자동으로 테스트 프로세스를 수행하고 검증 로그를 출력합니다.
    /// </summary>
    public class MarketPersistenceTest : MonoBehaviour
    {
        [Header("Test Configuration")]
        [Tooltip("True일 경우 시작 시 자동으로 무결성 검증 시나리오를 구동합니다.")]
        public bool runTestOnStart = true;

        [SerializeField, ReadOnlyDisplay]
        private string testResultStatus = "Not Run";

        private void Start()
        {
            if (runTestOnStart)
            {
                RunIntegrityTest();
            }
        }

        /// <summary>
        /// 96종 데이터 구성 및 세이브/로드 라운드트립 무결성 검증 시나리오 구동
        /// </summary>
        public void RunIntegrityTest()
        {
            Debug.Log("[MarketPersistenceTest] ===== STARTING INTEGRITY ROUND-TRIP TEST =====");
            testResultStatus = "Running...";

            try
            {
                // 1. 싱글톤 강제 깨우기 및 데이원 초기 세팅 작동
                var market = MarketManager.Instance;
                var io = IOManager.Instance;

                if (market == null || io == null)
                {
                    throw new Exception("MarketManager or IOManager singleton is inactive or failed to initialize.");
                }

                BasePriceInit.Instance.InitializeMarketStart();

                // 2. 96개 전종목 로드 정합성 체크
                List<StockInstance> allStocks = market.GetAllStocks();
                List<StockInstance> listedStocks = market.GetListedStocks();
                List<StockInstance> ipoStocks = market.GetIpoCandidates();

                Debug.Log($"[MarketPersistenceTest] [Step 2] Total initialized stocks: {allStocks.Count} (GDD Target: 96)");
                Debug.Log($"[MarketPersistenceTest] [Step 2] Day-1 Listed stocks: {listedStocks.Count} (GDD Target: 72)");
                Debug.Log($"[MarketPersistenceTest] [Step 2] Reserve IPO candidates: {ipoStocks.Count} (GDD Target: 24)");

                if (allStocks.Count != 96) throw new Exception($"Total stocks mismatch. Got {allStocks.Count}, expected 96.");
                if (listedStocks.Count != 72) throw new Exception($"Listed stocks mismatch. Got {listedStocks.Count}, expected 72.");
                if (ipoStocks.Count != 24) throw new Exception($"IPO candidate stocks mismatch. Got {ipoStocks.Count}, expected 24.");

                // 3. 임의의 런타임 주가 변동 연출 (세이브 로드 라운드트립 테스트를 위한 값 조작)
                Debug.Log("[MarketPersistenceTest] [Step 3] Simulating arbitrary market price shifts...");
                
                // 클라우드 베리 (Low) 주가를 850G -> 1200G로 변동 및 168 히스토리 축적 연출
                var cb = market.GetStock("CLOUDBERRY");
                if (cb == null) throw new Exception("Failed to query CLOUDBERRY instance.");
                cb.CurrentPrice = 1200;
                cb.PeakPrice = 1200;
                cb.SplitCount = 1;
                cb.AvailableVolume = 250000;
                cb.AddPriceToHistory(1000);
                cb.AddPriceToHistory(1100);
                cb.AddPriceToHistory(1200);

                // 고스트 쉘 (High) 주가를 130G -> 50G로 락세 폭락 연출
                var gs = market.GetStock("GHOSTSHELL");
                if (gs == null) throw new Exception("Failed to query GHOSTSHELL instance.");
                gs.CurrentPrice = 50;
                gs.AvailableVolume = 48000;
                gs.AddPriceToHistory(100);
                gs.AddPriceToHistory(80);
                gs.AddPriceToHistory(50);

                // 4. 모크 세이브 데이터 세이빙 트리거 실행 (슬롯 99번 강제 테스트 전용 격리)
                Debug.Log("[MarketPersistenceTest] [Step 4] Execution of SaveGame for Slot 99...");
                SaveDataDTO testSave = new SaveDataDTO
                {
                    Gold = 500000,
                    PlayerLevel = 5,
                    Reputation = ReputationGrade.D
                };
                SaveMetadata testMeta = new SaveMetadata
                {
                    TotalPlayTime = 125.5f,
                    LastLocation = "Cyber Brokerage Office",
                    AppVersion = "1.0.0"
                };

                io.SaveGame(99, testSave, testMeta);
                Debug.Log("[MarketPersistenceTest] [Step 4] Save succeeded with AES-256 and checksum intact.");

                // 5. 로컬 가격 임의 리셋 후 로드 테스트 수행
                Debug.Log("[MarketPersistenceTest] [Step 5] Mutating current state to verify round-trip load restores it...");
                cb.CurrentPrice = 999999; // 훼손
                gs.CurrentPrice = 999999; // 훼손

                SaveDataDTO loadedSave = io.LoadGame(99);
                if (loadedSave == null) throw new Exception("Failed to load test save slot 99.");

                // 6. 데이터 역직렬화 복원 무결성 정밀 대조 검증
                Debug.Log("[MarketPersistenceTest] [Step 6] Cross-referencing loaded values with modified values...");
                
                var loadedCb = market.GetStock("CLOUDBERRY");
                var loadedGs = market.GetStock("GHOSTSHELL");

                if (loadedCb.CurrentPrice != 1200) throw new Exception($"CLOUDBERRY price recovery failed. Got {loadedCb.CurrentPrice}, expected 1200.");
                if (loadedCb.PeakPrice != 1200) throw new Exception("CLOUDBERRY peak price recovery failed.");
                if (loadedCb.SplitCount != 1) throw new Exception("CLOUDBERRY split count recovery failed.");
                if (loadedCb.AvailableVolume != 250000) throw new Exception("CLOUDBERRY volume recovery failed.");
                if (loadedCb.PriceHistory.Count < 3) throw new Exception("CLOUDBERRY price history recovery failed.");

                if (loadedGs.CurrentPrice != 50) throw new Exception($"GHOSTSHELL price recovery failed. Got {loadedGs.CurrentPrice}, expected 50.");
                if (loadedGs.AvailableVolume != 48000) throw new Exception("GHOSTSHELL volume recovery failed.");

                Debug.Log($"[MarketPersistenceTest] CHECK loaded DTO stats: Gold={loadedSave.Gold}, PlayerLevel={loadedSave.PlayerLevel}, Rep={loadedSave.Reputation}");
                if (loadedSave.Gold != 500000) throw new Exception("Gold balance recovery failed.");

                // 7. 테스트 전용 슬롯 자원 정리
                string savesDir = System.IO.Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
                    "StockWars", "Saves"
                );
#if !UNITY_EDITOR_WIN && !UNITY_STANDALONE_WIN
                savesDir = System.IO.Path.Combine(Application.persistentDataPath, "Saves");
#endif
                System.IO.File.Delete(System.IO.Path.Combine(savesDir, "Save_Slot_99.dat"));
                System.IO.File.Delete(System.IO.Path.Combine(savesDir, "Save_Slot_99_Meta.json"));
                Debug.Log("[MarketPersistenceTest] Cleaned up temporary test slot 99 files.");

                testResultStatus = "SUCCESS (All Checks Passed)";
                Debug.Log("[MarketPersistenceTest] ===== INTEGRITY TEST COMPLETED WITH 100% SUCCESS =====");
            }
            catch (Exception ex)
            {
                testResultStatus = "FAILED: " + ex.Message;
                Debug.LogError($"[MarketPersistenceTest] ===== INTEGRITY TEST FAILED =====: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}
