using System;
using System.Collections;
using System.Collections.Generic;

namespace StockWars.Core
{
    /// <summary>
    /// 최근 N개 원소를 보관하며, 용량 초과 시 오래된 데이터를 덮어쓰는 고성능 순환 버퍼.
    /// RemoveAt(0)과 같이 가비지를 유발하고 모든 요소를 시프트하는 연산 없이 O(1)로 원소를 추가합니다.
    /// 구조체 Enumerator를 통해 foreach 순회 시 GC 할당(Zero Allocation)을 실현합니다.
    /// </summary>
    public class CircularBuffer<T> : IReadOnlyList<T>
    {
        private readonly T[] _buffer;
        private int _head;
        private int _tail;
        private int _count;

        /// <summary>
        /// 버퍼의 최대 용량
        /// </summary>
        public int Capacity => _buffer.Length;

        /// <summary>
        /// 현재 버퍼에 담긴 원소 수
        /// </summary>
        public int Count => _count;

        public CircularBuffer(int capacity)
        {
            if (capacity <= 0)
                throw new ArgumentException("Capacity must be greater than zero.", nameof(capacity));
            _buffer = new T[capacity];
            Clear();
        }

        /// <summary>
        /// 버퍼의 모든 데이터를 초기화합니다.
        /// </summary>
        public void Clear()
        {
            _head = 0;
            _tail = 0;
            _count = 0;
            Array.Clear(_buffer, 0, _buffer.Length);
        }

        /// <summary>
        /// 버퍼에 단일 요소를 추가합니다. 용량 초과 시 가장 오래된 요소를 덮어씁니다.
        /// </summary>
        public void Add(T item)
        {
            if (_count == Capacity)
            {
                // 버퍼가 꽉 찬 경우 가장 오래된 원소(head) 위치에 덮어쓰고 포인터를 이동합니다.
                _buffer[_head] = item;
                _head = (_head + 1) % Capacity;
                _tail = (_tail + 1) % Capacity;
            }
            else
            {
                _buffer[_tail] = item;
                _tail = (_tail + 1) % Capacity;
                _count++;
            }
        }

        /// <summary>
        /// 여러 요소를 버퍼에 연속적으로 추가합니다.
        /// </summary>
        public void AddRange(IEnumerable<T> items)
        {
            if (items == null) return;
            foreach (var item in items)
            {
                Add(item);
            }
        }

        /// <summary>
        /// 논리적 인덱스로 원소에 접근합니다. (0 = 가장 오래된 원소, Count - 1 = 가장 최근 원소)
        /// </summary>
        public T this[int index]
        {
            get
            {
                if (index < 0 || index >= _count)
                    throw new ArgumentOutOfRangeException(nameof(index), "Index is out of range.");
                
                int actualIndex = (_head + index) % Capacity;
                return _buffer[actualIndex];
            }
        }

        /// <summary>
        /// GC(가비지 컬렉션) 힙 할당을 방지하기 위한 구조체 열거자를 반환합니다.
        /// </summary>
        public Enumerator GetEnumerator()
        {
            return new Enumerator(this);
        }

        IEnumerator<T> IEnumerable<T>.GetEnumerator()
        {
            return new Enumerator(this);
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return new Enumerator(this);
        }

        /// <summary>
        /// 버퍼에 담긴 원소들을 오래된 순서대로 정렬된 리스트로 반환합니다. (저장 DTO 연동용)
        /// </summary>
        public List<T> ToList()
        {
            List<T> list = new List<T>(_count);
            for (int i = 0; i < _count; i++)
            {
                list.Add(this[i]);
            }
            return list;
        }

        /// <summary>
        /// GC 방지를 위한 가벼운 구조체(Struct) Enumerator 정의
        /// </summary>
        public struct Enumerator : IEnumerator<T>
        {
            private readonly CircularBuffer<T> _buffer;
            private int _index;

            internal Enumerator(CircularBuffer<T> buffer)
            {
                _buffer = buffer;
                _index = -1;
            }

            public T Current => _buffer[_index];
            object IEnumerator.Current => Current;

            public bool MoveNext()
            {
                _index++;
                return _index < _buffer.Count;
            }

            public void Reset()
            {
                _index = -1;
            }

            public void Dispose() { }
        }
    }
}
