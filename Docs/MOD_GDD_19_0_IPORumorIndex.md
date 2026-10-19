# StockWars GDD: [MOD_GDD_19_0] IPO 종목 찌라시 라이브러리 인덱스

> **2026-10-16 대조 결과:** 상장 대기 24종은 소재 원고이며 현재 자동 IPO 풀은 구현되어 있지 않다. Tier 1~3 형식·문서 삭제/이동 지시는 구 설계로 폐기한다. 채택 시 [현행 5단계 작성](RUMOR_AUTHORING_GUIDE.md), ID·종목 매핑·저장 호환을 검토하며 실제 파일을 자동 삭제하지 않는다.

**버전:** v5.1.0
**상태:** 번호 체계 재정의 및 섹터별 분할 완료
**관리 대상:** 상장 대기 종목 풀 (Reserve Pool) 24종의 찌라시 라이브러리

---

## 19-0. IPO 종목 찌라시 시스템 통합 가이드
본 문서는 StockWars의 상장 대기 종목 풀 24종에 대한 찌라시 명세서로 연결되는 통합 인덱스입니다.

### 🔎 찌라시 개요 및 운영 정책
- **대상**: 상장 대기 종목 풀(Reserve Pool) 24종.
- **형식**: 아래 링크는 기존 3단계 소재 원고다. 신규 채택은 해석 5단계로 작성한다.
- **데이터 연결**: 상장·상장폐지에 따른 노출 제어와 보유 정보의 처리는 확장 설계다. 실제 저장·ID·보유 내역을 확인하기 전에 문서·정보를 자동 삭제하지 않는다.

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
