# SuperSave

실시간 병상 기반 응급실 매칭 및 AI 의사결정 지원 시스템 MVP입니다.  
현재 구조는 `frontend` React/Vite 앱과 `backend` Spring Boot REST API로 나뉘어 있으며, 개발 중에는 분리 실행하고 배포 또는 통합 실행 시에는 스프링부트가 프론트 정적 파일도 함께 서빙합니다.

## 아키텍처

- `frontend`: React + TypeScript + Vite + Tailwind CSS
- `backend`: Spring Boot + Java + REST API
- 데이터 전략: 기본은 mock repository / mock API
- 확장 포인트:
  - 공공데이터 응급실 API 연동
  - Kakao Map 시각화 연동
  - Gemini API 기반 추천 이유 설명 및 질의응답 고도화
  - MySQL/JPA 실제 영속화

## 폴더 구조

```text
supersave/
├─ backend/
│  ├─ src/main/java/com/supersave/backend/
│  │  ├─ ai/
│  │  ├─ alert/
│  │  ├─ common/
│  │  ├─ departure/
│  │  ├─ hospital/
│  │  └─ recommendation/
│  ├─ src/main/resources/
│  └─ pom.xml
├─ frontend/
│  ├─ src/api/
│  ├─ src/components/
│  ├─ src/data/
│  ├─ src/hooks/
│  ├─ src/pages/
│  ├─ src/types/
│  ├─ src/utils/
│  └─ package.json
└─ README.md
```

## 구현 범위

- 홈 페이지
- 응급실 검색/추천 페이지
- 병원 상세 페이지
- 출발 등록/가상 예약 페이지
- AI 응급 가이드 페이지
- 긴급 알림 페이지

## REST API 초안

- `GET /api/hospitals`
- `GET /api/hospitals/{id}`
- `POST /api/recommendations`
- `POST /api/departures`
- `POST /api/ai/guide`
- `GET /api/alerts`

## 실행 방법

### 1. 통합 실행

```bash
./scripts/sync-frontend-to-backend.sh
cd backend
mvn spring-boot:run
```

- 접속 주소: `http://127.0.0.1:8080`
- 스프링부트가 프론트 정적 파일과 백엔드 API를 함께 처리

### 2. 백엔드만 실행

```bash
cd backend
mvn spring-boot:run
```

- 기본 프로필은 `mock`
- 실제 MySQL 연동 시 [`backend/src/main/resources/application-mysql.example.yml`](backend/src/main/resources/application-mysql.example.yml)를 참고해 설정
- 이 상태에서는 API만 열리고 `/` 화면은 정적 파일을 동기화한 뒤에만 제공

### 2-1. Gemini API 연동

Gemini 연동은 기본적으로 꺼져 있고, 아래 환경변수를 설정하면 [`/api/ai/guide`](backend/src/main/java/com/supersave/backend/ai/controller/AiGuideController.java)에서 실응답을 사용합니다.

```bash
export SUPERSAVE_GEMINI_ENABLED=true
export GEMINI_API_KEY=발급받은_키
export GEMINI_MODEL=gemini-2.0-flash
cd backend
mvn spring-boot:run
```

- 기본값은 `SUPERSAVE_GEMINI_ENABLED=false`
- 키가 없거나 호출이 실패하면 기존 템플릿 응답으로 자동 fallback
- 현재 구현은 Gemini 응답을 `answer` 필드에 반영하고, 안전 문구/요약/행동 가이드는 서버 템플릿을 유지

### 3. 프론트엔드 개발 서버

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- 기본값은 `VITE_USE_MOCK=false`
- 화면 주소는 `http://127.0.0.1:5173`
- `/api` 요청은 `http://127.0.0.1:8080`으로 프록시됨
- 프론트만 단독 시연하려면 `.env`에서 `VITE_USE_MOCK=true`로 변경

## mock 데이터와 시뮬레이션

- 병원 데이터는 [`frontend/src/data/mockData.ts`](frontend/src/data/mockData.ts)와 [`backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java`](backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java)에 들어있음
- 추천 점수는 거리, 병상, 중증도 수용 가능 여부, 예상 대기시간 기반의 단순 공식 사용
- 출발 등록은 실제 예약 확정이 아니라 도착 예정 환자 등록 시뮬레이션

## Kakao Map API 연동

- **지도 라이브러리**: `react-kakao-maps-sdk` 라이브러리를 활용하여 컴포넌트를 구성하였습니다.
- **주요 구현 기능**:
  - 사용자 현재 위치(별 마커) 및 주변 응급실 병원 위치 시각화
  - 실시간 혼잡도(여유: 녹색 / 보통: 황색 / 혼잡: 적색)에 따른 마커 색상 변경 및 총 가용 병상 수 뱃지 표시
  - 마커 마우스 호버 및 클릭 시 상세 정보 오버레이 출력 (병원명, 주소, 가용 병상수, 대기시간, 거리, 예상 이동시간)
  - 선택된 병원과 사용자 간의 가상 이송 경로 시각화 (`Polyline` 그리기)
- **설정 및 실행**:
  - `frontend/.env` 파일 내 `VITE_KAKAO_MAP_API_KEY` 키에 Kakao Developers에서 발급받은 JavaScript API Key를 설정하여 구동합니다.
