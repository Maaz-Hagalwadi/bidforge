# BidForge

A full-stack freelance marketplace (Fiverr/Upwork-style) with a Spring Boot backend and a React + TypeScript frontend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)

---

## Features

**Auth & Users**
- Email/password registration with email verification
- OTP-based email login
- Google OAuth2 sign-in and account linking
- Password reset via email
- Per-user portfolio management
- Notification preferences per user

**Jobs & Bidding**
- Clients post jobs (public or invite-only visibility)
- Freelancers browse and filter jobs; invite-only jobs surface only when invited
- Invite freelancers individually or in bulk
- Freelancers submit bids with proposals and pricing
- Clients accept or decline bids; accepting creates a contract and closes bidding

**Contracts & Milestones**
- Contract lifecycle: Active → Submitted → Revision Requested → Completed / Cancelled
- Milestone-based escrow: client funds each milestone, freelancer submits, client approves
- Revision flow with notes and resubmission

**Payments**
- Stripe-powered escrow (PaymentIntent per milestone)
- Funds held until client approves milestone work
- Stripe webhook handler for payment lifecycle events

**Messaging & Notifications**
- Real-time chat per contract (WebSocket/STOMP + REST history)
- Typing indicators and read receipts over WebSocket
- Online/offline presence tracking (Redis)
- Real-time in-app notifications (WebSocket + REST) with unread counts
- Toast notifications for live events

**Reviews & Disputes**
- Post-contract reviews for both parties
- Dispute opening and resolution per contract

**Admin Panel**
- Platform-wide stats, user management (ban/unban/delete)
- Job moderation, dispute management, payment summaries
- Revenue, user growth, bid activity, and dispute analytics
- Paginated login activity log

**AI Features** (via Groq / llama-3.1-8b-instant)
- Generate job descriptions and bid proposals
- Suggest milestones, bid pricing, interview questions
- Job recommendations for freelancers, profile optimization, resume skill extraction
- General AI chat assistant

**File Uploads**
- Upload chat attachments and job files (images, PDF, Office, ZIP — max 20 MB)
- Local disk storage with optional AWS S3 backend

---

## Tech Stack

**Backend**: Java 21, Spring Boot 3.4.1, Spring Security (JWT), PostgreSQL, Flyway (V1–V18), Redis, Stripe, Resend (email), Google OAuth2, Groq AI, AWS S3

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6, React Hook Form + Zod, Axios, STOMP/SockJS

---

## Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

Create the database and user:

```sql
CREATE DATABASE bidforge;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE bidforge TO admin;
```

---

## Getting Started

**Backend**

```bash
cd backend/app
./mvnw spring-boot:run        # starts on :8080
./mvnw clean install          # build + run all tests
```

Schema is managed by Flyway — migrations run automatically on startup. No manual schema setup required.

**Frontend**

```bash
cd frontend
npm install
npm run dev                   # starts on :5173
```

Copy `frontend/.env.example` to `frontend/.env` and fill in the required values before running.

---

## Environment Variables

### Backend

All variables have local development defaults. Values marked **required** must be set for that feature to work.

| Variable | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/bidforge` | |
| `DB_USERNAME` | `admin` | |
| `DB_PASSWORD` | `admin` | |
| `JWT_SECRET` | *(built-in dev placeholder)* | Change in production |
| `REDIS_HOST` | `localhost` | |
| `REDIS_PORT` | `6379` | |
| `REDIS_PASSWORD` | *(empty)* | |
| `RESEND_API_KEY` | — | Email delivery (verification, OTP, password reset) |
| `EMAIL_TEST_MODE` | `false` | Set `true` to skip real email sends during development |
| `APP_BASE_URL` | `http://localhost:5173` | Frontend origin used in email links and CORS |
| `APP_SERVER_URL` | `http://localhost:8080` | |
| `APP_UPLOAD_DIR` | `uploads` | Local file storage path |
| `GOOGLE_CLIENT_ID` | — | Required for Google OAuth |
| `GROQ_API_KEY` | — | Required for AI features |
| `STRIPE_SECRET_KEY` | — | **Required at startup** — app will not start without this |
| `STRIPE_WEBHOOK_SECRET` | — | Required for Stripe webhook verification |
| `STRIPE_PUBLISHABLE_KEY` | — | Passed to frontend for Stripe.js |
| `AWS_ACCESS_KEY` | — | S3 uploads; falls back to local disk if unset |
| `AWS_SECRET_KEY` | — | |
| `aws.s3.region` | `eu-north-1` | |
| `aws.s3.bucket` | `bidforge-storage-2026` | |

### Frontend

See `frontend/.env.example` for the full list.

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:8080`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe frontend key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_APK_DOWNLOAD_URL` | Optional — link to Android APK download |

---

## Running Tests

Tests use H2 in-memory + embedded Redis (port 6370). PostgreSQL is not required.

```bash
cd backend/app

./mvnw test                                      # all tests
./mvnw test -Dtest=ClassName                     # single class
./mvnw test -Dtest=ClassName#methodName          # single method
```

Auth module has unit and integration test coverage. Other modules are not yet tested.
