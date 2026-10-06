// Low-tier information is already circulating. Higher-tier tips arrive earlier.
// Estimates describe the rumor, not an implemented scheduled price event.
const events = [
    ['coffee_queue', 'MORNINGBREW', '모닝 브루', '유통/소비', '새벽 커피집', 'common', false, '무인 카페의 출근 시간 주문 증가', '골목마다 빈 컵이 쌓였대. 새벽에 콩 볶는 집의 작은 손들이 쉬지 않고 움직인다더라.', '출근길 주문표가 평소보다 길다는 점주 이야기', '이미 소문이 퍼지는 중'],
    ['coffee_repair', 'MORNINGBREW', '모닝 브루', '유통/소비', '새벽 커피집', 'common', true, '카페 로봇 수리 비용 증가', '콩 볶는 집에서 쇳소리가 잦아졌대. 커피 내리는 손보다 고치는 손이 더 바쁘다나.', '여러 매장의 수리 요청이 겹쳤다는 이야기', '이미 소문이 퍼지는 중'],
    ['organic_orders', 'ORGANICTABLE', '오가닉 테이블', '유통/소비', '초록 식탁', 'common', false, '새벽 신선식품 배송 재주문 증가', '초록 식탁에 앉았던 사람들이 또 자리를 잡는대. 빈 바구니가 다음 날 다시 채워진다더라.', '배송 기사들이 같은 주소를 다시 찾는다는 이야기', '다음 집계 전후'],
    ['organic_spoilage', 'ORGANICTABLE', '오가닉 테이블', '유통/소비', '초록 식탁', 'common', true, '냉장 배송 지연으로 인한 폐기 증가', '초록 식탁으로 가던 바구니가 길에서 오래 쉬었대. 도착했을 땐 버려야 할 잎이 많았다나.', '배송 지연과 반품이 늘었다는 현장 이야기', '다음 집계 전후'],
    ['wind_output', 'WINDHILL', '윈드 힐', '에너지', '바람 언덕', 'common', false, '해상 풍력 발전량 증가', '바닷가 언덕의 큰 바람개비가 종일 돌았대. 쉬던 계량기도 덩달아 바빠졌다더라.', '최근 풍속과 가동 시간이 늘었다는 이야기', '다음 발전량 집계'],
    ['wind_shutdown', 'WINDHILL', '윈드 힐', '에너지', '바람 언덕', 'common', true, '터빈 정기 점검에 따른 일시 가동 중단', '언덕의 바람개비 몇 개가 바람을 등지고 쉬고 있대. 고치는 사람들이 올라갔다더라.', '정비 차량과 정지 터빈이 목격됐다는 이야기', '다음 발전량 집계'],
    ['sun_orders', 'SUNLIGHT', '선 라이트', '에너지', '햇빛 간판', 'common', false, '태양광 패널 소규모 추가 주문', '햇빛 담는 판을 찾는 지붕이 조금 늘었대. 작은 주문 봉투가 여러 장 들어왔다더라.', '설치업체의 추가 주문 문의 이야기', '다음 주문 집계'],
    ['sun_returns', 'SUNLIGHT', '선 라이트', '에너지', '햇빛 간판', 'common', true, '패널 초기 불량 반품 증가', '햇빛 담는 판 몇 장이 다시 공장으로 돌아갔대. 밝아야 할 곳이 어둡다고 했다나.', '설치 현장에서 반품 문의가 늘었다는 이야기', '다음 품질 집계'],
    ['bank_deposits', 'SAFEBANK', '세이프 뱅크', '금융', '튼튼한 금고', 'common', false, '정기예금 유입 증가', '튼튼한 금고 앞에 작은 주머니들이 줄을 섰대. 한동안 열지 말아 달라는 손님이 많다더라.', '지점 창구의 정기예금 상담 증가 이야기', '다음 영업 집계'],
    ['loan_arrears', 'GOLDPOCKET', '골드 포켓', '금융', '금빛 주머니', 'common', true, '소상공인 대출 연체 증가', '금빛 주머니에서 나간 동전이 제때 안 돌아온대. 가게 문은 열렸는데 약속 날짜가 자꾸 밀린다더라.', '일부 상권의 상환 지연 이야기', '다음 대출 집계'],
    ['momo_pilot', 'MOMOSOLUTION', '모모 솔루션', 'IT/기술', '돈 세는 작은 비서', 'uncommon', false, 'AI 자산관리 서비스의 은행 시범 도입', '돈 세는 작은 비서가 큰 금고집 면접을 봤대. 아직 정식 출근은 아니지만 시험 자리를 받았다더라.', '시범 도입 담당자의 일정과 테스트 계정 발급', '도입 발표 전'],
    ['patch_audit', 'PATCHWORK', '패치워크', 'IT/기술', '구멍 꿰매는 옷집', 'uncommon', false, '보안 서비스 외부 성능 검증 통과', '구멍 꿰매는 옷집에 검사관이 왔다 갔대. 몇 번 당겨 봐도 실밥이 버텼다고 하더라.', '외부 시험기관의 검증 일정과 통과 제보', '검증 결과 공개 전'],
    ['cable_delay', 'SCONNECT', 'S-커넥트', '인프라', '도시의 긴 실을 잇는 집', 'uncommon', true, '광케이블 공사 인허가 지연', '도시 밑 긴 실을 잇던 사람들이 삽을 내려놨대. 땅은 준비됐는데 도장 하나가 안 내려온다더라.', '일부 공구의 허가 일정 연기와 대기 인력', '공사 일정 수정 발표 전'],
    ['wave_delivery', 'WAVECOMM', '웨이브 통신', '인프라', '파도를 말로 바꾸는 집', 'uncommon', false, '위성 통신 단말 추가 납품', '파도를 말로 바꾸는 집에서 작은 상자가 더 나간대. 먼 하늘과 이야기할 손님이 늘었다더라.', '단말 출하 명세와 추가 설치 일정', '납품 발표 전']
];

export const ORDINARY_RUMORS = events.map(([key, stock, name, sector, alias, rarity, negative, cause, metaphor, evidence, time]) => ({
    id: `item_${key}_rumor`, name: '익명 현장 찌라시', category: 'intel', rarity,
    icon: '📜', quantity: 1, maxStack: 5,
    targetStockId: stock, targetStockName: name, targetSector: sector,
    targetChange: `${negative ? '하락' : '상승'} 가능성 · 폭 미확정`, targetTimeframe: time,
    desc: '현장에 떠도는 소문. 이미 알려진 정황과 아직 확인되지 않은 내용을 구분해 보세요.',
    rumorClues: [
        `${metaphor} ${alias} 얘기라는데 이름은 네가 맞춰봐. 아직 사람들 입을 타는 이야기니까 장부까지 확인해 봐.`,
        `${sector} 쪽 이야기야. ${metaphor} ${negative ? '아래쪽 바람을 걱정하는' : '위쪽 바람을 기대하는'} 눈치지만, 어느 집인지부터 찾아봐.`,
        `${sector}의 ${cause} 소문이야. ${alias}를 찾아봐. ${time}에 확인할 만한 이야기고 ${negative ? '하락' : '상승'} 가능성이 거론돼. 규모는 아직 불분명해.`,
        `${name}의 ${cause} 이야기야. 근거는 ${evidence}래. 확인 시점은 ${time}. ${negative ? '하락' : '상승'} 가능성은 있지만 숫자는 확인되지 않았어.`
    ],
    intelReport: `${name}의 ${cause} 소문이야. ${evidence}가 근거로 꼽혀. ${time}에 추가 확인이 가능할 전망이고 ${negative ? '하락' : '상승'} 가능성이 거론돼. 변동 폭과 진위는 미확정이야.`,
    effects: [`사건: ${cause}`, `근거: ${evidence}`, `확인 시점: ${time} · 변동 폭 미확정`],
    actionType: 'read', actionLabel: '확인하기'
}));

ORDINARY_RUMORS.push({
    id: 'item_cloudberry_contract_reversal_rumor', name: '익명 정보원의 독점 찌라시', category: 'intel', rarity: 'legendary',
    icon: '📜', quantity: 1, maxStack: 1, targetStockId: 'CLOUDBERRY', targetStockName: '클라우드 베리', targetSector: 'IT/기술',
    targetChange: '수주 호재 이후 하락 반전 가능성 · 폭 미확정', targetTimeframe: '계약 발표 이틀 전 · 검수 결과는 발표 다음 날',
    desc: '계약서와 검수 일정의 연결을 다룬 독점 정보. 사건 순서와 조건을 함께 읽어야 합니다.',
    rumorClues: [
        '구름 위 열매 창고가 큰 잔치를 준비한대. 그런데 초대장 뒤에 작은 글씨가 하나 더 있다더라. 축배 다음 날 창고 문을 검사한다나. 문이 안 열리면 잔칫값도 돌아온대. 이틀 남았으니 앞면만 보지 마.',
        'IT 쪽 큰 수주 이야기 뒤에 조건이 붙었대. 구름과 과일 간판의 집이야. 잔치 뒤 검사가 끝나야 돈이 남는다더라. 이틀 뒤 호재가 알려져도 그 다음 날을 같이 봐야 해.',
        'IT 수주 호재 다음에 검수 실패로 하락 반전할 수 있다는 제보야. 구름과 열매 이름의 업체 계약서에 검수 조건과 대금 반환 조항이 붙었대. 계약 발표는 이틀 뒤, 검수 결과는 그 다음 날이래.',
        '클라우드 베리 수주 계약의 검수 조건과 대금 반환 조항을 함께 입수했어. 발표는 이틀 뒤지만 다음 날 검수를 통과해야 해. 내부 시험에서 오류가 있었다는 제보도 있어. 실패하면 호재 뒤 하락 반전 가능성이 있지만 확정은 아니야.'
    ],
    intelReport: '클라우드 베리의 이틀 뒤 수주 발표와 그 다음 날 검수 결과를 함께 봐. 계약서에는 검수 실패 시 대금 반환 조항이 있고, 내부 시험 오류 제보가 있어. 수주 발표는 호재지만 검수 실패가 확인되면 하락 반전할 수 있다는 조건부 정보야. 검수 통과 여부와 변동 폭은 미확정이야.',
    effects: ['계약서: 검수 조건과 대금 반환 조항', '일정: 이틀 뒤 수주 발표 → 다음 날 검수 결과', '반전 조건: 검수 실패 확인 · 확정 수익이나 확정 악재가 아님'],
    actionType: 'read', actionLabel: '확인하기'
});
