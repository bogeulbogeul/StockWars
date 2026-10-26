// Short exhibition dialogue. Gameplay actions and their order stay unchanged.
export function shortenDemoDialogue(plan, order) {
    const result = []; let previous = 'start';
    const script = {
        '1/arrival/start': [['모아', '아, 도착하셨네요. 포포리에 오신 걸 환영해요.']],
        '2/arrival/start': [['모아', '저는 정착 안내를 맡은 모아예요. 안내소에서 입주를 도와드릴게요.']],
        '4/information/walk': [['모아', '신청서에 이름을 적어주세요. 태어난 소망은 아직 몰라도 괜찮아요.']],
        '4/information/nickname': [['모아', '반가워요, [닉네임]님. 이제 포포리의 주민이 되셨어요.']],
        '5/information/nickname': [['모아', '이 휴대폰도 받아주세요. 지도와 소식, 계좌를 확인할 수 있어요.']],
        '5/information/openPhone': [['모아', '도움이 필요하면 휴대폰으로 연락해주세요. 제 연락처도 넣어뒀어요.']],
        '9/home/openPhone': [['소망이', '여기가 내 집이구나.'], ['모아', '어떤 집으로 꾸밀지는 천천히 생각해봐요.']],
        '6/home/openPhone': [['소망이', '가져온 건 씨앗과 편지뿐인데, 생활비는 어떻게 하지?'], ['모아', '먼저 은행에서 상담받아봐요. 일자리도 소개해드릴게요.']],
        '7/bank/openPhone': [['차곡', '어서 오세요. 생활에 쓸 잎을 보관할 계좌부터 만들어드릴게요.']],
        '7/bank/bank': [['차곡', '계좌가 준비됐습니다. 정착 대출은 5,000잎이에요.'], ['차곡', '나중에 갚아야 하는 돈입니다. 조건을 읽고 결정해주세요.']],
        '7/bank/loan': [['차곡', '5,000잎을 입금했습니다. 꼭 필요한 생활비는 따로 남겨두세요.']],
        '8/bankOutside/loan': [['모아', '잡화점에서는 포장 알바를, 증권사에서는 주식을 배울 수 있어요.']],
        '9/bankOutside/order': [['소망이', order === 'stock' ? '주식 투자가 어떤 건지 배워보고 싶어.' : '먼저 잡화점 일을 해볼래.'], ['모아', '위치는 휴대폰 지도에서 확인하세요. 저는 포포리 나무 아래 벤치에서 기다릴게요. 둘 다 해보고 와주세요.']],
        '11/store/packing': [['봉봉', '깔끔하게 잘 담았네요! 약속한 300잎이에요.']],
        '11/store/wage': [['소망이', '내가 직접 번 잎이네.'], ['봉봉', '이 소식봉투도 가져가세요. 손님이 맡기고 갔어요.']],
        '11/store/envelope': [['소망이', '어떤 소식일까? 모아에게 물어봐야겠다.']],
        '12/bench/envelope': [['모아', '일은 어땠어요? 손에 든 봉투도 한번 열어볼까요?']],
        '12/bench/rumor': [['모아', '소문은 틀릴 수도 있어요. 회사 정보와 함께 살펴보세요.'], ['모아', order === 'packing' ? '이제 증권사에서 토리에게 배워보세요.' : '두 가지 활동을 모두 마쳤네요. 잠깐 쉬어가요.']],
        '14/stock/stockCounter': [['토리', '주식 계좌를 만들기 전에 확인 문제 세 개입니다.'], ['토리', '자료를 읽고 답해주세요. 정답 수와 관계없이 자격증을 드립니다.']],
        '13/stock/certificate': [['토리', '회사의 작은 지분을 사는 것이 주식입니다. 가격이 내려가면 손해를 볼 수 있죠.'], ['토리', '컴퓨터 앞에 앉아 컴퓨터를 켜 주세요. 회사 정보부터 확인하겠습니다.']],
        '15/bench/tradeHistory': [['모아', '첫 투자는 어땠어요? 이번에는 잡화점 일도 해볼까요?']],
        '16/bench/tradeHistory': [['모아', '직접 벌어보고, 투자도 해보셨네요. 어떤 하루였어요?'], ['소망이', '아직 낯설지만, 조금은 알 것 같아.']],
        '16/bench/sunset': [['모아', '처음부터 다 알 필요는 없어요. 쿠키 하나 먹고 쉬어요.']],
        '16/bench/cookie': [['소망이', '맛있다. 다음에는 내가 번 잎으로 사 먹어야지.']],
        '17/bench/cookie': [['모아', '정착 지원금 2,000잎도 받아주세요. 대출과 달리 갚지 않아도 돼요.']],
        '17/bench/grant': [['모아', '그리고 오늘을 기록할 다이어리예요.']],
        '17/bench/diary': [['모아', '오늘 기억하고 싶은 일을 남겨보세요. 쿠키 이야기부터 써도 좋아요.']],
        '18/bench/diary': [['소망이', '아, 가져온 씨앗도 심어야겠다.'], ['모아', '봉봉에게 화분을 물어보세요. 오늘은 푹 쉬고, 내일 또 봐요.']],
        '19/store/moaReturn': [['소망이', '이 씨앗을 심을 화분이 필요해.'], ['봉봉', '이 화분은 100잎이에요. 어떤 싹이 날지 궁금하네요!']],
        '19/store/pot': [['소망이', '잘 자라면 보여줄게.']],
        '19/storeOutside/pot': [['소망이', '하아암…… 이제 집에 가서 쉬어야겠어.']],
        '20/home/pot': [['소망이', '다녀왔어. 씨앗부터 심어볼까?']],
        '20/home/planted': [['소망이', '여기서 잘 자라면 좋겠다. 오늘 일도 적어둬야지.']]
    };
    for (let i = 0; i < plan.length;) {
        const first = plan[i];
        if (first.kind === 'action') { previous = first.id; result.push(first); i++; continue; }
        let end = i + 1;
        while (end < plan.length && plan[end].kind === 'line' && plan[end].place === first.place
            && plan[end].chapter === first.chapter && !first.mapIntro && !plan[end].mapIntro
            && !first.packingOffer && !plan[end].packingOffer) end++;
        let lines = script[`${first.chapter || 'none'}/${first.place}/${previous}`];
        if (first.packingOffer) lines = [['봉봉', '상자 3개를 포장하면 300잎이에요. 시작해볼까요?']];
        else if (first.chapter === 11 && previous === 'notice') lines = first.text.includes('해볼게')
            ? [['소망이', '좋아. 해볼게.']]
            : [['봉봉', '어서 와요! 물건을 상자에 담는 일을 도와주실래요?']];
        else if (first.chapter === 13 && previous !== 'certificate') lines = [['토리', '토리입니다. 먼저 안내데스크에서 투자 자격증을 받아주세요.']];
        else if (!first.chapter && !first.mapIntro && first.place === 'information')
            lines = [['모아', '집을 잠깐 살펴본 뒤 은행으로 가볼까요?']];
        else if (!first.chapter && first.place === 'bankOutside')
            lines = [['모아', '어느 쪽부터 해볼까요?']];
        if (!lines) result.push(...plan.slice(i, end));
        else lines.forEach(([speaker, text], index) => {
            const beat = { ...first, speaker, text };
            if (index) { delete beat.plazaTalk; delete beat.trainingLesson; }
            result.push(beat);
        });
        i = end;
    }
    return result;
}
