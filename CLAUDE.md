# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BidForge is a real-time freelance marketplace backend (Fiverr/Upwork-style) built as a microservices system. The repository currently contains architectural documentation; implementation is in progress.

## Intended Stack

- **Language**: Java 21
- **Framework**: Spring Boot + Spring Cloud
- **Messaging**: Apache Kafka (event-driven, async inter-service communication)
- **Database**: PostgreSQL (one database per service)
- **Cache / Rate Limiting**: Redis
- **Real-Time**: WebSockets
- **Resilience**: Resilience4j (circuit breakers)
- **Observability**: Prometheus + Grafana metrics, Zipkin/Jaeger tracing, Spring Actuator health endpoints
- **Deployment**: Docker Compose locally, AWS (EC2, RDS, S3, CloudWatch) in production

## Commands (once implemented)

```bash
# Start all services
docker-compose up

# Run a single service
cd <service-name> && mvn spring-boot:run

# Run tests for a service
cd <service-name> && mvn test

# Run a single test class
cd <service-name> && mvn test -Dtest=ClassName
```

## Microservices Architecture

| Service | Responsibility |
|---|---|
| `api-gateway` | Request routing, JWT validation, rate limiting, load balancing, circuit breaking |
| `auth-service` | JWT + OAuth2 authentication and token management |
| `user-service` | User profiles for clients and freelancers |
| `job-service` | Job post lifecycle management |
| `bidding-service` | Real-time bid placement and status |
| `chat-service` | Client–freelancer messaging over WebSockets |
| `payment-service` | Escrow-based payments (Saga pattern) |
| `notification-service` | Email and in-app notifications |
| `matching-service` | Intelligent freelancer–job matching (skills, ratings, availability) |

## Key Architectural Decisions

**Database per service** — services never share a database. Cross-service reads go through the API, not direct DB access.

**Dual communication model**
- Synchronous: REST through the API Gateway
- Asynchronous: Kafka topics (`job_created`, `bid_placed`, `payment_success`, `message_sent`)

**Eventual consistency** — services consume Kafka events and update their own state; there is no distributed transaction except in the payment Saga.

**Payment state machine**: `INITIATED → HELD (escrow) → RELEASED | REFUNDED | FAILED`

**Reliability patterns to implement**: idempotent Kafka consumers, Outbox pattern for at-least-once delivery, Dead Letter Queues, retry with backoff.

## Typical Request Flow

1. Client POSTs a job → `job-service` saves it → publishes `job_created` to Kafka
2. `notification-service` consumes `job_created` → notifies matching freelancers
3. Freelancer places bid → `bidding-service` saves it → publishes `bid_placed`
4. `bidding-service` pushes WebSocket update to client in real time
5. Client accepts bid → `payment-service` runs escrow Saga
