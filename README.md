# BidForge

A production-grade freelance marketplace backend inspired by Fiverr and Upwork. Built with an event-driven, microservices architecture using Java 21 and Spring Boot.

> **Current status:** Auth module fully implemented. Remaining microservices are planned (see [Roadmap](#roadmap)).

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Auth Module](#auth-module)
  - [Endpoints](#endpoints)
  - [Request & Response Examples](#request--response-examples)
  - [Security Model](#security-model)
  - [Validation Rules](#validation-rules)
  - [Error Handling](#error-handling)
- [Running Tests](#running-tests)
- [Configuration Reference](#configuration-reference)
- [Roadmap](#roadmap)
- [Planned Architecture](#planned-architecture)

---

## Overview

BidForge allows clients to post jobs, freelancers to bid on them, and both parties to communicate and transact through a secure escrow-based payment system.

**Engineering focus:** scalable microservices, event-driven communication via Kafka, real-time features via WebSockets, distributed caching with Redis, and cloud-native deployment on AWS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.4.1 |
| Security | Spring Security + JWT (jjwt 0.11.5) |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL |
| Validation | Jakarta Bean Validation |
| Build | Maven |
| Testing | JUnit 5, Mockito, H2 (in-memory for tests) |

**Planned additions:** Apache Kafka, Redis, WebSocket, OAuth2, Docker / docker-compose, AWS deployment.

---

## Prerequisites

- Java 21
- Maven (or use the included `./mvnw` wrapper)
- PostgreSQL running on `localhost:5433`

Create the database and user:

```sql
CREATE DATABASE bidforge;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE bidforge TO admin;
```

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd bidforge/backend/app

# Run the application (schema auto-created on first run)
./mvnw spring-boot:run
```

The server starts on **port 8080**. Hibernate DDL-auto is set to `update`, so the schema is created automatically.

---

## Environment Variables

All sensitive values should be provided via environment variables. The app falls back to development defaults if they are not set — **never use the defaults in production.**

| Variable | Default (dev only) | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5433/bidforge` | JDBC connection URL |
| `DB_USERNAME` | `admin` | Database username |
| `DB_PASSWORD` | `admin` | Database password |
| `JWT_SECRET` | *(built-in dev placeholder)* | HS256 signing secret — must be at least 32 characters |

Example (Linux / macOS):

```bash
export DB_URL=jdbc:postgresql://prod-host:5432/bidforge
export DB_USERNAME=bidforge_user
export DB_PASSWORD=supersecret
export JWT_SECRET=your-64-character-production-secret-key-here-xxxxxxxxxxxxxx
./mvnw spring-boot:run
```

---

## Project Structure

```
com.bidforge.app
├── auth/
│   ├── AuthController.java          # HTTP layer — delegates to AuthService
│   ├── AuthService.java             # Business logic: register, login
│   ├── JwtService.java              # Token generation, extraction, validation
│   ├── JwtAuthFilter.java           # OncePerRequestFilter — validates JWT on each request
│   ├── RateLimitFilter.java         # In-memory rate limiter for auth endpoints
│   └── dto/
│       ├── request/
│       │   ├── LoginRequest.java
│       │   └── RegisterRequest.java
│       └── response/
│           └── LoginResponse.java
├── user/
│   ├── User.java                    # JPA entity
│   ├── Role.java                    # Enum: CLIENT, FREELANCER, ADMIN
│   ├── UserRepository.java          # JPA repository
│   └── dto/response/
│       └── UserResponse.java        # Safe response (no password)
├── config/
│   ├── SecurityConfig.java          # Filter chain, CORS, security headers, session policy
│   ├── JwtAuthenticationEntryPoint.java  # 401 JSON response
│   └── JwtAccessDeniedHandler.java       # 403 JSON response
└── common/exception/
    ├── GlobalExceptionHandler.java  # @RestControllerAdvice — all HTTP error mapping
    ├── ErrorResponse.java           # Uniform error body
    ├── EmailAlreadyExistsException.java
    ├── PhoneAlreadyExistsException.java
    ├── UserNotFoundException.java
    └── InvalidCredentialsException.java
```

---

## Auth Module

### Endpoints

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create a new CLIENT account |
| `POST` | `/auth/login` | No | Authenticate and receive a JWT |
| `GET` | `/auth/test` | Yes (Bearer JWT) | Verify a token works |

> All endpoints outside `/auth/login` and `/auth/register` require a valid `Authorization: Bearer <token>` header.

---

### Request & Response Examples

#### Register

**Request**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secure1@",
  "phoneNumber": "+12345678901"
}
```

**Response `201 Created`**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+12345678901",
  "role": "CLIENT",
  "rating": null
}
```

> `role` is always `CLIENT` on registration, regardless of what is sent. Freelancer/Admin roles must be assigned through a privileged endpoint (planned).

---

#### Login

**Request**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Secure1@"
}
```

**Response `200 OK`**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer"
}
```

Use the token in subsequent requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

#### Error Response (all endpoints)

```json
{
  "timestamp": "2026-04-24T10:15:00",
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    "password: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    "phoneNumber: Invalid phone number format"
  ],
  "path": "/auth/register"
}
```

---

### Security Model

- **JWT** — HS256-signed tokens, 15-minute expiry (`jwt.expiration=900000` ms). Token payload includes `email`, `userId`, and `role`.
- **Stateless** — `SessionCreationPolicy.STATELESS`; no HTTP sessions created.
- **Password hashing** — BCrypt with default work factor (10 rounds).
- **RBAC** — User role is loaded from the database and added to the Spring `SecurityContext` as a `GrantedAuthority` (`ROLE_CLIENT`, `ROLE_FREELANCER`, `ROLE_ADMIN`). Supports `@PreAuthorize`.
- **Rate limiting** — Auth endpoints (`/auth/login`, `/auth/register`) are limited to **10 requests per minute per IP** (configurable via `rate-limit.max-requests`).
- **Security headers** — `X-Frame-Options: DENY`, `X-Content-Type-Options`, HSTS enabled.
- **CORS** — All origins allowed in development. Lock down `allowedOriginPatterns` for production.

---

### Validation Rules

#### Register (`POST /auth/register`)

| Field | Rules |
|---|---|
| `name` | Required. Max 100 chars. Letters and spaces only. |
| `email` | Required. Valid email format. Max 255 chars. Normalized to lowercase. |
| `password` | Required. 8–100 chars. Must contain: uppercase, lowercase, digit, special char (`@$!%*?&`). |
| `phoneNumber` | Required. E.164-style format (e.g. `+12345678901`). |

#### Login (`POST /auth/login`)

| Field | Rules |
|---|---|
| `email` | Required. Valid email format. Max 255 chars. Normalized to lowercase. |
| `password` | Required. Max 100 chars. |

---

### Error Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps all exceptions to structured JSON:

| Exception | HTTP Status | Error Code |
|---|---|---|
| `EmailAlreadyExistsException` | 400 | `EMAIL_ALREADY_EXISTS` |
| `PhoneAlreadyExistsException` | 400 | `PHONE_ALREADY_EXISTS` |
| `InvalidCredentialsException` | 401 | `INVALID_CREDENTIALS` |
| `UserNotFoundException` | 404 | `USER_NOT_FOUND` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` (all field errors returned) |
| `HttpMessageNotReadableException` | 400 | `MALFORMED_REQUEST` |
| `HttpRequestMethodNotSupportedException` | 405 | `METHOD_NOT_ALLOWED` |
| `DataIntegrityViolationException` | 409 | `CONFLICT` |
| `Exception` (fallback) | 500 | `INTERNAL_SERVER_ERROR` |

> Login returns `INVALID_CREDENTIALS` for both unknown email and wrong password — intentional, to prevent email enumeration.

---

## Running Tests

Tests use an H2 in-memory database and do not require PostgreSQL.

```bash
# Run all tests
./mvnw test -Dspring.profiles.active=test

# Run a single test class
./mvnw test -Dspring.profiles.active=test -Dtest=AuthControllerTest

# Run a single test method
./mvnw test -Dspring.profiles.active=test -Dtest=AuthServiceTest#login_success_returnsToken
```

**Test coverage (24 tests across 4 classes):**

| Class | Type | Tests |
|---|---|---|
| `JwtServiceTest` | Unit | Token generation, email extraction, validation, expiry |
| `AuthServiceTest` | Unit (Mockito) | Register/login happy paths, duplicate email/phone, bad credentials |
| `AuthControllerTest` | Integration (H2) | Full HTTP round-trips, security, validation, error responses |
| `AppApplicationTests` | Integration | Spring context loads |

---

## Configuration Reference

`backend/app/src/main/resources/application.properties`

| Property | Default | Description |
|---|---|---|
| `spring.datasource.url` | `${DB_URL:jdbc:postgresql://localhost:5433/bidforge}` | JDBC URL |
| `spring.datasource.username` | `${DB_USERNAME:admin}` | DB username |
| `spring.datasource.password` | `${DB_PASSWORD:admin}` | DB password |
| `spring.jpa.hibernate.ddl-auto` | `update` | Schema management (`validate` + Flyway recommended for prod) |
| `spring.jpa.show-sql` | `false` | SQL logging (keep false in prod) |
| `server.port` | `8080` | HTTP port |
| `jwt.secret` | `${JWT_SECRET:...}` | HS256 signing key |
| `jwt.expiration` | `900000` | Token TTL in milliseconds (15 minutes) |
| `rate-limit.max-requests` | `10` | Max auth requests per IP per minute |

---

## Roadmap

| Service | Status | Notes |
|---|---|---|
| Auth Service | ✅ Done | JWT, BCrypt, RBAC, rate limiting |
| User Service | Planned | Profile management, skill tags |
| Job Service | Planned | Job posting, search, status lifecycle |
| Bidding Service | Planned | Bid placement, acceptance |
| Chat Service | Planned | Real-time messaging via WebSocket |
| Payment Service | Planned | Escrow workflow (INITIATED → HELD → RELEASED/REFUNDED/FAILED) |
| Notification Service | Planned | Email + in-app notifications |
| Matching Service | Planned | Skill/rating-based freelancer recommendations |

---

## Planned Architecture

```
Client
  └── API Gateway (routing, auth validation, rate limiting)
        ├── Auth Service       ← implemented
        ├── User Service
        ├── Job Service
        ├── Bidding Service
        ├── Chat Service (WebSocket)
        ├── Payment Service
        ├── Notification Service
        └── Matching Service

Event Bus (Apache Kafka)
  Topics: job_created · bid_placed · payment_success · message_sent

Caching: Redis (session data, rate limiting, pub/sub)
Storage: PostgreSQL (per-service databases)
Cloud: AWS (EC2/ECS, RDS, S3, MSK, CloudWatch)
```

**Architecture principles:** database-per-service, eventual consistency, stateless services, Saga pattern for distributed transactions, outbox pattern for reliable event publishing.
