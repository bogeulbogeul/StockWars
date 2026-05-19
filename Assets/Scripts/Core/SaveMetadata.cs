using System;

namespace StockWars.Core
{
    /// <summary>
    /// 세이브 파일의 메타데이터 (플레이 타임, 타임스탬프, 위치 등)
    /// 세이브 슬롯 목록을 표시할 때 전체 데이터를 로드하지 않고 메타데이터만 빠르게 읽기 위해 분리합니다.
    /// </summary>
    [Serializable]
    public class SaveMetadata
    {
        /// <summary>총 플레이 시간 (초 단위)</summary>
        public float TotalPlayTime { get; set; }
        
        /// <summary>최종 저장 일시 (타임존 이슈 방지를 위해 DateTime.UtcNow 사용 권장)</summary>
        public DateTime LastSaveTime { get; set; }
        
        /// <summary>최종 접속 위치 (씬 이름 또는 구역 ID)</summary>
        public string LastLocation { get; set; }
        
        /// <summary>앱 버전 (마이그레이션 및 호환성 체크용)</summary>
        public string AppVersion { get; set; } = "1.0.0";
    }
}
