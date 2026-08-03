# 🏁 Sprint 00: Base Infrastructure Monorepo Setup & Bootstrapping

## 🎯 Objectives & Scope
The objective of Sprint 00 was to establish local container orchestration layers, isolate development environments, and create the testing scaffolding for both the client and application domains.

- [x] Scaffold standard monorepo folder layout (`backend-api`, `frontend-ui`, `docker`)
- [x] Configure localized `docker-compose.yaml` orchestration matrix
- [x] Provision core data networks (Nginx proxy, PostgreSQL instance, Redis broker, RabbitMQ cluster)
- [x] Configure environment variables and install the Pest PHP testing framework baseline
- [x] Implement local environment configuration file targets (`.env.example`)

---

## 🛠️ Architectural Choices Made

### 1. Hybrid Monorepo Pattern
Instead of managing multiple loose repositories during early-stage development, a monorepo structure was adopted. This pattern groups the codebases naturally while enforcing strict architectural segregation inside distinct container environments (`eco_laravel` and `eco_nuxt`).

### 2. Microservice Infrastructure Readiness
Even though the application layers currently function as a standard Headless Client and API Gateway architecture, the immediate inclusion of **RabbitMQ** prepares the platform for a smooth transition into decoupled asynchronous microservices.

### 3. Early Test Automation Scaffolding
Rather than treating testing as an afterthought, Pest PHP was bootstrapped alongside the initial Laravel setup during this sprint. This laid the foundation for the strict Test-Driven Development (TDD) cycle executed in subsequent feature developments.

---

## 📈 Technical Debt & Future Scope
* **Container Interdependency:** Containers currently lack explicit health checks. Services can boot out of order if the PostgreSQL container takes too long to accept TCP connections.
* **Asset Optimization:** Shared Docker volume mounts (`/var/www/html`) are configured for rapid local code changes but require separate optimized build pipelines for containerized production images.
