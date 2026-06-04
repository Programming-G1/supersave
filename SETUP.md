# SuperSave 개발 환경 설정 가이드

## 📋 필수 사항

- Java 21 이상
- Maven 3.6+
- Docker (Redis용)
- PostgreSQL 또는 Supabase Postgres (출발 등록 영속화 모드 사용 시)

---

## 🚀 시작하기

### 1️⃣ 프로젝트 클론

```bash
git clone <repository>
cd supersave-4
```

### 2️⃣ Redis 서버 실행

**Mac/Linux (Docker 사용):**
```bash
docker run -d -p 6379:6379 --name supersave-redis redis:latest
```

**또는 Homebrew (Mac):**
```bash
brew install redis
redis-server
```

**또는 Windows (Docker Desktop):**
```bash
docker run -d -p 6379:6379 --name supersave-redis redis:latest
```

### 3️⃣ 환경 변수 설정

`backend/.env` 파일이 없으면 예시 파일을 복사해 생성합니다.

```bash
cp backend/.env.example backend/.env
```

Supabase를 쓴다면 `backend/.env`에 아래 값을 채웁니다:

```env
spring.profiles.active=postgres
DB_URL=jdbc:postgresql://aws-REGION.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.YOUR_PROJECT_REF
DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
```

### 4️⃣ 백엔드 실행

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

백엔드는 포트 **8080**에서 실행됩니다: http://localhost:8080

### 4-1️⃣ PostgreSQL / Supabase 영속화 모드로 실행

출발 등록(`Departure`) 데이터를 서버 재시작 후에도 유지하려면 PostgreSQL 또는 Supabase Postgres에 연결한 뒤 `postgres` 프로필로 실행합니다.

```bash
cd backend
mvn spring-boot:run
```

- PostgreSQL 프로필 설정 파일: `backend/src/main/resources/application-postgres.yml`
- Supabase를 쓰는 경우 보통 `Session pooler`를 먼저 사용하면 됩니다.
- `Transaction pooler`는 이 프로젝트의 Spring 서버 기본값으로 권장하지 않습니다.
- `Direct connection`은 IPv6 환경이면 사용할 수 있지만, 로컬 IPv4 환경에서는 연결이 안 될 수 있습니다.
- 현재 DB 영속화 대상: 출발 등록/상태(`Departure`)
- 병원 목록과 실시간 병상 정보는 계속 공공데이터 API + Redis 캐시를 사용

### 5️⃣ 프론트엔드 실행 (별도 터미널)

```bash
cd frontend
pnpm install
pnpm run dev
```

프론트엔드는 포트 **5173**에서 실행됩니다: http://localhost:5173

---

## ✅ 설정 확인

### Redis 연결 확인

```bash
# Redis CLI 접속
redis-cli

# 또는 Docker 컨테이너 내에서
docker exec supersave-redis redis-cli PING
```

응답: `PONG` ✅

### 캐시된 병원 정보 확인

```bash
# 캐시된 병원 개수
docker exec supersave-redis redis-cli KEYS "hospital:*" | wc -l

# 특정 병원 정보 조회
docker exec supersave-redis redis-cli GET "hospital:2121142"
```

---

## 🛑 서버 중지

```bash
# Redis 중지 (Docker)
docker stop supersave-redis
docker rm supersave-redis

# 또는 Redis 서버 중지 (Homebrew)
redis-cli shutdown
```

---

## 📝 환경 변수 설명

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PUBLIC_DATA_SERVICE_KEY` | 공공데이터 포털 API 키 | 설정 필요 |
| `PUBLIC_DATA_ENABLED` | 공공데이터 API 활성화 | true |
| `GEMINI_API_KEY` | Google Gemini API 키 | 선택사항 |
| `KAKAO_REST_API_KEY` | 카카오 지도 API 키 | 선택사항 |
| `REDIS_HOST` | Redis 호스트 | localhost |
| `REDIS_PORT` | Redis 포트 | 6379 |
| `DB_URL` | PostgreSQL JDBC URL (`postgres` 프로필) | `jdbc:postgresql://aws-REGION.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_USERNAME` | PostgreSQL 사용자명 (`postgres` 프로필) | `postgres.YOUR_PROJECT_REF` |
| `DB_PASSWORD` | PostgreSQL 비밀번호 (`postgres` 프로필) | `YOUR_SUPABASE_DB_PASSWORD` |

---

## 🐛 문제 해결

### Redis 연결 실패

```
error: Cannot get a resource from the pool
```

**해결:**
```bash
# Redis가 실행 중인지 확인
docker ps | grep redis

# Mac에서는:
redis-cli ping
```

### 빌드 실패

```bash
# Maven 캐시 초기화
cd backend
mvn clean install -U
```

### 포트 충돌

포트가 이미 사용 중인 경우:

```bash
# 8080 사용 중인 프로세스 확인
lsof -i :8080

# 실행 포트 변경
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

---

## 📚 추가 정보

- [공공데이터 포털](https://www.data.go.kr) - API 키 발급
- [Redis 공식 문서](https://redis.io/documentation)
- [Spring Boot Redis](https://spring.io/projects/spring-data-redis)
