# StockWars GDD: MOD_GDD_07. 다이얼로그 시스템 통합 관리 (Dialogue System)

**버전:** v3.0.0 (문서 분리 및 관리 체계 최적화본)  
**상태:** **분리 관리 중**

---

## 📂 문서 분리 안내
다이얼로그 데이터의 방대해진 분량과 안나(Anna)의 페르소나 확장을 위해 본 문서는 아래의 두 개 파일로 분리되어 관리됩니다.

### 1. [MOD_GDD_07_1. 안나 사이퍼 다이얼로그](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/MOD_GDD_07_1_Dialogue_Anna.md)
- **주요 내용**: 안나의 상황별 대사, 일일 브리핑, 신뢰도 및 서약 관련 내러티브 대사 전담.
- **용도**: 안나의 캐릭터성 확장 및 메인 스토리라인 대사 관리.

### 2. [MOD_GDD_07_2. 타운 NPC 다이얼로그](file:///c:/Users/Administrator/Documents/GitHub/StockWars/Docs/MOD_GDD_07_2_Dialogue_Town.md)
- **주요 내용**: 샤일록, 바터, 안드레, 소피아 등 타운 내 모든 기능성 NPC들의 특수 대사 집합.
- **용도**: 시설 이용 및 미니게임, 정보 거래 시의 상호작용 대사 관리.

---

## 🛠️ 통합 관리 원칙
1. **용어 통일**: 모든 다이얼로그는 확정된 4대 용어(**글로벌 사이퍼, 선물 지수, 시장, 증시**)를 반드시 준수합니다.
2. **ID 체계**: 
   - 안나 관련: `ANN_`, `BRIEF_`
   - 타운 NPC: `SHYLOCK_`, `BARTER_`, `ANDRE_`, `PARK_`, `SOPHIA_` 등 NPC 명칭 기반.
3. **업데이트 절차**: 신규 NPC 추가나 안나의 스토리 확장 시 해당되는 개별 문서를 먼저 업데이트한 후, 본 인덱스 문서의 버전을 갱신합니다.
