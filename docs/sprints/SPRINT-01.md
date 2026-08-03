# 🔑 Sprint 01: Core Auth, RBAC & Profile Domains

## 🎯 Objectives & Scope
The focus of Sprint 01 was implementing system security, defining explicit identity domains, and securing API routes via strict Test-Driven Development.

- [x] Design and finalize foundational ERD 1.0 schema mappings
- [x] Configure database-backed token authentication infrastructure via Laravel Sanctum (#2, #4)
- [x] Implement Spatie Role-Based Access Control (RBAC) schemas and custom middleware (#6)
- [x] Establish isolated profile dashboards for Customers, Vendors, Drivers, and Administrators (#8, #10, #12, #14)
- [x] Author comprehensive feature test coverage for all endpoints using Pest PHP (TDD)
- [ ] *Deferred to Backlog:* OAuth Social Media Authentication (Google/Facebook)

---

## 🛠️ Architectural Choices Made

### 1. Test-Driven Development with Pest PHP
Every route, authentication challenge, and RBAC middleware rule in this sprint was authored using a test-first approach. Adopting Pest facilitated the creation of an expressive, high-speed test suite, ensuring that downstream architectural refactoring (such as migrating Sanctum to a stateless JWT framework) can occur without risking regressions across active user profiles.

### 2. Unified Token-Based API Authentication
Instead of standard cookie or session verification, token-based authentication via Laravel Sanctum was implemented to handle inbound traffic from the decoupled NuxtJS frontend. This pattern keeps the client layer isolated and establishes a standardized token authorization header workflow across all endpoints.

### 3. Polymorphic Multi-Vendor Profiles
Rather than creating distinct authentication tables for each platform actor type, all core identities reside within a centralized `users` table. Specific operational roles (Customer, Vendor, Driver, Admin) are enforced via Spatie RBAC data structures and systematically extended through decoupled, dedicated profile tables.

---

## 📈 Technical Debt & Future Scope
* **Transition to Stateless Identity:** Because Laravel Sanctum evaluates the database-backed `personal_access_tokens` table on every inbound request, a database bottleneck is introduced at scale. Prior to introducing independent Go microservices, migration to a stateless JWT architecture is required to allow secondary workers to verify signatures cryptographically without hitting the primary PostgreSQL cluster.
* **Scope Management (OAuth Deferral):** To protect the core delivery timeline and isolate data model stability, OAuth integration was deferred back to the product backlog.
