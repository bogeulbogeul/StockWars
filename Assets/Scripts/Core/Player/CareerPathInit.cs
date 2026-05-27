using UnityEngine;
using System;
using System.Collections.Generic;

namespace StockWars.Core
{
    /// <summary>
    /// 게임 최초 시작 시 플레이어의 성향 진단 테스트(TPT - Trader Personality Test) 질문 세트 및 채점 연산을 수행하고,
    /// 이에 맞춰 초기 자본 5,000G 배분 및 LV 1 보너스 능력치(Base Block)를 자동 분배하고 무결성을 확인하는 스타터 클래스.
    /// </summary>
    public class CareerPathInit : MonoBehaviour
    {
        public enum CareerType
        {
            DayTrader,      // 공격적 자산가 / 투기꾼 (운용력 LV 1, 초기 자본 5,000G)
            ValueInvestor,  // 베테랑 협상가 / 가치투자자 (협상력 LV 1, 초기 자본 5,000G)
            MarketAnalyst,  // 예리한 분석가 / 시장분석가 (분석력 LV 1, 초기 자본 5,000G)
            Workaholic      // 불굴의 트레이더 / 워커홀릭 (회복력 LV 1, 초기 자본 5,000G)
        }

        #region TPT (Trader Personality Test) 데이터 정의 및 구조

        [System.Serializable]
        public struct TPTAnswer
        {
            public string AnswerText;
            public CareerType AssociatedCareer; // 이 선택지가 가산하는 성향
        }

        [System.Serializable]
        public struct TPTQuestion
        {
            public string QuestionText;
            public TPTAnswer[] Answers; // 총 4개 선택지 (A, B, C, D)
        }

        // GDD 3.1 기준 기획된 고정 3문항 셋
        private static readonly TPTQuestion[] TPTDatabase = new TPTQuestion[]
        {
            new TPTQuestion
            {
                QuestionText = "Q1. 시장 대폭락 상황, 당신의 첫 행동은?",
                Answers = new TPTAnswer[]
                {
                    new TPTAnswer { AnswerText = "차트의 기술적 지표를 정밀 분석한다.", AssociatedCareer = CareerType.MarketAnalyst },
                    new TPTAnswer { AnswerText = "금융권 지인에게 연락해 대출 한도를 체크한다.", AssociatedCareer = CareerType.ValueInvestor },
                    new TPTAnswer { AnswerText = "저점 매수 기회로 보고 남은 자산을 투입한다.", AssociatedCareer = CareerType.DayTrader },
                    new TPTAnswer { AnswerText = "일단 휴식을 취하며 시장의 평정심을 기다린다.", AssociatedCareer = CareerType.Workaholic }
                }
            },
            new TPTQuestion
            {
                QuestionText = "Q2. 당신이 가장 신뢰하는 정보의 원천은?",
                Answers = new TPTAnswer[]
                {
                    new TPTAnswer { AnswerText = "수치와 데이터가 증명된 공식 리포트", AssociatedCareer = CareerType.MarketAnalyst },
                    new TPTAnswer { AnswerText = "업계 핵심 관계자로부터 들은 은밀한 찌라시", AssociatedCareer = CareerType.ValueInvestor },
                    new TPTAnswer { AnswerText = "시장의 전체적인 거래량과 유동성 흐름", AssociatedCareer = CareerType.DayTrader },
                    new TPTAnswer { AnswerText = "직접 발로 뛰며 체감한 시장의 분위기", AssociatedCareer = CareerType.Workaholic }
                }
            },
            new TPTQuestion
            {
                QuestionText = "Q3. 큰 수익을 낸 후 가장 먼저 하고 싶은 일은?",
                Answers = new TPTAnswer[]
                {
                    new TPTAnswer { AnswerText = "매매 일지를 작성하며 승리 요인을 복기한다.", AssociatedCareer = CareerType.MarketAnalyst },
                    new TPTAnswer { AnswerText = "더 좋은 정보를 얻기 위해 안나와 식사한다.", AssociatedCareer = CareerType.ValueInvestor },
                    new TPTAnswer { AnswerText = "수익금으로 오피스를 확장하거나 고급 가구를 산다.", AssociatedCareer = CareerType.DayTrader },
                    new TPTAnswer { AnswerText = "스파나 여행을 통해 쌓인 스트레스를 해소한다.", AssociatedCareer = CareerType.Workaholic }
                }
            }
        };

        /// <summary>
        /// UI 연동용: 진단 테스트용 3문항의 질문 및 답변 데이터를 조회합니다.
        /// </summary>
        public TPTQuestion[] GetTPTQuestions()
        {
            return TPTDatabase;
        }

        #endregion

        #region TPT 답변 채점 및 캐릭터 커리어 초기화 실행

        /// <summary>
        /// 유저가 테스트 질문 3개에 선택한 답변 인덱스들(각 0~3 범위)을 기반으로, 
        /// 성향을 자동 채점하여 최종 캐릭터 생성을 완료합니다.
        /// </summary>
        /// <param name="q1AnswerIdx">1번 질문 답변 인덱스 (0=A, 1=B, 2=C, 3=D)</param>
        /// <param name="q2AnswerIdx">2번 질문 답변 인덱스 (0=A, 1=B, 2=C, 3=D)</param>
        /// <param name="q3AnswerIdx">3번 질문 답변 인덱스 (0=A, 1=B, 2=C, 3=D)</param>
        public void InitializeCareerFromTPT(int q1AnswerIdx, int q2AnswerIdx, int q3AnswerIdx)
        {
            // 인덱스 범위 예외 방어
            q1AnswerIdx = Mathf.Clamp(q1AnswerIdx, 0, 3);
            q2AnswerIdx = Mathf.Clamp(q2AnswerIdx, 0, 3);
            q3AnswerIdx = Mathf.Clamp(q3AnswerIdx, 0, 3);

            // 각 성향별 누적 점수 집계 딕셔너리
            Dictionary<CareerType, int> scoreSheet = new Dictionary<CareerType, int>()
            {
                { CareerType.DayTrader, 0 },
                { CareerType.ValueInvestor, 0 },
                { CareerType.MarketAnalyst, 0 },
                { CareerType.Workaholic, 0 }
            };

            // 질문별 연결 성향 가중치 가산
            scoreSheet[TPTDatabase[0].Answers[q1AnswerIdx].AssociatedCareer]++;
            scoreSheet[TPTDatabase[1].Answers[q2AnswerIdx].AssociatedCareer]++;
            scoreSheet[TPTDatabase[2].Answers[q3AnswerIdx].AssociatedCareer]++;

            // 최고 다득점 성향 선별
            CareerType finalCareer = CareerType.DayTrader;
            int maxScore = -1;

            // 동률 시 우선순위 판정을 위한 사전 정의 순서 (공격적 자산가 > 베테랑 협상가 > 예리한 분석가 > 불굴의 트레이더)
            List<CareerType> priorityList = new List<CareerType>()
            {
                CareerType.DayTrader,
                CareerType.ValueInvestor,
                CareerType.MarketAnalyst,
                CareerType.Workaholic
            };

            foreach (var career in priorityList)
            {
                if (scoreSheet[career] > maxScore)
                {
                    maxScore = scoreSheet[career];
                    finalCareer = career;
                }
            }

            Debug.Log($"[CareerPathInit] 성향 테스트 채점 완료! 진단 결과: {finalCareer} (점수: {maxScore}점 획득)");

            // 도출된 커리어로 실제 지갑 및 스탯 초기화 가동
            InitializeCareer(finalCareer);
        }

        #endregion

        #region 코어 스탯 데이터 주입 및 무결성 검증

        /// <summary>
        /// 확정된 성향에 맞춰 최종적으로 지갑 정보 및 초기 스탯 블록을 주입합니다.
        /// </summary>
        /// <param name="career">최종 확정된 유저 성향 타입</param>
        public void InitializeCareer(CareerType career)
        {
            if (WalletManager.Instance == null || StatCore.Instance == null)
            {
                Debug.LogError("[CareerPathInit] WalletManager 또는 StatCore 인스턴스가 존재하지 않아 초기화할 수 없습니다.");
                return;
            }

            SaveDataDTO saveData = WalletManager.Instance.ActiveSaveData;
            if (saveData == null)
            {
                Debug.LogError("[CareerPathInit] 활성화된 세이브 데이터 DTO가 없어 초기화에 실패했습니다.");
                return;
            }

            // 1. 초기 레벨 및 가용 스탯 포인트 설정 (최초 1레벨 시 포인트는 전공 스탯에 자동 투자되므로 가용 포인트는 0)
            saveData.PlayerLevel = 1;
            saveData.AvailableStatPoints = 0;

            // 2. 초기 자본금 설정 (GDD 3절: 시작 시드머니 5,000G)
            saveData.Gold = 5000;
            saveData.AccumulatedDividends = 0;
            saveData.AccumulatedInterest = 0;
            saveData.DailyJobsUsed = 0;

            // 3. 성향에 따른 전공 스탯 1레벨 선주입 (나머지는 0레벨 초기화)
            UserStats initialStats = new UserStats
            {
                BaseTradingLv = (career == CareerType.DayTrader) ? 1 : 0,
                BaseNegotiationLv = (career == CareerType.ValueInvestor) ? 1 : 0,
                BaseAnalysisLv = (career == CareerType.MarketAnalyst) ? 1 : 0,
                BaseRecoveryLv = (career == CareerType.Workaholic) ? 1 : 0,

                // 보너스 파편들은 0으로 초기화
                BonusTradingVal = 0f,
                BonusNegotiationVal = 0f,
                BonusAnalysisVal = 0f,
                BonusRecoveryVal = 0f
            };

            saveData.Stats = initialStats;

            // 4. 성향에 맞춰 트레이더 출입증 타이틀 저장소 연동 (닉네임/타이틀은 UI 매핑용으로 EventBus에 같이 동봉)
            string titleName = career switch
            {
                CareerType.MarketAnalyst => "예리한 분석가",
                CareerType.ValueInvestor => "베테랑 협상가",
                CareerType.DayTrader => "공격적 자산가",
                CareerType.Workaholic => "불굴의 트레이더",
                _ => "신입 트레이더"
            };

            Debug.Log($"[CareerPathInit] 성향 적용 완료: {career} ({titleName} - 초기 스탯 및 5,000G 현금 주입 완료)");

            // 5. 데이터 무결성 검증 (GDD 5.1 규칙 검사: Base 합산 + Available == PlayerLevel)
            bool isIntegrityValid = StatCore.Instance.VerifyStatPointsIntegrity();
            if (isIntegrityValid)
            {
                Debug.Log("[CareerPathInit] 데이터 무결성 검증 완료: SUM(Base_Blocks) == PlayerLevel 상태 일치 (정합성 보장)");
            }
            else
            {
                Debug.LogError("[CareerPathInit] 정합성 붕괴 비상! 세이브 데이터 무결성이 일치하지 않습니다. 스탯 할당 공식 확인 요망.");
            }

            // 6. 캐릭터 생성 완료 이벤트 전역 전파
            EventBus.Publish(new CareerInitializedEvent
            {
                SelectedCareer = career,
                StartingCash = saveData.Gold,
                InitialStats = initialStats,
                TitleName = titleName
            });
        }

        /// <summary>
        /// 문자열 형태의 커리어 성향 이름을 파싱하여 직접 초기화할 수 있는 유연한 오버로드 API입니다.
        /// (UI 버튼 인자 및 세션 복구 등에 활용됩니다.)
        /// </summary>
        /// <param name="careerName">DayTrader, ValueInvestor, MarketAnalyst, Workaholic 중 하나</param>
        public void InitializeCareer(string careerName)
        {
            if (Enum.TryParse(careerName, true, out CareerType career))
            {
                InitializeCareer(career);
            }
            else
            {
                Debug.LogError($"[CareerPathInit] 잘못된 성향 이름이 입력되었습니다: {careerName}. 초기화하지 않습니다.");
            }
        }

        #endregion
    }

    #region CareerPath Events (스타터 전역 이벤트 구조체)

    /// <summary>
    /// 플레이어 캐릭터 생성이 완결되고 초기 성향 주입이 완료되었을 때 발행되는 이벤트.
    /// HUD UI 초기화, 스토리 씬 인트로 트리거 등에서 수신합니다.
    /// </summary>
    public struct CareerInitializedEvent
    {
        public CareerPathInit.CareerType SelectedCareer;
        public long StartingCash;
        public UserStats InitialStats;
        public string TitleName; // TPT 진단 테스트에서 획득한 트레이더 타이틀명
    }

    #endregion
}
