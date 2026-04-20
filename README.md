# bidforge
Event-driven real-time freelance marketplace built with Spring Boot, Kafka, Redis, WebSockets, and microservices


# 🚀 Real-Time Freelance Marketplace (Event-Driven Backend)

## 📌 Overview

A production-grade backend system inspired by platforms like Fiverr/Upwork, designed to demonstrate **modern backend engineering practices** including microservices, event-driven architecture, real-time communication, and scalable cloud deployment.

This project focuses on **engineering depth**, not just features.

---

## 🧠 Key Highlights

- ⚡ Event-driven architecture using **Apache Kafka**
    
- 🔄 Microservices with **Spring Boot**
    
- 💬 Real-time communication using **WebSockets**
    
- ⚡ Redis for caching, rate limiting, and pub/sub
    
- 💳 Escrow-based payment workflow (simulated)
    
- ☁️ AWS-ready deployment architecture
    
- 🔐 Secure authentication (JWT + OAuth2)
    

---

## 🏗️ Architecture

### High-Level Architecture Diagram

```mermaid
graph TD
    Client[Client Apps (Web/Mobile)] -->|HTTP/WebSocket| APIGW[API Gateway]

    APIGW --> AUTH[Auth Service]
    APIGW --> USER[User Service]
    APIGW --> JOB[Job Service]
    APIGW --> BID[Bidding Service]
    APIGW --> CHAT[Chat Service (WebSocket)]
    APIGW --> PAY[Payment Service]

    JOB -->|job_created| KAFKA[(Kafka Cluster)]
    BID -->|bid_placed| KAFKA
    PAY -->|payment_success| KAFKA
    CHAT -->|message_sent| KAFKA

    KAFKA --> NOTIF[Notification Service]
    KAFKA --> MATCH[Matching Service]

    CHAT <-->|Pub/Sub| REDIS[(Redis)]
    BID <-->|Cache/Rate Limit| REDIS
    USER <-->|Cache| REDIS

    AUTH --> DB1[(PostgreSQL)]
    USER --> DB2[(PostgreSQL)]
    JOB --> DB3[(PostgreSQL)]
    BID --> DB4[(PostgreSQL)]
    CHAT --> DB5[(PostgreSQL)]
    PAY --> DB6[(PostgreSQL)]

    PAY --> EXT[Payment Gateway (Stripe/Razorpay)]

    NOTIF --> EMAIL[Email/SMS Service]

    subgraph AWS Cloud
        APIGW
        AUTH
        USER
        JOB
        BID
        CHAT
        PAY
        NOTIF
        MATCH
        REDIS
        KAFKA
    end
```

### Microservices

- **API Gateway** – Entry point, routing, auth validation
    
- **Auth Service** – JWT, OAuth2 login
    
- **User Service** – Profiles, roles, ratings
    
- **Job Service** – Job creation & management
    
- **Bidding Service** – Real-time bidding logic
    
- **Chat Service** – WebSocket-based messaging
    
- **Payment Service** – Escrow & transaction handling
    
- **Notification Service** – Email & in-app notifications (Kafka consumers)
    
- **Matching Service** – Async freelancer-job matching (Kafka consumer)
    

---

## ⚡ Event-Driven Design (Kafka)

### Topics

- `job_created`
    
- `bid_placed`
    
- `payment_success`
    
- `message_sent`
    

### Example Flow

1. User creates job → `job_created`
    
2. Notification service consumes → notifies freelancers
    
3. Freelancer places bid → `bid_placed`
    
4. WebSocket service pushes update in real-time
    

---

## 🌐 Real-Time Features

- Live bidding updates
    
- Real-time chat
    
- Typing indicators
    
- Online/offline presence tracking
    

---

## 🗄️ Tech Stack

- **Backend:** Java 21, Spring Boot
    
- **Microservices:** Spring Cloud
    
- **Messaging:** Apache Kafka
    
- **Database:** PostgreSQL
    
- **Cache:** Redis
    
- **Realtime:** WebSockets
    
- **Containerization:** Docker
    
- **Cloud:** AWS (EC2, RDS, S3, CloudWatch)
    

---

## 🔥 Advanced Features

### 💡 Escrow Payment System

- Funds locked on hiring
    
- Released after job completion
    
- Handles retries & failures
    

### 💡 Rate Limiting

- Redis-based API throttling
    
- Prevents abuse/spam
    

### 💡 Smart Matching

- Kafka-based async processing
    
- Matches freelancers to jobs
    

### 💡 Observability

- Logging & monitoring
    
- Health checks (Spring Actuator)
    

---

## 🧪 Running Locally

```bash
# Clone repo
git clone <repo-url>

# Start services
docker-compose up

# Run individual service
cd auth-service
mvn spring-boot:run
```

---

## ☁️ Deployment (AWS)

- EC2 / ECS for services
    
- RDS for PostgreSQL
    
- S3 for file storage
    
- MSK (Kafka) or self-hosted Kafka
    
- CloudWatch for logs
    

---

## 📊 Future Improvements

- ElasticSearch for advanced search
    
- WebRTC for video communication
    
- AI-based freelancer recommendation
    
- Distributed tracing (Zipkin)
    

---

## 💼 Resume Impact

This project demonstrates:

- Scalable microservices architecture
    
- Event-driven system design
    
- Real-time system implementation
    
- Production-level backend engineering
    

---

## 📬 Contact

For queries or collaboration, feel free to connect.
