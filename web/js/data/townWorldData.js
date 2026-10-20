/**
 * Town World Geometry & Static Definitions
 * Contains canonical building specifications, interactive props, street decoration assets.
 */

import { applyBuildingAsset } from './townBuildingAssets.js';
import { TOWN_PROP_POSITIONS, TOWN_LAMP_POSITIONS, TOWN_TREE_POSITIONS, TOWN_BUILDING_DEPTH, TOWN_PROP_BASE_Y, TOWN_SCENERY_ENABLED } from './townLayout.js';

export const TOWN_BUILDINGS = [
    {
        id: 'home_office_tower',
        name: '홈 오피스텔',
        sign: '홈 오피스텔',
        category: '레지던스',
        icon: '🏢',
        width: 280,
        height: 350,
        colorTheme: 'home-officetel',
        desc: '파트너 모아가 상주하는 나만의 오피스텔 펜트하우스 트레이딩 룸입니다.',
        actionText: '내 오피스 들어가기',
        isOfficetel: true
    },
    {
        id: 'vivian_store',
        name: '봉봉 잡화점',
        sign: '봉봉 잡화점',
        category: '잡화 / 소모품',
        icon: '🏪',
        width: 240,
        height: 210,
        colorTheme: 'green',
        desc: '에너지 드링크(기력 회복) 및 데모 편의 소모품 구매 (상점주 봉봉)',
        actionText: '잡화점 입장'
    },
    {
        id: 'julian_furniture',
        available: false,
        name: '모던 프레임 가구점',
        sign: '모던 프레임',
        category: '가구 / 인테리어',
        icon: '🛋️',
        width: 250,
        height: 230,
        colorTheme: 'amber',
        desc: '8x8 오피스 맞춤형 가구, 책상 및 인테리어 데코 쇼룸 (디자이너 우디 & 레오)',
        actionText: '가구점 입장'
    },
    {
        id: 'claire_apparel',
        available: true,
        name: '살롱 드 테일',
        sign: '살롱 드 테일',
        category: '그루밍 / 스타일',
        icon: '🪮',
        width: 240,
        height: 230,
        colorTheme: 'magenta',
        desc: '동물 트레이더의 완성형 스타일을 미리 보고 선택하는 그루밍 살롱입니다. 스타일리스트 보니가 맞이하는 살롱 내부를 둘러보세요.',
        actionText: '살롱 입장'
    },
    {
        id: 'data_ink_bookstore',
        available: false,
        name: '데이터 잉크 서점',
        sign: '데이터 잉크',
        category: '서점 / 지식',
        icon: '📚',
        width: 240,
        height: 220,
        colorTheme: 'indigo',
        desc: '영구 스탯 강화 전문 도서 및 섹터별 인사이트 리포트 (사서 소담)',
        actionText: '서점 입장'
    },
    {
        id: 'cipher_securities',
        name: '사이퍼 증권 본점',
        sign: '사이퍼 증권',
        category: '금융 / 트레이딩',
        icon: '🏛️',
        width: 440,
        height: 360,
        isMainLandmark: true,
        colorTheme: 'violet',
        desc: '중앙 거대 객장, 실시간 전광판 틱 시세판, 아레나 배틀룸 및 서밋 라운지 (토리)',
        actionText: '증권사 객장 입장'
    },
    {
        id: 'node_finance',
        available: false,
        name: '노드 파이낸스 은행',
        sign: '노드 파이낸스',
        category: '은행 / 금융',
        icon: '🏦',
        width: 300,
        height: 260,
        colorTheme: 'blue',
        desc: '4주 정기 적금, 긴급 신용 대출 및 부채 자산 관리 (지점장 차곡)',
        actionText: '은행 창구 이용'
    },
    {
        id: 'midnight_pub',
        available: false,
        name: '미드나잇 펍',
        sign: '미드나잇 펍',
        category: '사교 / 정보',
        icon: '🍸',
        width: 260,
        height: 230,
        colorTheme: 'purple',
        desc: '확정형 고급 찌라시 정보 거래, 지하 정통 블랙잭 테이블 (브로커 도란)',
        actionText: '펍 입장'
    },
    {
        id: 'barter_pawn_shop',
        name: '바터 전당포',
        sign: '바터 전당포',
        category: '전당포 / 교환',
        icon: '🪙',
        width: 240,
        height: 280,
        colorTheme: 'amber',
        desc: '보유한 가구와 주식의 가치를 상담하고 담보를 통해 필요한 자금을 마련하는 전당포입니다. 전당포주 바터가 거래 공간을 준비하고 있어요.',
        actionText: '개점 준비 중',
        available: false
    }
].map(applyBuildingAsset).map(building => ({
    ...building, depth: TOWN_BUILDING_DEPTH * building.layoutScale
}));

export const TOWN_PROP_DEFINITIONS = [
    {
        id: 'bench_west',
        type: 'bench',
        name: '서부 공원 힐링 벤치',
        icon: '🪑',
        x: 1590,
        width: 150,
        height: 63.35,
        desc: '도심 속 녹음이 어우러진 휴식 공간입니다. 잠시 앉아 피로와 기력/체력을 100% 충전할 수 있습니다.',
        actionText: '벤치에 앉아 체력 회복'
    },
    {
        id: 'bench_east',
        type: 'bench',
        name: '동부 광장 쉼터 벤치',
        icon: '🪑',
        x: 4130,
        width: 150,
        height: 63.35,
        desc: '증권가와 은행가 사이 위치한 휴식 벤치입니다. 지친 트레이더들의 체력과 기력을 빠르게 회복시킵니다.',
        actionText: '벤치에 앉아 체력 회복'
    }
].map(prop => ({ ...prop, x: TOWN_PROP_POSITIONS[prop.id], y: TOWN_PROP_BASE_Y }));

export const TOWN_INTERACTIVE_PROPS = TOWN_SCENERY_ENABLED ? TOWN_PROP_DEFINITIONS : [];
export const TOWN_STREET_LAMPS = TOWN_SCENERY_ENABLED ? TOWN_LAMP_POSITIONS : [];
export const TOWN_URBAN_TREES = TOWN_SCENERY_ENABLED ? TOWN_TREE_POSITIONS : [];
