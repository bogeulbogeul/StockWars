# 기본 캐릭터 꼬리

몸과 기본 프레임은 강아지 directions-v4 / 고양이 v4 그대로 유지. GPT built-in imagegen으로 종별 투명 꼬리 PNG를 생성하고 SVG/Canvas에서 별도 합성했다. 프롬프트는 web/assets/characters/tails-v1/*-prompt.txt에 저장했다. Pillow는 alpha bbox 측정에만 사용했고 원본 PNG를 편집하지 않았다. 렌더와 원본의 종횡비를 유지한다.

preview.html: 외부 파일 없이 꼬리 포함 SVG 모션 확인. tail-qa.png: 게임 SVG 함수로 옆 걷기 / 뒤 걷기 / 옆 앉기를 정적으로 렌더한 확인 그림. Browser Use의 file URL 보안 제한 때문에 자동 브라우저 검사는 진행하지 않았고, 정적 렌더와 코드 테스트로 확인했다. 실제 룸의 가구/화물 가림은 후속 확인 대상이다. 꼬리만 별도 파츠이며 전체 캐릭터 본 리그 완성을 뜻하지 않는다.
