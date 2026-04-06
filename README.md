# SuperSave

Figma에서 만든 응급실 이송 최적화 프론트를 시작점으로 만든 `React + Vite + Spring Boot` 프로젝트입니다.

## 구조

- `frontend`: Figma 기반 React/Vite 프론트엔드
- `backend`: Spring Boot API 및 정적 파일 서버
- `scripts/sync-frontend-to-backend.sh`: 프론트 빌드 결과를 백엔드 `static`으로 복사

## 개발 실행

### 1. 백엔드

```bash
cd backend
mvn -Dmaven.repo.local=/tmp/supersave-m2 spring-boot:run
```

### 2. 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

- 개발 서버: `http://127.0.0.1:5173`
- 프론트의 `/api` 요청은 Vite proxy로 `http://127.0.0.1:8080`에 전달됩니다.

## 단일 스프링부트 앱으로 실행

프론트를 빌드해서 백엔드 정적 리소스로 복사한 뒤 스프링부트만 실행하면 됩니다.

```bash
./scripts/sync-frontend-to-backend.sh
cd backend
mvn -Dmaven.repo.local=/tmp/supersave-m2 spring-boot:run
```

그 후 `http://127.0.0.1:8080`에서 앱과 API를 함께 사용할 수 있습니다.

## 현재 포함된 API

- `GET /api/health`
- `GET /api/app-data`
- `GET /api/hospitals`
- `GET /api/hospitals/{hospitalId}`
- `GET /api/hospitals/{hospitalId}/arrivals`
- `POST /api/recommendations`
- `POST /api/transfers`
- `PATCH /api/arrivals/{arrivalId}`
