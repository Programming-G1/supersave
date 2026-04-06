# SuperSave

실시간 병상 기반 응급실 매칭 및 AI 의사결정 지원 시스템 MVP입니다.  
현재 구조는 `frontend` React/Vite 앱과 `backend` Spring Boot REST API를 분리한 형태이며, 기본 실행은 mock data 기준으로 동작합니다.

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

### 1. 백엔드

```bash
cd backend
mvn spring-boot:run
```

- 기본 프로필은 `mock`
- 실제 MySQL 연동 시 [`backend/src/main/resources/application-mysql.example.yml`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/resources/application-mysql.example.yml)를 참고해 설정

### 2. 프론트엔드

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- `VITE_USE_MOCK=true`면 프론트 단독 시연 가능
- `VITE_USE_MOCK=false`면 `/api` 요청을 백엔드로 전달

## mock 데이터와 시뮬레이션

- 병원 데이터는 [`frontend/src/data/mockData.ts`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/frontend/src/data/mockData.ts)와 [`backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/java/com/supersave/backend/hospital/repository/MockHospitalRepository.java)에 들어있음
- 추천 점수는 거리, 병상, 중증도 수용 가능 여부, 예상 대기시간 기반의 단순 공식 사용
- 출발 등록은 실제 예약 확정이 아니라 도착 예정 환자 등록 시뮬레이션

## Figma / SuperPass 반영

- `/Users/kangdaeun/Downloads/SuperPass`는 Figma import 기반 프론트 레퍼런스로 복사해 두었음
- 현재 실행 엔트리는 `frontend/src/App.tsx` 이하의 `SuperSave` 구조
- 이후 실제 Figma 화면을 주시면 현재 `src/components` 계층 위에서 시각 요소를 정밀하게 다시 맞출 수 있음

## 이후 실제 연동 포인트

- 백엔드:
  - [`backend/src/main/java/com/supersave/backend/ai/service/AiGuideService.java`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/java/com/supersave/backend/ai/service/AiGuideService.java): Gemini adapter 연결
  - [`backend/src/main/resources/application-mock.yml`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/backend/src/main/resources/application-mock.yml): mock 전용 설정
  - `hospital/repository`: 공공데이터 기반 수집/캐시 계층으로 교체
- 프론트:
  - [`frontend/src/components/recommendation/MapPlaceholder.tsx`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/frontend/src/components/recommendation/MapPlaceholder.tsx): Kakao Map 교체 지점
  - [`frontend/src/api/index.ts`](/Users/kangdaeun/Desktop/강대운/단국대/3-1학기/문제해결프로그래밍/supersave/frontend/src/api/index.ts): mock/live 분기 지점
