using System;
using System.Collections.Generic;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 시스템 간 결합도를 낮추기 위한 전역 이벤트 버스
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, Delegate> _events = new Dictionary<Type, Delegate>();

        public static void Subscribe<T>(Action<T> onEvent)
        {
            var type = typeof(T);
            lock (_events)
            {
                if (!_events.ContainsKey(type))
                {
                    _events[type] = null;
                }
                _events[type] = Delegate.Combine(_events[type], onEvent);
            }
        }

        public static void Unsubscribe<T>(Action<T> onEvent)
        {
            var type = typeof(T);
            lock (_events)
            {
                if (_events.ContainsKey(type))
                {
                    _events[type] = Delegate.Remove(_events[type], onEvent);
                }
            }
        }

        public static void Publish<T>(T eventMessage)
        {
            var type = typeof(T);
            Action<T> action = null;

            lock (_events)
            {
                if (_events.TryGetValue(type, out var currentEvent))
                {
                    action = currentEvent as Action<T>;
                }
            }

            // 데드락 방지를 위해 Invoke는 lock 구문 바깥에서 실행
            action?.Invoke(eventMessage);
        }
    }
}
