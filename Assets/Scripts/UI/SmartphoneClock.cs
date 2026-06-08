using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace StockWars.UI
{
    /// <summary>
    /// 스마트폰 상단 상태바의 시간 표시를 실시간으로 업데이트해주는 컴포넌트입니다.
    /// 일반 Legacy Text와 TextMeshPro를 모두 지원합니다.
    /// </summary>
    public class SmartphoneClock : MonoBehaviour
    {
        private Text _legacyText;
        private TMP_Text _tmpText;

        private void Awake()
        {
            _legacyText = GetComponent<Text>();
            _tmpText = GetComponent<TMP_Text>();
        }

        private void Update()
        {
            // "HH:mm" 형태로 포맷팅 (예: 오후 1시 25분 -> 13:25)
            string timeString = DateTime.Now.ToString("HH:mm");

            if (_legacyText != null)
            {
                _legacyText.text = timeString;
            }
            
            if (_tmpText != null)
            {
                _tmpText.text = timeString;
            }
        }
    }
}
