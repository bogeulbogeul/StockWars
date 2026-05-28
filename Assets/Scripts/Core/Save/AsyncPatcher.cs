using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// CORE_GDD_06 [데이터 영속성] 저장 장애 복구용 백그라운드 재시도 매니저 (AsyncPatcher).
    /// <para>
    /// 디스크 용량 부족, 백신 검사로 인한 파일 락, 권한 누락 등으로 로컬 물리 파일 저장이 일시적으로 실패했을 때,
    /// 크래시나 에러 화면으로 유저 경험을 해치지 않고 메모리 버퍼에 최신 진척도를 영속화하여 격리 보관합니다.
    /// </para>
    /// <para>
    /// **지능적 중복 병합 및 백그라운드 플러시:**
    /// - 동일 슬롯에 대해 다중 저장 실패가 누적될 경우, 메모리 내 버퍼를 항상 최신본(Overwrite)으로 자동 병합합니다.
    /// - 5초 주기로 조용히 백그라운드 파일 쓰기(Flush)를 시도하여 물리 디렉토리 복구 시 즉각 복원합니다.
    /// </para>
    /// </summary>
    public class AsyncPatcher : Singleton<AsyncPatcher>
    {
        private class PendingSaveRequest
        {
            public int SlotIndex;
            public SaveDataDTO SaveData;
            public SaveMetadata Metadata;
            public int RetryCount;
            public DateTime FirstFailedTime;
            public string LastErrorMessage;
        }

        // 각 슬롯별 펜딩된 저장 요청 캐시 딕셔너리
        private readonly Dictionary<int, PendingSaveRequest> _pendingRequests = new Dictionary<int, PendingSaveRequest>();
        
        private Coroutine _retryCoroutine;
        private const float RetryIntervalSeconds = 5.0f;

        protected override void Awake()
        {
            base.Awake();
        }

        /// <summary>
        /// 현재 메모리에 대기 중인 저장 실패 건이 존재하는지 여부.
        /// </summary>
        public bool HasPendingSaves => _pendingRequests.Count > 0;

        /// <summary>
        /// 물리 저장 실패 시 호출되어 메모리 격리 저장소에 진척도를 주입하고 백그라운드 재시도 루프를 기동합니다.
        /// </summary>
        /// <param name="slotIndex">저장 대상 슬롯 번호</param>
        /// <param name="saveData">마스터 세이브 DTO</param>
        /// <param name="metadata">슬롯 표시용 메타데이터</param>
        /// <param name="errorMessage">발생한 예외 에러 메시지</param>
        public void QueueFailedSave(int slotIndex, SaveDataDTO saveData, SaveMetadata metadata, string errorMessage)
        {
            if (saveData == null) return;

            lock (_pendingRequests)
            {
                if (_pendingRequests.TryGetValue(slotIndex, out var existing))
                {
                    // 1. [지능적 병합] 기존 대기 버퍼가 있다면 더 오래된 데이터를 버리고 최신 데이터로 완전 교체 
                    existing.SaveData = saveData;
                    existing.Metadata = metadata;
                    existing.LastErrorMessage = errorMessage;
                    existing.RetryCount = 0; // 최신본 교체에 따른 카운트 초기화
                    Debug.LogWarning($"[AsyncPatcher] 슬롯 {slotIndex}의 기존 펜딩 세이브를 최신 인게임 진척도로 안전하게 병합 교체했습니다.");
                }
                else
                {
                    // 2. 신규 대기 버퍼 등록
                    var request = new PendingSaveRequest
                    {
                        SlotIndex = slotIndex,
                        SaveData = saveData,
                        Metadata = metadata,
                        RetryCount = 0,
                        FirstFailedTime = DateTime.UtcNow,
                        LastErrorMessage = errorMessage
                    };
                    _pendingRequests[slotIndex] = request;
                    Debug.LogError($"[AsyncPatcher] 물리 저장 실패 감지! 슬롯 {slotIndex} 데이터를 메모리 임시 버퍼에 안전하게 격리 보호 조치했습니다. 에러: {errorMessage}");
                }
            }

            // 3. 백그라운드 재시도 코루틴 루프 기동
            if (_retryCoroutine == null)
            {
                _retryCoroutine = StartCoroutine(CoBackgroundRetryLoop());
            }

            // 저장 실패 및 임시 보관 전역 이벤트 발행 (UI 경고 표시용)
            EventBus.Publish(new SaveFailedWarningEvent
            {
                SlotIndex = slotIndex,
                ErrorMessage = errorMessage,
                PendingCount = _pendingRequests.Count
            });
        }

        /// <summary>
        /// 5초 간격으로 백그라운드에서 메모리 캐시를 디스크에 강제 플러시하는 영속성 자가 치유 루프.
        /// </summary>
        private IEnumerator CoBackgroundRetryLoop()
        {
            while (HasPendingSaves)
            {
                yield return new WaitForSeconds(RetryIntervalSeconds);

                List<PendingSaveRequest> currentRequests;
                lock (_pendingRequests)
                {
                    currentRequests = new List<PendingSaveRequest>(_pendingRequests.Values);
                }

                foreach (var req in currentRequests)
                {
                    req.RetryCount++;
                    Debug.Log($"[AsyncPatcher] 슬롯 {req.SlotIndex} 백그라운드 저장 복구 재시도 중... (시도 횟수: {req.RetryCount}회)");

                    // 재시도 틱 이벤트 발행 (로딩 스피너 및 진행 상태 표기용)
                    EventBus.Publish(new SaveRetryTickEvent
                    {
                        SlotIndex = req.SlotIndex,
                        RetryCount = req.RetryCount
                    });

                    try
                    {
                        // IOManager를 통한 물리 저장 직접 시도
                        if (IOManager.Instance != null)
                        {
                            IOManager.Instance.SaveGame(req.SlotIndex, req.SaveData, req.Metadata);
                            
                            // 파일 쓰기 성공 시 대기 큐에서 완전 소거
                            lock (_pendingRequests)
                            {
                                _pendingRequests.Remove(req.SlotIndex);
                            }

                            Debug.Log($"[AsyncPatcher] ⚡저장 장애 복구 완료! 슬롯 {req.SlotIndex}의 대기 세이브 데이터가 물리 디스크에 정상 기입되었습니다.");

                            // 복구 성공 이벤트 발행
                            EventBus.Publish(new SaveRecoveredEvent
                            {
                                SlotIndex = req.SlotIndex,
                                TotalRemainingPending = _pendingRequests.Count
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        req.LastErrorMessage = ex.Message;
                        Debug.LogWarning($"[AsyncPatcher] 슬롯 {req.SlotIndex} 복구 저장 재시도 실패 (대기 유지): {ex.Message}");
                    }
                }
            }

            Debug.Log("[AsyncPatcher] 모든 저장 실패 항목이 복구 완결되어 백그라운드 재시도 코루틴을 안전하게 종료합니다.");
            _retryCoroutine = null;
        }

        /// <summary>
        /// 특정 슬롯에 대기 중인 세이브 요청 정보를 조회합니다. (테스트 및 인스펙터용)
        /// </summary>
        public bool IsSlotPending(int slotIndex)
        {
            lock (_pendingRequests)
            {
                return _pendingRequests.ContainsKey(slotIndex);
            }
        }

        /// <summary>
        /// 메모리에 계류 중인 모든 대기 요청을 강제 폐기합니다. (디버그/초기화용)
        /// </summary>
        public void ClearAllPendingRequests()
        {
            lock (_pendingRequests)
            {
                _pendingRequests.Clear();
            }
            if (_retryCoroutine != null)
            {
                StopCoroutine(_retryCoroutine);
                _retryCoroutine = null;
            }
            Debug.LogWarning("[AsyncPatcher] 모든 메모리 계류 세이브 요청을 강제 취소 소거했습니다.");
        }

        protected override void OnApplicationQuit()
        {
            base.OnApplicationQuit();

            // [게임 안전 종료 연동] 애플리케이션 종료 시 휘발성 메모리에 미기입된 세이브 데이터가 남아있다면,
            // 백그라운드 코루틴의 한계를 넘어 최후의 동기식(Blocking) 디스크 쓰기를 강제 시행하여 데이터 유실을 완전 방지합니다.
            if (HasPendingSaves)
            {
                Debug.LogWarning("[AsyncPatcher] 애플리케이션 종료 감지! 메모리 잔류 세이브 데이터 긴급 동기 플러시를 시도합니다.");

                List<PendingSaveRequest> remaining;
                lock (_pendingRequests)
                {
                    remaining = new List<PendingSaveRequest>(_pendingRequests.Values);
                }

                foreach (var req in remaining)
                {
                    try
                    {
                        if (IOManager.Instance != null)
                        {
                            IOManager.Instance.SaveGame(req.SlotIndex, req.SaveData, req.Metadata);
                            Debug.Log($"[AsyncPatcher] [종료 긴급 복구] 슬롯 {req.SlotIndex}의 미기입 데이터가 물리 디스크에 안전하게 완결 기입되었습니다.");
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.LogError($"[AsyncPatcher] [종료 긴급 복구 실패] 슬롯 {req.SlotIndex} 최종 파일 기입 실패: {ex.Message}");
                    }
                }
            }
        }
    }

    #region AsyncPatcher Events

    /// <summary>
    /// 최초 저장 실패 시 임시 메모리에 보관을 감지하고 알리는 전역 이벤트.
    /// </summary>
    public struct SaveFailedWarningEvent
    {
        public int SlotIndex;
        public string ErrorMessage;
        public int PendingCount;
    }

    /// <summary>
    /// 백그라운드에서 저장을 재시도할 때마다 발행되는 전역 틱 이벤트.
    /// </summary>
    public struct SaveRetryTickEvent
    {
        public int SlotIndex;
        public int RetryCount;
    }

    /// <summary>
    /// 파일 장김 해제 등으로 메모리 계류 세이브가 물리 디스크에 최종 완결되었을 때 발행되는 전역 이벤트.
    /// </summary>
    public struct SaveRecoveredEvent
    {
        public int SlotIndex;
        public int TotalRemainingPending;
    }

    #endregion
}
