using System;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 유저의 PC/디바이스 시스템 시간과 1:1로 완벽하게 동기화되는 리얼타임 엔진
    /// 실제 시간이 흐름에 따라 주가 갱신(초), 정시 이벤트(시간), 자정 갱신(일) 이벤트를 전역 발송합니다.
    /// </summary>
    public class TickEngine : Singleton<TickEngine>
    {
        [Header("Real-Time Settings")]
        [Tooltip("차트 갱신 등을 위한 기본 틱(Tick) 주기(초)")]
        public int tickIntervalSeconds = 1; // 고스트 트레이더 기획 반영: 1초 단위 초정밀 갱신

        // 현재 동기화된 시스템 시간
        public DateTime CurrentTime => DateTime.Now;

        private DateTime _lastTickTime;
        private int _lastHour;
        private DateTime _lastDate; // 날짜 변경 체크를 위한 변수 (버그 방지)

        protected override void Awake()
        {
            base.Awake();
            
            // TODO: [CORE_GDD_06] 하이브리드 시간 동기화 정책에 따라, 
            // 향후 IOManager와 연동하여 세이브 데이터의 마지막 접속 종료 시간을 불러와
            // 오프라인 방치형 보상(배당금 등)을 계산하는 로직이 여기에 추가되어야 합니다.
            
            _lastTickTime = DateTime.Now;
            _lastHour = DateTime.Now.Hour;
            _lastDate = DateTime.Now.Date; // 시간 정보가 없는 순수 날짜(00:00:00)로 초기화
        }

        private void Update()
        {
            DateTime now = DateTime.Now;

            // 1. 기본 틱 간격(1초)마다 차트/주가 갱신 이벤트 발송 (고스트 트레이더 매매 연동)
            if ((now - _lastTickTime).TotalSeconds >= tickIntervalSeconds)
            {
                _lastTickTime = now;
                EventBus.Publish(new GameTickEvent { CurrentTime = now });
            }

            // 2. 정각(시간이 바뀔 때) 이벤트 발송 (예: 13:59 -> 14:00)
            if (now.Hour != _lastHour)
            {
                _lastHour = now.Hour;
                EventBus.Publish(new GameHourTickEvent { CurrentTime = now });
            }

            // 3. 자정(날짜가 바뀔 때) 이벤트 발송 (예: 23:59 -> 00:00)
            // now.Day 대신 now.Date를 비교하여 다음 달 같은 날짜에 접속하더라도 정상 감지되도록 수정
            if (now.Date != _lastDate)
            {
                _lastDate = now.Date;
                EventBus.Publish(new GameDayTickEvent { CurrentTime = now });
            }
        }
    }

    /// <summary>
    /// 주가 변동 및 차트 업데이트를 위한 기본 틱 이벤트 (기본 1초)
    /// 고스트 트레이더 및 시장 엔진이 이 이벤트를 구독합니다.
    /// </summary>
    public struct GameTickEvent { public DateTime CurrentTime; }
    
    /// <summary>
    /// 정각(1시간)마다 발생하는 이벤트 (은행 이자, 수수료 정산 등에 활용 가능)
    /// </summary>
    public struct GameHourTickEvent { public DateTime CurrentTime; }
    
    /// <summary>
    /// 자정(하루)이 지날 때 발생하는 이벤트 (일일 알바 횟수 초기화 등에 활용)
    /// </summary>
    public struct GameDayTickEvent { public DateTime CurrentTime; }
}
