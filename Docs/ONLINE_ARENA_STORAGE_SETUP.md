# 온라인 모의투자와 유저 기록 보존 설정

현재 코드: 온라인 방 생성/검색, 친구 접속 상태/초대, 준비/시작, 서버 가격/주문/시간/순위. AI 모드는 별도로 유지한다.
클라이언트 저장과 접속 토큰을 삭제하는 업데이트 코드는 제거했다. 서버의 기존 닉네임 파일 삭제도 제거했다.

## 무료 Supabase 프로젝트 연결

1. https://supabase.com/dashboard 에 로그인하고 Free 조직의 새 프로젝트를 만든다. 유료 플랜을 선택하지 않는다.
2. SQL Editor에서 `Server/presence/supabase-schema.sql`을 실행한다.
3. 프로젝트 설정의 URL과 서버 전용 Secret key를 Render 환경 변수 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`에 설정한다. 키는 채팅, Git, 설치 파일, 브라우저 코드에 넣지 않는다.
4. **기존 기록을 먼저 백업·이관한다.** 현재 운영 서버의 `data/player-names-alpha-reset-v1.json`과 `.social` 파일을 보존한다. 새 배포 전에 이 파일에 접근할 수 있는 경로를 확보해야 한다. 빈 DB로 바로 재배포하지 않는다. Free Render의 로컬 파일은 배포에 따라 사라질 수 있다.
5. 백업 파일이 확보된 환경에서 `node import-player-records.mjs <닉네임 백업 파일>`을 실행한다. 두 파일이 모두 없으면 이관을 중단한다. DB에 이미 기록이 있으면 덮어쓰지 않는다.
6. 연결/이관 확인 후 서버를 배포한다. `/health`의 `durableStorage`가 `supabase`, `onlineArena`가 `true`인지 확인한다.

친구, 닉네임 소유 토큰, 선물 보관함, 선물 일일 한도, 모의투자 결과가 DB에 저장된다. 진행 중인 대결은 서버 재시작 시 종료되며, 플레이어 기록은 삭제되지 않는다. 단일 서버 인스턴스를 사용한다.

Supabase Free는 프로젝트당 500 MB DB를 제공하며 낮은 활동이 7일 이어지면 프로젝트가 일시중지될 수 있다. 일시중지 시 대시보드에서 재개한다.
공식 자료: https://supabase.com/docs/guides/platform/billing-on-supabase , https://supabase.com/docs/guides/platform/free-project-pausing

## 검증

`node --test Server/presence/*.test.mjs web/tests/bubblePlayerChat.test.mjs web/tests/friendGifts.test.mjs`
`node scratch/verify-online-arena.cjs`

현재 로컬 API와 두 브라우저 클라이언트 통합 검증이 통과했다. 실제 무료 DB 연결과 운영 기록 백업은 아직 완료되지 않아 서버 배포를 보류한다.