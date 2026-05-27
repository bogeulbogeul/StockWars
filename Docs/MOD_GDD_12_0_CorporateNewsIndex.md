# StockWars GDD: [MOD_GDD_12_0] 기업 뉴스 이벤트 시스템 인덱스 (Corporate News Events Index)

**버전:** v2.5.0 (종목 리스트 전체 확장 완료)  
**상태:** 번호 체계 재정의 및 섹터별 분할 완료 (총 96개 종목 완비)  
**핵심 기획:** 상장 및 대기 종목(총 96개) 통합 뉴스 라이브러리. 상장 상태에 따른 뉴스 노출 제어.

---

## 12-0. 기업 뉴스 시스템 통합 가이드
본 문서는 StockWars의 상장 및 대기 종목(총 96개) 통합 뉴스 라이브러리 명세서로 연결되는 통합 인덱스입니다.

### 1. 뉴스 트리거 및 생성 규칙 (Generation Rules)

#### 1.1. 뉴스 발생 조건 (Activation Criteria)
뉴스 엔진은 아래 조건에 부합하는 종목에 대해서만 시나리오를 호출합니다.

- **상장 주식 (Active)**: `CORE_GDD_02`의 상장 테이블(72개 슬롯)에 등록된 종목은 모든 유형(일반, 핵심, 대형사고)의 뉴스가 랜덤하게 발생할 수 있습니다.
- **대기 종목 (Pool)**: 상장 대기 종목 풀에 있는 24개 종목은 기본적으로 **'뉴스 발생 비활성'** 상태입니다. 
    - 이들은 상장 프로세스([MOD_GDD_10])가 시작되어 상장 테이블로 **마이그레이션된 시점부터** 본 문서의 뉴스 데이터를 사용하기 시작합니다.
    - 예외: 상장 직전의 '공모 청약', '상장 예고' 뉴스는 본 시스템이 아닌 IPO 전용 프로세스에서 별도로 관리합니다.

#### 1.2. 데이터 상속 로직
- 종목이 IPO 풀에서 상장 테이블로 이동하면, 해당 종목 이름으로 본 문서의 뉴스 라이브러리가 즉시 매칭되어 활성화됩니다.

---

### 📑 섹터별 세부 기업 뉴스 명세서

| 문서 번호 | 섹터 명칭 | 상장 종목 수 (Active + IPO Pool) | 주요 수록 종목 | 문서 링크 |
| :--- | :--- | :---: | :--- | :--- |
| **12-1** | **IT 섹터** | 12개 | 클라우드 베리, 시냅스 망, 테크 돔, 모모 솔루션 등 | [MOD_GDD_12_1_CorporateNews_IT.md](MOD_GDD_12_1_CorporateNews_IT.md) |
| **12-2** | **엔터 섹터** | 12개 | 스타더스트, 로열 미디어, 시네마 홀릭, 스튜디오 루나 등 | [MOD_GDD_12_2_CorporateNews_Entertainment.md](MOD_GDD_12_2_CorporateNews_Entertainment.md) |
| **12-3** | **인프라 섹터** | 12개 | S-커넥트, 메트로 링크, 글로벌 루트, 에어 링크 등 | [MOD_GDD_12_3_CorporateNews_Infrastructure.md](MOD_GDD_12_3_CorporateNews_Infrastructure.md) |
| **12-4** | **바이오 섹터** | 12개 | 포레스트 랩, 화이트 메디, 퓨어 사이언스, 뉴런 바이오 등 | [MOD_GDD_12_4_CorporateNews_Bio.md](MOD_GDD_12_4_CorporateNews_Bio.md) |
| **12-5** | **항공우주 섹터** | 12개 | 윙스 로직스, 스카이 넷, 에어 캐리어, 블루 스카이 등 | [MOD_GDD_12_5_CorporateNews_Aerospace.md](MOD_GDD_12_5_CorporateNews_Aerospace.md) |
| **12-6** | **유통 섹터** | 12개 | 모닝 브루, 에브리 마트, 리테일 프로, 오가닉 테이블 등 | [MOD_GDD_12_6_CorporateNews_Distribution.md](MOD_GDD_12_6_CorporateNews_Distribution.md) |
| **12-7** | **에너지 섹터** | 12개 | 윈드 힐, 솔라 퓨처, 아쿠아 에너지, 선 라이트 등 | [MOD_GDD_12_7_CorporateNews_Energy.md](MOD_GDD_12_7_CorporateNews_Energy.md) |
| **12-8** | **금융 섹터** | 12개 | 코지 페이, 세이프 뱅크, 로열 캐피탈, 민트 자산운용 등 | [MOD_GDD_12_8_CorporateNews_Finance.md](MOD_GDD_12_8_CorporateNews_Finance.md) |
