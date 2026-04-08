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
- 실제 MySQL 연동 시 [`backend/src/main/resources/application-mysql.example.yml`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/resources/application-mysql.example.yml)를 참고해 설정
- 이 상태에서는 API만 열리고 `/` 화면은 정적 파일을 동기화한 뒤에만 제공

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

- 병원 데이터는 [`frontend/src/data/mockData.ts`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/frontend/src/data/mockData.ts)와 [`backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java)에 들어있음
- 추천 점수는 거리, 병상, 중증도 수용 가능 여부, 예상 대기시간 기반의 단순 공식 사용
- 출발 등록은 실제 예약 확정이 아니라 도착 예정 환자 등록 시뮬레이션

