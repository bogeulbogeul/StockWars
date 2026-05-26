# StockWars GDD: [MOD_GDD_19_0] IPO 종목 찌라시 라이브러리 인덱스

**버전:** v5.1.0  
**상태:** 번호 체계 재정의 및 섹터별 분할 완료  
**관리 대상:** 상장 대기 종목 풀 (Reserve Pool) 24종의 찌라시 라이브러리

---

## 19-0. IPO 종목 찌라시 시스템 통합 가이드
본 문서는 StockWars의 상장 대기 종목 풀 24종에 대한 찌라시 명세서로 연결되는 통합 인덱스입니다.

### 🔎 찌라시 개요 및 운영 정책
- **대상**: 상장 대기 종목 풀(Reserve Pool) 24종.
- **포맷**: 섹터별 종목 분류 -> 호재/악재 시나리오 -> 3단계 티어 다이얼로그.
- **운영 및 전이 정책 (Maintenance & Transition)**:
    1. **라이브러리 전이**: IPO 종목이 실제로 시장에 상장(Listing)되면, 해당 종목의 찌라시는 **[MOD_GDD_04: 유니버설 찌라시 라이브러리]**로 이동(Migration)됩니다.
    2. **데이터 동기화**: `MOD_GDD_04`에 신규 종목이 추가되면, 상장 폐지(Delisting)되어 시장에서 사라진 기존 종목의 찌라시는 해당 문서에서 **삭제**하여 라이브러리의 총량을 일정하게 유지합니다.
    3. **선순환 구조**: `MOD_GDD_19`는 항상 '대기 중인' 신규 종목의 정보를 담고, `MOD_GDD_04`는 '현재 거래 중인' 종목의 정보를 담는 유동적인 구조를 가집니다.

---

### 📑 섹터별 세부 IPO 찌라시 명세서

| 문서 번호 | 섹터 명칭 | 주요 수록 종목 | 문서 링크 |
| :--- | :--- | :--- | :--- |
| **19-1** | **IT 섹터** | 데이터 스파크, AI 코어, 사이버 링크 | [MOD_GDD_19_1_IPORumor_IT.md](MOD_GDD_19_1_IPORumor_IT.md) |
| **19-2** | **모빌리티 섹터** | 에어 택시, 오빗 링크, 코멧 익스프레스 | [MOD_GDD_19_2_IPORumor_Mobility.md](MOD_GDD_19_2_IPORumor_Mobility.md) |
| **19-3** | **유통 섹터** | 골목 다방, 프레시 마트, 드론 딜리버리 | [MOD_GDD_19_3_IPORumor_Distribution.md](MOD_GDD_19_3_IPORumor_Distribution.md) |
| **19-4** | **에너지 섹터** | 퓨전 코어, 솔라 웨이브, 윈드 블레이드 | [MOD_GDD_19_4_IPORumor_Energy.md](MOD_GDD_19_4_IPORumor_Energy.md) |
| **19-5** | **금융 섹터** | 크립토 노드, 에이아이 인슈어런트, 네오 뱅크 | [MOD_GDD_19_5_IPORumor_Finance.md](MOD_GDD_19_5_IPORumor_Finance.md) |
| **19-6** | **바이오 섹터** | 나노 큐어, 마인드 셋, 바이오 블룸 | [MOD_GDD_19_6_IPORumor_Bio.md](MOD_GDD_19_6_IPORumor_Bio.md) |
| **19-7** | **인프라 섹터** | 하이퍼 루프, 어반 그리드, 스마트 파이프 | [MOD_GDD_19_7_IPORumor_Infrastructure.md](MOD_GDD_19_7_IPORumor_Infrastructure.md) |
| **19-8** | **미디어/아트 섹터** | 아트 뱅크, 미디어 믹스, 메타 패션 | [MOD_GDD_19_8_IPORumor_MediaArts.md](MOD_GDD_19_8_IPORumor_MediaArts.md) |
