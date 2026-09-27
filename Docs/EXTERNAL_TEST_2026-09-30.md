# 2026-09-30 외부 데모 테스트 준비

대상: 현재 웹 게임의 Windows Electron 설치판, 약 10명.

## 현재 구현 범위

- `Server/presence`는 별도 의존성 없이 실행하는 Node 접속 집계 서버다.
- 앱 실행 시 서버가 발급한 게스트 세션을 사용자 데이터 폴더에 저장한다.
- 같은 Windows 사용자에서 앱은 한 개만 실행한다. 재실행은 기존 세션을 재사용한다.
- 전체 접속자는 실행 중인 앱 세션, 채널 인원은 마을에 들어온 세션이다.
- 연결 확인은 10초 주기, 강제 종료/통신 단절은 마지막 통신 후 30초에 만료된다. 다른 앱의 화면 갱신까지는 추가로 최대 약 13초가 걸릴 수 있다.
- 채널은 실제 `타운 1` 한 개, 정원 50명이다. 가상 인원 및 채널 증설은 없다.
- 계정 인증이 없는 데모다. 다른 PC/Windows 사용자 프로필은 별도 게스트로 집계된다.
- 서버 상태는 메모리에 보관한다. 한 인스턴스로 실행해야 하며 재시작 후 앱이 재등록한다.
- 이 서버는 접속 인원/채널만 담당한다. 현재 웹의 주가·거래·캐릭터 위치를 다른 이용자와 동기화하는 서버는 아니다.

## 로컬 검증

저장소 루트에서:

```powershell
node --test Server/presence/presence.test.mjs web/tests/townBillboardBroadcast.test.mjs
node Server/presence/server.mjs
```

다른 터미널에서:

```powershell
$env:STOCKWARS_PRESENCE_URL = 'http://127.0.0.1:8080'
cd electron-app
npm install
npm run dev
```

외부 주소가 미설정되거나 연결되지 않으면 인원을 추정하지 않고 연결 상태를 표시한다.
브라우저로 파일만 열면 Electron 통신 모듈이 없으므로 실제 인원 집계를 사용할 수 없다.

## 공용 서버 배포 (Render 예시)

계정과 저장소 접근 권한을 가진 사용자가 Render에서 Web Service를 생성한다.
저장소 루트의 `render.yaml`을 Blueprint로 선택해도 같은 설정을 적용할 수 있다.
2026-09-28 Render 무료 플랜, Singapore 리전에 배포 완료했다. 주소는 https://stockwars-demo-presence.onrender.com 이다. 배포 브랜치는 `codex/demo-presence`, 커밋은 `774a8a0`이다.

| 항목 | 값 |
|---|---|
| 저장소 | 이 변경이 포함된 StockWars 저장소/브랜치 |
| Root Directory | `Server/presence` |
| Runtime | Node |
| Build Command | `node --check server.mjs` |
| Start Command | `node server.mjs` |
| 환경 변수 | `HOST=0.0.0.0`, `NODE_VERSION=24` |
| PORT | 호스팅 서비스가 제공하는 값 사용 |
| Health Check | `/health` |
| 인스턴스 수 | 1 |

배포된 HTTPS 주소에서 `/health`를 열어 `{"status":"ok"}` 응답을 확인한다.
서비스 플랜과 비용은 생성 화면에서 확인한다. 자동 휴면 플랜이라면 테스트 전에 서버를 깨우고 연결을 확인한다.

공식 안내: https://render.com/docs/web-services, https://render.com/docs/health-checks

## 설치 파일 생성

`electron-app/server-config.json`의 `presenceUrl`에 배포된 HTTPS 주소를 넣는다.
로컬 주소를 넣은 설치 파일을 외부 테스터에게 전달하면 안 된다.

```powershell
cd electron-app
npm run dist
```

결과: `electron-app/dist/StockWars Demo Setup 1.0.0.exe`.
현재 앱 실행을 방해하지 않도록 최신 검증 빌드는 `electron-app/dist-verified/StockWars Demo Setup 1.0.0.exe`에 별도 생성했다.
최신 dist-verified 설치 파일에는 위 공용 Render HTTPS 주소가 포함된다.
설치 후에는 실행 파일 옆 `resources/server-config.json`에서도 주소를 바꿀 수 있으며, 앱 재시작 시 반영된다.
현재 로컬 검증에 쓰는 `dist/win-unpacked` 폴더만 `http://127.0.0.1:8080`으로 설정했다.
이전 dist 설치 파일은 주소 미설정 빌드이므로 배포하지 않는다. dist-verified 설치 파일을 전달한다.
인증서가 없는 서명되지 않은 테스트 설치판이며, Windows에서 게시자 확인 경고가 나올 수 있다.
서버 토큰은 설치 파일에 넣지 않는다. 앱 최초 접속 시 발급하며 Electron 메인 프로세스만 접근한다.

## 배포 전 실제 기기 확인

- [x] HTTPS 서버 주소와 `/health` 확인
- [x] 주소를 넣고 설치 파일 재생성
- [ ] 다른 네트워크의 Windows PC에서 설치 및 실행
- [ ] 두 PC 동시 실행 시 총 인원 2명, 각자 마을 입장 시 채널 인원 증가
- [ ] 한 PC 오피스 복귀 시 채널 인원만 감소
- [ ] 앱 종료 시 총 인원 감소, 강제 종료 시 30초 후 감소
- [ ] 중복 실행 및 재실행 시 인원이 부풀지 않음
- [ ] 인터넷 단절 시 집계 대기, 복구 후 재연결
- [ ] 타이틀 → 캐릭터 생성 → 오피스 → 마을 → 비트물류 → 복귀 확인
- [ ] 최종 설치 파일의 버전/해시와 테스터에게 보낸 파일 일치 확인

자동 검증: 10개 HTTP 클라이언트 동시 입장, 세션 재사용, 퇴장, 만료, 서버 재시작,
정원 초과 거절, 잘못된 요청, 연결 실패 표시를 테스트한다. 실제 10대 기기 테스트를 대체하지 않는다.

실행 검증: 패키징된 Windows 앱의 타이틀/게임 화면 로딩과 로컬 서버를 통한 `타운 1` 입장 확인.
공용 HTTPS 서버에서 두 임시 클라이언트 입장(2명), 한 클라이언트 퇴장(1명), 모두 연결 해제를 검증했다. 다른 PC에서 일반 Windows 설치 절차와 앱 연결은 아직 검증하지 않았다. 무료 서버는 휴면 후 첫 요청이 50초 이상 지연될 수 있으므로 테스트 전에 /health 응답을 확인한다.


최종 설치 파일 SHA256: `B1677D4B0566E06FC496CCD07F58AA37FF1DA5F2B1C8E4E82AFB7BE61D612976`. 자동 테스트 7개 통과.

