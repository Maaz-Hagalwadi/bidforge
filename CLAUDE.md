# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BidForge** is a freelance marketplace (Fiverr/Upwork-style) with a Spring Boot backend and a React + TypeScript frontend. Implemented so far: auth, user profile, full job module (post, browse, edit, archive, invite-only visibility, per-freelancer invitations), bidding, contracts, milestones with escrow-style payments, and dashboards. Planned: Chat, Notification modules.

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
Override with env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

`spring.jpa.hibernate.ddl-auto=update` — schema is auto-updated on startup. Tests use H2 in-memory with `create-drop`.

### Package structure (`com.bidforge.app`)

```
auth/          AuthController, AuthService, JwtService, JwtAuthFilter,
               RateLimitFilter, RefreshToken(Entity/Repository/Service)
               dto/request/  LoginRequest, RegisterRequest, RefreshTokenRequest
               dto/response/ LoginResponse
user/          User (entity), Role (enum: CLIENT/FREELANCER/ADMIN),
               UserRepository, UserController, UserService
               dto/request/  UpdateUserRequest
               dto/response/ UserResponse
job/           Job (entity), JobController, JobService, JobRepository,
               JobSpecification, JobInvitation (entity), JobInvitationRepository
               enums/  BudgetType, JobStatus (DRAFT/OPEN/ASSIGNED/COMPLETED/CANCELLED),
                       Visibility, ExperienceLevel (ENTRY/INTERMEDIATE/EXPERT),
                       UrgencyLevel (LOW/NORMAL/HIGH)
               dto/request/  CreateJobRequest, UpdateJobRequest
               dto/response/ JobResponse
job_invite/    JobInvite (entity), JobInviteController, JobInviteService,
               JobInviteRepository, InviteStatus (enum: INVITED/ACCEPTED/DECLINED)
               dto/  InviteRequest, InvitedJobResponse, JobInviteStatusResponse
bid/           Bid (entity), BidController, BidService, BidRepository,
               BidStatus (enum: PENDING/ACCEPTED/REJECTED)
               dto/  CreateBidRequest, BidResponse
contract/      Contract (entity), ContractController, ContractService, ContractRepository,
               ContractStatus (enum: ACTIVE/SUBMITTED/REVISION_REQUESTED/COMPLETED/CANCELLED)
               dto/  ContractResponse, SubmitWorkRequest
milestone/     Milestone (entity), MilestoneController, MilestoneService, MilestoneRepository,
               MilestoneStatus (enum: PENDING/IN_PROGRESS/SUBMITTED/APPROVED/REJECTED)
               dto/  CreateMilestoneRequest, MilestoneResponse, MilestoneSummary
payment/       Payment (entity), PaymentRepository,
               PaymentStatus (enum: ESCROWED/RELEASED)
               (no controller — lifecycle managed entirely by MilestoneService)
dashboard/     DashboardController, DashboardService (stats aggregation)
config/        SecurityConfig, JwtAuthenticationEntryPoint, JwtAccessDeniedHandler
common/exception/  GlobalExceptionHandler, ErrorResponse, all custom exceptions
```

### Auth & security model

- `SecurityConfig` permits `/auth/**`, `/jobs` (GET), `/jobs/{id}` (GET); everything else requires a valid JWT.
- Filter chain: `RateLimitFilter` → `JwtAuthFilter` → `UsernamePasswordAuthenticationFilter`.
- `JwtAuthFilter` sets a `UsernamePasswordAuthenticationToken` with `ROLE_<role>` authority; the principal is the full `User` entity.
- `JwtService.generateToken(User)` embeds `userId` and `role` claims (HS256, 15 min expiry).
- Refresh token rotation: `RefreshTokenService.validateAndRotate()` revokes the old token and issues a new UUID one (7-day expiry) atomically.
- `UserService` and `JobService` read the principal from `SecurityContextHolder` directly — no `@AuthenticationPrincipal` needed.

### Job module architecture

**Visibility model**: Every `Job` is either `PUBLIC` or `INVITE_ONLY`.

**Two invite-related tables** — keep them distinct:
- `JobInvitation` — simple invite record (no status), used by `JobController.inviteFreelancer()` for the single-freelancer invite flow from `MyJobs`.
- `JobInvite` — status-tracked invite (`INVITED`/`ACCEPTED`/`DECLINED`), used by `JobInviteController.inviteFreelancers()` for the bulk invite flow from `PostJob`, and by `getMyInvites()` to show the freelancer's inbox.

**Browse visibility rules** (`JobService.getBrowseJobs`):
- Unauthenticated → `OPEN + PUBLIC` only
- Freelancer → `OPEN + PUBLIC` **plus** `OPEN + INVITE_ONLY` where a `JobInvite` record exists for them
- CLIENT → `OPEN + PUBLIC`, excluding their own jobs
- Applied via `JobSpecification` (JPA `Specification` + `JpaSpecificationExecutor`)
- Note: `GET /jobs` controller has `@PreAuthorize("hasRole('FREELANCER') or isAnonymous()")` — authenticated CLIENTs are blocked at the controller level (403); the CLIENT branch in the service is dead code.

**Job lifecycle**: `DRAFT` → `OPEN` (on publish) → `ASSIGNED` (on bid accept, contract created) → `COMPLETED` (on contract complete). `OPEN`/`DRAFT` jobs can be archived → `CANCELLED`. Edit (`PUT /jobs/{id}`) is allowed while `OPEN` or `DRAFT`.

**Contract flow**: Accepting a bid (via `BidService`) creates a `Contract` with status `ACTIVE` and sets the job to `ASSIGNED`. Freelancer calls `PATCH /contracts/{id}/submit-work` → `SUBMITTED`. Client can then either: call `PATCH /contracts/{id}/complete` → `COMPLETED` (job moves to `COMPLETED`), or call `PATCH /contracts/{id}/request-revision` → `REVISION_REQUESTED` (freelancer can resubmit). `Contract` also has `revisionNote` and `revisionRequestedAt` fields.

**Milestone flow**: Client creates milestones (`POST /milestones/contracts/{contractId}`). Each `Milestone` starts `PENDING` with `funded=false`. Client funds a milestone (`PATCH /milestones/{id}/fund`) → creates a `Payment` record with status `ESCROWED`. Freelancer submits work (`PATCH /milestones/{id}/submit`) → milestone → `SUBMITTED` (requires funded). Client approves (`PATCH /milestones/{id}/approve`) → milestone → `APPROVED`, `Payment` → `RELEASED`. Milestone and payment lifecycle is managed entirely by `MilestoneService`; there is no `PaymentController`.

**`JobResponse` enrichment**: `getClientJobs` (i.e. `GET /jobs/my`) additionally sets `bidsCount` (count from BidRepository) and `assignedFreelancerName` (from ContractRepository) for `ASSIGNED`/`COMPLETED` jobs. These fields are `null` on all other endpoints.

**Pagination**: `GET /jobs` returns `Page<JobResponse>` (Spring Data). All other job endpoints return `List<JobResponse>`.

### API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | `role`: `CLIENT`/`FREELANCER`; `ADMIN` falls back to `CLIENT` |
| POST | `/auth/login` | No | Returns `accessToken`, `refreshToken`, `tokenType` |
| POST | `/auth/refresh` | No | Rotates refresh token |
| POST | `/auth/logout` | No | Revokes refresh token |
| GET | `/users/me` | Yes | Current user profile |
| PATCH | `/users/me` | Yes | Update `name` or `profileImageUrl` |
| GET | `/users/search?q=` | CLIENT | Search freelancers by name/email (max 10 results) |
| GET | `/client/dashboard` | CLIENT | Aggregated client stats |
| GET | `/freelancer/dashboard` | FREELANCER | Aggregated freelancer stats |
| POST | `/jobs` | CLIENT | Create job; `draft: true` → `DRAFT` status, else `OPEN` |
| GET | `/jobs` | FREELANCER / anon | Browse; paginated, filterable by keyword/category/skills/budget/deadline/postedAfter |
| GET | `/jobs/my` | CLIENT | All jobs owned by caller (all statuses); enriched with bidsCount + assignedFreelancerName |
| GET | `/jobs/invited` | FREELANCER | Full `JobResponse[]` for invited jobs |
| GET | `/jobs/{id}` | Public* | *INVITE_ONLY requires ownership or active invite |
| PUT | `/jobs/{id}` | CLIENT | Update an owned job (OPEN or DRAFT only) |
| PATCH | `/jobs/{id}/archive` | CLIENT | Archive (cancel) an owned job; forbidden on COMPLETED |
| POST | `/jobs/{id}/repost` | CLIENT | Repost an archived job → status back to OPEN |
| DELETE | `/jobs/{id}` | CLIENT | Permanently delete an archived (CANCELLED) job; cascades bids/invites |
| POST | `/jobs/{jobId}/invite/{freelancerId}` | CLIENT | Single-freelancer invite (owner + INVITE_ONLY only) |
| POST | `/jobs/{jobId}/invite` | CLIENT | Bulk invite via `{ freelancerIds: [...] }` |
| GET | `/jobs/invites` | FREELANCER | All invites with status + full job data (`InviteWithJobResponse[]`) |
| POST | `/jobs/invites/{inviteId}/accept` | FREELANCER | Accept an invite |
| POST | `/jobs/invites/{inviteId}/decline` | FREELANCER | Decline an invite |
| GET | `/jobs/{jobId}/invites` | CLIENT | All invitees + statuses for a specific job (`JobInviteStatusResponse[]`) |
| GET | `/jobs/all-invites` | CLIENT | All invites across all client's jobs (aggregated) |
| GET | `/jobs/{jobId}/bids` | CLIENT | All bids on a job (owner only) |
| POST | `/jobs/{jobId}/bids` | FREELANCER | Submit a bid (`amount`, `proposal`, `deliveryDays`) |
| GET | `/bids/my` | FREELANCER | All bids placed by the caller |
| POST | `/bids/{bidId}/accept` | CLIENT | Accept a bid; sets job to ASSIGNED, creates Contract (ACTIVE), rejects others |
| POST | `/bids/{bidId}/decline` | CLIENT | Decline a specific bid |
| GET | `/contracts/client` | CLIENT | All contracts where caller is the client |
| GET | `/contracts/freelancer` | FREELANCER | All contracts assigned to caller |
| PATCH | `/contracts/{id}/submit-work` | FREELANCER | Submit work (`submissionNote`, `submissionUrl`); contract → SUBMITTED |
| PATCH | `/contracts/{id}/complete` | CLIENT | Mark contract complete; contract → COMPLETED, job → COMPLETED |
| PATCH | `/contracts/{id}/request-revision` | CLIENT | Request revision (`note`); contract → REVISION_REQUESTED |
| POST | `/milestones/contracts/{contractId}` | CLIENT | Create milestones (bulk array of `CreateMilestoneRequest`); owner only |
| GET | `/milestones/contract/{contractId}` | Yes | List milestones for a contract; restricted to client or assigned freelancer |
| GET | `/milestones/freelancer` | FREELANCER | All milestones across freelancer's contracts |
| PATCH | `/milestones/{id}/fund` | CLIENT | Fund milestone → `funded=true`, creates ESCROWED Payment |
| PATCH | `/milestones/{id}/submit` | FREELANCER | Submit milestone work → SUBMITTED (must be funded) |
| PATCH | `/milestones/{id}/approve` | CLIENT | Approve milestone → APPROVED, Payment → RELEASED |
| GET | `/milestones/summary/client` | CLIENT | Aggregated milestone stats for the caller's contracts |
| GET | `/milestones/summary/freelancer` | FREELANCER | Aggregated milestone stats for the caller's contracts |

### Exception → HTTP mapping

| Exception | Code | `error` field |
|-----------|------|---------------|
| `EmailAlreadyExistsException` | 400 | `EMAIL_ALREADY_EXISTS` |
| `UserNotFoundException` | 404 | `USER_NOT_FOUND` |
| `JobNotFoundException` | 404 | `JOB_NOT_FOUND` |
| `InvalidCredentialsException` | 401 | `INVALID_CREDENTIALS` |
| `InvalidTokenException` | 401 | `INVALID_TOKEN` |
| `BidNotFoundException` | 404 | `NOT_FOUND` |
| `BidAlreadyExistsException` | 400 | `BAD_REQUEST` (freelancer already bid on job) |
| `InviteNotFoundException` | 404 | `NOT_FOUND` |
| `InviteAlreadyProcessedException` | 400 | `BAD_REQUEST` |
| `ContractNotFoundException` | 404 | `NOT_FOUND` |
| `AccessDeniedException` | 403 | `ACCESS_DENIED` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` (+ `errors[]`) |
| `HttpMessageNotReadableException` | 400 | `MALFORMED_REQUEST` |

`ErrorResponse` shape: `{ timestamp, status, error, message, path, errors? }`.

### Testing strategy

- **Unit tests** (`AuthServiceTest`, `JwtServiceTest`): `@ExtendWith(MockitoExtension.class)`. `JwtServiceTest` uses `ReflectionTestUtils` to inject `@Value` fields.
- **Integration tests** (`AuthControllerTest`): `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` + `@Transactional`. H2 in-memory DB (`application-test.properties`). `rate-limit.max-requests=1000` prevents 429s.
- Do **not** use `@WebMvcTest` — `SecurityConfig` pulls in JPA-dependent filters that break the slice context.
- Only auth is covered by tests; job/bid/invite modules have no tests yet.

---

## Frontend (`frontend/`)

```bash
npm run dev      # Vite dev server on :5173
npm run build    # tsc + vite build
npm run preview  # preview the production build locally
npm run lint     # ESLint
npm run format   # Prettier
```

**Backend must be running** (`localhost:8080`). Override with `VITE_API_BASE_URL` (see `.env.example`). No frontend test runner is configured.

### Stack

React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6, React Hook Form + Zod, Axios.

### Routing (`src/App.tsx`)

| Path | Component | Guard |
|------|-----------|-------|
| `/` | `Landing` | — |
| `/register` | `Register` | — |
| `/login` | `Login` | — |
| `/client/dashboard` | `ClientDashboard` | `ClientRoute` |
| `/client/post-job` | `PostJob` | `ClientRoute` |
| `/client/jobs` | `MyJobs` | `ClientRoute` |
| `/client/invites` | `ClientInvites` | `ClientRoute` |
| `/client/bids` | `ClientBids` | `ClientRoute` |
| `/client/jobs/:jobId/bids` | `ClientJobBids` | `ClientRoute` |
| `/freelancer/dashboard` | `FreelancerDashboard` | `FreelancerRoute` |
| `/freelancer/invites` | `FreelancerInvites` | `FreelancerRoute` |
| `/freelancer/bids` | `FreelancerBids` | `FreelancerRoute` |
| `/browse` | `BrowseJobs` | — (public) |
| `/jobs/:id` | `JobDetail` | — (public*) |
| `/client/archived-jobs` | `ArchivedJobs` | `ClientRoute` |
| `/contracts` | `Contracts` | `ProtectedRoute` |
| `/contracts/:contractId` | `Contracts` | `ProtectedRoute` |
| `/dashboard` | redirect → `/client/dashboard` | — |

`ClientRoute` / `FreelancerRoute` (in `src/components/ProtectedRoute.tsx`) extend `ProtectedRoute` and additionally check `user.role`; redirect to the correct dashboard if wrong role.

### Key architecture patterns

**Token storage**: `accessToken` in `sessionStorage`, `refreshToken` in `localStorage`.

**Auto-refresh** (`src/api/axiosInstance.ts`): Response interceptor catches 401s, calls `/auth/refresh`, retries the original request, and queues concurrent 401s. On failure, clears tokens and redirects to `/login`.

**Auth context** (`src/context/AuthContext.tsx`): `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, `refreshUser()`. `register()` does **not** auto-login. Consumed via the `useAuth()` hook.

**API layer** (`src/api/`):
- `jobs.ts` — `jobsApi`: create, getAll (paginated), getById, getMyJobs, inviteFreelancer (single), inviteFreelancers (bulk), getInvites, acceptInvite, declineInvite, getJobInvites, getAllClientInvites, getInvitedJobs, createBid, getJobBids, acceptBid, declineBid, getMyBids, updateJob, archiveJob, **repostJob**, **deleteJob**
- `contracts.ts` — `contractsApi`: `getClientContracts()`, `getFreelancerContracts()`, `submitWork(contractId, payload)`, `completeContract(contractId)`, `requestRevision(contractId, note)`
- `milestones.ts` — `milestonesApi`: `createMilestones()`, `getMilestonesByContract()`, `getFreelancerMilestones()`, `fundMilestone()`, `submitMilestone()`, `approveMilestone()`, `getSummaryForClient()`, `getSummaryForFreelancer()`
- `user.ts` — `userApi`: `getMe()`, `updateMe()`
- `users.ts` — `usersApi`: `searchFreelancers()`
- `dashboard.ts` — `dashboardApi`: `getClientDashboard()`, `getFreelancerDashboard()`
- `auth.ts` — auth calls (login, register, refresh, logout)

**Sidebar navigation** (`src/constants/sidebar.ts`): `CLIENT_SIDEBAR` and `FREELANCER_SIDEBAR` arrays define nav links with `icon`, `label`, `short`, `path` fields. The Contracts entry links to `/contracts`; Payments is still a placeholder with no `path`. `withActive()` marks the active route.

**Pagination pattern**: `BrowseJobs` uses server-side pagination (`SpringPage<JobResponse>` from `GET /jobs`). `MyJobs` and `FreelancerInvites` fetch all records once and paginate client-side (10 per page). `SpringPage<T>` is defined in `src/types/job.ts`.

**Search pattern**: `BrowseJobs` and `FreelancerInvites` both use a two-state approach — live form inputs vs. `applied` filters that only update on Search button click (form `onSubmit`). This prevents API/filter triggering on every keystroke.

**Form validation**: Zod schemas in `src/lib/schemas.ts` are the client-side source of truth. Server errors map to `react-hook-form` field errors via `setError()`.

**Shared UI components** (`src/components/`):
- `BidForgeLogo` — SVG badge + wordmark, `variant="light"|"dark"`
- `Navbar` — navy sticky header, 3-column grid. `variant="app"` | `"auth"`. Accepts `authRight` slot.
- `FormField` — labelled input with Material Symbol icon and inline error
- `RoleSelector` — CLIENT/FREELANCER toggle, `aria-pressed`
- `ProtectedRoute` / `ClientRoute` / `FreelancerRoute` — auth + role guards
- `ProfileDropdown` — avatar menu with profile edit and logout
- `PageLoader` — full-area spinner with message
- `Toast` — auto-dismiss success/error notification
- `PlaceBidModal` — modal dialog for submitting a bid with form validation

**Inline modals in `MyJobs`**: `EditJobModal` (edit OPEN/DRAFT job fields), `InviteModal` (search + single-invite a freelancer), `InviteesModal` (view all invitees + statuses for a job), archive confirmation dialog — all defined in the same file rather than as separate component files. `MyJobs` also supports list/grid view toggle and client-side pagination (10 per page).

**`Contracts` page** (`src/pages/Contracts.tsx`): Dual-view page — list view at `/contracts`, detail view at `/contracts/:contractId`. The detail view embeds full milestone management: client can create milestones (inline multi-item form), fund escrow, and approve; freelancer can submit work per-milestone. Contract status REVISION_REQUESTED flow is also handled inline (revision note display + resubmit form). The `REVISION_REQUESTED` and `CANCELLED` statuses are new compared to the earlier contract module.

**Path alias**: `@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`).

### Tailwind tokens (extended)

Custom spacing: `xs`=4px, `sm`=8px, `md`=16px, `lg`=24px, `xl`=32px, `2xl`=48px, `3xl`=64px.  
Key colors: `dark-navy`=`#0A192F`, `secondary`=`#0059bb`, `secondary-container`=`#0070ea`, `primary-container`=`#0d1c32`.  
`max-w-8xl` = 1280px (standard page container). `tonal-card` utility class used for elevated card surfaces.  
Font: `Plus Jakarta Sans`. Typography scale follows Material 3 (`h1`–`h4`, `body-sm/md/lg`, `label-sm/md`).
