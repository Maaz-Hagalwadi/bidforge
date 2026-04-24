# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BidForge** is an early-stage freelance marketplace backend (Fiverr/Upwork-style). Currently only the auth module is implemented; the remaining microservices (Job, Bidding, Chat, Payment, Notification, Matching) are planned.

## Commands

All Maven commands run from `backend/app/`:

```bash
# Build
./mvnw clean install

# Run the application
./mvnw spring-boot:run

# Run all tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=AppApplicationTests

# Run a single test method
./mvnw test -Dtest=ClassName#methodName
```

## Prerequisites

PostgreSQL must be running on `localhost:5433` with:
- Database: `bidforge`
- Username: `admin`
- Password: `admin`

The app starts on port `8080`. Hibernate DDL-auto is `update` (schema auto-created on startup).

## Architecture

**Tech stack**: Java 21, Spring Boot 3.4.1, Spring Security, Spring Data JPA, PostgreSQL, JWT (jjwt 0.11.5), Lombok.

**Planned additions** (not yet implemented): Kafka event streaming, Redis caching, WebSocket, OAuth2, Docker/docker-compose, per-service databases.

### Package Structure (`com.bidforge.app`)

```
auth/           # AuthController, AuthService, JwtService, JwtAuthFilter
  dto/request/  # LoginRequest, RegisterRequest
  dto/response/ # LoginResponse
user/           # User entity, Role enum, UserRepository, UserResponse DTO
config/         # SecurityConfig, JwtAuthenticationEntryPoint, JwtAccessDeniedHandler
common/exception/ # GlobalExceptionHandler, ErrorResponse, custom exceptions
```

### Layer Flow

`AuthController` → `AuthService` → `UserRepository` (JPA) → PostgreSQL

### Security Model

- `SecurityConfig` marks `/auth/**` public; all other routes require a valid JWT.
- `JwtAuthFilter` (extends `OncePerRequestFilter`) extracts `Authorization: Bearer <token>`, validates via `JwtService`, and sets the `SecurityContext`.
- JWT expiry: 15 minutes (configured via `jwt.expiration` in `application.properties`).
- Passwords hashed with BCrypt.

### Auth Endpoints

| Method | Path | Auth Required |
|--------|------|--------------|
| POST | `/auth/register` | No |
| POST | `/login` | No |
| GET | `/auth/test` | Yes |

### Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps custom exceptions to HTTP status codes and returns an `ErrorResponse` (timestamp, status, error, message, path). Custom exceptions: `EmailAlreadyExistsException` (400), `PhoneAlreadyExistsException` (400), `UserNotFoundException` (404), `InvalidCredentialsException` (401).

## Key Configuration

`backend/app/src/main/resources/application.properties` — database URL, Hibernate settings, JWT secret, and JWT expiration. Do not commit real secrets here.

## Planned Microservices (README)

Event-driven architecture with Kafka topics (`job_created`, `bid_placed`, `payment_success`, `message_sent`). Escrow payment states: `INITIATED → HELD → RELEASED/REFUNDED/FAILED`. Real-time features via WebSocket.
