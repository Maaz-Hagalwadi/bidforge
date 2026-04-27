# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BidForge** is a freelance marketplace (Fiverr/Upwork-style) with a Spring Boot backend and a React + TypeScript frontend. Implemented so far: auth (register, login, refresh, logout) and user profile. Planned: Job, Bidding, Chat, Payment, Notification modules.

---

## Backend (`backend/app/`)

All Maven commands run from `backend/app/`:

```bash
./mvnw clean install          # build + test
./mvnw spring-boot:run        # start on :8080
./mvnw test                   # all tests
./mvnw test -Dtest=ClassName  # single test class
./mvnw test -Dtest=ClassName#methodName  # single method
```

**Prerequisites**: PostgreSQL on `localhost:5433`, database `bidforge`, user `admin`, password `admin`.  
Defaults are baked into `application.properties` as fallbacks — override with env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

### Package structure (`com.bidforge.app`)

```
auth/          AuthController, AuthService, JwtService, JwtAuthFilter,
               RateLimitFilter, RefreshToken(Entity/Repository/Service)
               dto/request/  LoginRequest, RegisterRequest, RefreshTokenRequest
               dto/response/ LoginResponse
user/          User (entity), Role (enum), UserRepository,
               UserController, UserService
               dto/request/  UpdateUserRequest
               dto/response/ UserResponse
config/        SecurityConfig, JwtAuthenticationEntryPoint, JwtAccessDeniedHandler
common/exception/  GlobalExceptionHandler, ErrorResponse, all custom exceptions
```

### Auth & security model

- `SecurityConfig` permits only `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`; everything else requires a valid JWT.
- Filter chain order: `RateLimitFilter` → `JwtAuthFilter` → `UsernamePasswordAuthenticationFilter`.
- `JwtAuthFilter` extracts `Authorization: Bearer <token>`, validates with `JwtService`, loads the `User` entity from the DB, and sets a `UsernamePasswordAuthenticationToken` with `ROLE_<role>` authority in the `SecurityContext`.
- `JwtService.generateToken(User)` embeds `userId` and `role` claims alongside the email subject (HS256, 15 min expiry).
- Refresh token rotation: `RefreshTokenService.validateAndRotate()` revokes the old token and issues a new UUID-based one (7-day expiry) atomically in a transaction.
- `UserService.getCurrentUser()` and `updateCurrentUser()` read the principal directly from `SecurityContextHolder` — the principal is the `User` entity set by `JwtAuthFilter`.

### API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register; `role` field optional (`CLIENT`/`FREELANCER`; `ADMIN` silently falls back to `CLIENT`) |
| POST | `/auth/login` | No | Returns `accessToken`, `refreshToken`, `tokenType` |
| POST | `/auth/refresh` | No | Rotates refresh token; returns new token pair |
| POST | `/auth/logout` | No | Revokes refresh token |
| GET | `/users/me` | Yes | Current user profile |
| PATCH | `/users/me` | Yes | Update `name` or `profileImageUrl` |

### Exception → HTTP mapping

| Exception | Code | `error` field |
|-----------|------|---------------|
| `EmailAlreadyExistsException` | 400 | `EMAIL_ALREADY_EXISTS` |
| `PhoneAlreadyExistsException` | 400 | `PHONE_ALREADY_EXISTS` |
| `UserNotFoundException` | 404 | `USER_NOT_FOUND` |
| `InvalidCredentialsException` | 401 | `INVALID_CREDENTIALS` |
| `InvalidTokenException` | 401 | `INVALID_TOKEN` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` (+ `errors[]` array) |
| `HttpMessageNotReadableException` | 400 | `MALFORMED_REQUEST` |

`ErrorResponse` shape: `{ timestamp, status, error, message, path, errors? }`.

### Testing strategy

- **Unit tests** (`AuthServiceTest`, `JwtServiceTest`): Mockito `@ExtendWith(MockitoExtension.class)`, `@Mock`/`@InjectMocks`. `JwtServiceTest` uses `ReflectionTestUtils` to inject `@Value` fields.
- **Integration tests** (`AuthControllerTest`): `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` + `@Transactional`. H2 in-memory DB (`application-test.properties`). `rate-limit.max-requests=1000` prevents 429s during tests.
- Do **not** use `@WebMvcTest` — `SecurityConfig` pulls in JPA-dependent filters that break the slice context.

---

## Frontend (`frontend/`)

```bash
npm run dev      # Vite dev server on :5173
npm run build    # tsc + vite build
npm run lint     # ESLint
npm run format   # Prettier
```

**Backend must be running** (`localhost:8080`) for API calls. Override with `VITE_API_BASE_URL` env var.

### Stack

React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6, React Hook Form + Zod, Axios.

### Routing (`src/App.tsx`)

| Path | Component | Auth guard |
|------|-----------|------------|
| `/` | `Landing` | No |
| `/register` | `Register` | No |
| `/login` | `Login` | No |
| `/dashboard` | `Dashboard` | Yes (`ProtectedRoute`) |
| `*` | Redirect → `/` | — |

### Key architecture patterns

**Token storage**: `accessToken` in `sessionStorage`, `refreshToken` in `localStorage`.

**Auto-refresh** (`src/api/axiosInstance.ts`): The Axios response interceptor catches 401s, calls `/auth/refresh` with the stored refresh token, updates both stored tokens, retries the original request, and queues any concurrent 401s to resolve after the single refresh completes. On refresh failure it clears tokens and redirects to `/login`.

**Auth context** (`src/context/AuthContext.tsx`): Provides `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`. Restores session from `sessionStorage` on mount. `register()` does **not** auto-login — callers navigate to `/login`.

**Form validation**: Zod schemas in `src/lib/schemas.ts` are the source of truth for client-side rules. The backend independently validates with Jakarta Bean Validation — server errors are mapped to `react-hook-form` field errors via `setError()` in each page component.

**Shared UI components**:
- `BidForgeLogo` — SVG badge + wordmark, `variant="light"|"dark"`.
- `Navbar` — navy (`#0A192F`) sticky header, 3-column grid (logo left / nav center / actions right). `variant="app"` shows Browse Jobs etc.; `variant="auth"` shows tagline. Accepts `authRight` slot.
- `FormField` — wraps a labelled input with a Material Symbol icon and an inline error message.
- `RoleSelector` — controlled two-button CLIENT/FREELANCER toggle, `aria-pressed` for accessibility.
- `ProtectedRoute` — redirects unauthenticated users to `/login`; shows spinner while `isLoading`.

**Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).

### Tailwind tokens (extended)

Custom spacing: `xs`=4px, `sm`=8px, `md`=16px, `lg`=24px, `xl`=32px, `xxl`/`2xl`=48px, `3xl`=64px.  
Key colors: `dark-navy`=`#0A192F`, `secondary`=`#0059bb`, `secondary-container`=`#0070ea`, `primary-container`=`#0d1c32`.  
`max-w-8xl` = 1280px (used as the standard page container width).
