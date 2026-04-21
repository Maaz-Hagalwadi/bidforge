Bidforge
🚀 Real-Time Freelance Marketplace (Event-Driven Backend)

A production-grade backend system inspired by platforms like Fiverr and Upwork, designed to demonstrate modern backend engineering practices including microservices, event-driven architecture, real-time communication, and scalable cloud deployment.

⚡ This project focuses on engineering depth, scalability, and real-world system design, not just features.

📌 Overview

This system enables clients to post jobs, freelancers to bid, and both parties to communicate and complete work using a secure escrow-based payment system.

Built with:

Event-driven architecture (Kafka)
Microservices (Spring Boot)
Real-time communication (WebSockets)
Distributed caching (Redis)
Cloud-native deployment (AWS)
🧠 Key Highlights
⚡ Event-driven architecture using Apache Kafka
🔄 Microservices with Spring Boot & Spring Cloud
💬 Real-time communication via WebSockets
⚡ Redis for caching, rate limiting, and pub/sub
💳 Escrow-based payment workflow (simulated)
🔐 Secure authentication with JWT + OAuth2
☁️ Cloud-ready architecture (AWS)
🏗️ Architecture
🔹 High-Level Components
API Gateway
Auth Service
User Service
Job Service
Bidding Service
Chat Service
Payment Service
Notification Service
Matching Service
🔹 Architecture Principles
Database per service
Loose coupling via Kafka
Eventual consistency
Scalable stateless services
Separation of sync vs async communication
🔄 Communication Patterns
✅ Synchronous (Immediate Response)
REST APIs (via API Gateway)
⚡ Asynchronous (Event-Driven)
Kafka topics for inter-service communication
⚡ Event-Driven Design (Kafka)
📌 Topics
job_created
bid_placed
payment_success
message_sent
🔄 Example Flow
Client creates job → job_created
Notification service consumes → notifies freelancers
Freelancer places bid → bid_placed
Real-time update pushed via WebSocket
🌐 Real-Time Features
Live bidding updates
Real-time chat system
Typing indicators
Online/offline presence tracking
💳 Escrow Payment Workflow
Client funds are locked in escrow
Freelancer completes job
Funds are released upon approval
Payment States:
INITIATED
HELD (Escrow)
RELEASED
REFUNDED
FAILED
🗄️ Tech Stack
Layer	Technology
Backend	Java 21, Spring Boot
Microservices	Spring Cloud
Messaging	Apache Kafka
Database	PostgreSQL
Cache	Redis
Realtime	WebSockets
Container	Docker
Cloud	AWS (EC2, RDS, S3, CloudWatch)
🔐 Security
JWT-based authentication
OAuth2 login support
Role-Based Access Control (RBAC)
Client
Freelancer
Admin
⚙️ API Gateway Responsibilities
Request routing
Authentication validation
Rate limiting (Redis-based)
Logging & monitoring
Load balancing
Circuit breaking (Resilience4j)
🧠 Advanced Engineering Concepts
✅ Event Handling
Idempotent consumers
Retry mechanisms
Dead Letter Queues (DLQ)
✅ Data Consistency
Eventual consistency
Outbox pattern (recommended)
✅ Distributed Transactions
Saga pattern for payment & job workflows
📊 Observability
Logging (centralized)
Metrics (Prometheus + Grafana)
Distributed tracing (Zipkin/Jaeger)
Health checks (Spring Actuator)
🧩 Core Features
Job posting & management
Real-time bidding system
Chat between client & freelancer
Escrow payment system
Notification system (email/in-app)
Smart freelancer-job matching
🤖 Matching Service

Matches freelancers to jobs based on:

Skills
Ratings
Past performance
Availability
🚨 Failure Handling
Kafka failures handled via retries
Payment idempotency to prevent double charges
Service fallback strategies
Dead letter queues for failed events
🧪 Running Locally
# Clone repository
git clone <repo-url>

# Start all services
docker-compose up

# Run individual service
cd auth-service
mvn spring-boot:run
☁️ Deployment (AWS)
EC2 / ECS → Microservices
RDS → PostgreSQL
S3 → File storage
MSK / Kafka Cluster → Event streaming
CloudWatch → Logging & monitoring
📈 Scalability Considerations
Horizontal scaling of services
Redis caching for performance
Kafka partitioning for throughput
Read replicas for databases
🔮 Future Improvements
🔍 Elasticsearch for advanced job search
🎥 WebRTC for video communication
🤖 AI-based freelancer recommendations
🧵 Full distributed tracing implementation
🛡️ Fraud detection system
⚖️ Dispute resolution system
💼 Resume Impact

This project demonstrates:

Scalable microservices architecture
Event-driven system design
Real-time system implementation
Distributed systems engineering
Payment workflow design (escrow)
📚 Learning Outcomes
Designing production-grade backend systems
Handling distributed system failures
Building real-time applications
Implementing event-driven architecture
