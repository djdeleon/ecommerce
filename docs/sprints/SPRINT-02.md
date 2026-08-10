# 📦 Sprint 02: Product Catalog & Category Hierarchy

## 🎯 Objectives & Scope
The objective of Sprint 02 is to design and implement the robust backend data model and API endpoints representing the product schema and categories hierarchy, laying down structural bounds for secure merchant selling.

- [x] Implement self-referencing adjacency list table for hierarchical category mapping (#18)
- [x] Create vendor profile extensions linked to core identity tables (#19)
- [x] Develop primary product listings, unique slug generations, and status checks (#20)
- [x] Track product variations using secure, unique SKUs and decimal scale pricing (#21)
- [x] Author automated, immutable price change tracking ledgers for historical audit logs (#22)
- [x] Achieve complete test coverage using expressive Pest PHP features (TDD)

---

## 🛠️ Architectural Choices Made

### 1. Adjacency List Hierarchy
Instead of introducing complex nested set models or path enumeration, a self-referencing Adjacency List design was picked (`parent_id` referencing `id` on the same `product_categories` table). This provides straightforward parent-child queries and maintains high database simplicity for early sprints, while still allowing Nuxt.js to fetch deep hierarchy trees dynamically.

### 2. Multi-Tier Vendor Isolation
We decouple physical vendors from core accounts via a separate `vendors` profile table. When mutating products or catalog variables, authorization checks strictly isolate administrative actions so that active vendor sessions can never alter, delete, or retrieve unauthorized draft products belonging to another vendor storefront.

### 3. Change-Triggered Price Auditing
Rather than performing periodic sweeps, we leverage an observer-driven architectural trigger. Whenever a Product Variant price modification is detected, a non-reversible transaction insert automatically snapshots the old price, the new price, and the mutating user's ID into the `product_price_ledgers` table. This creates a secure, historical tracking ledger isolated from standard business CRUD pathways.

---

## 📈 Anticipated Architectural Compromises
* **Deep Nesting Query Performance:** As the hierarchy tree of category structures grows, recursive self-referencing queries can lead to an N+1 query problem. In a future sprint, this will be optimized by implementing Redis caching on category lookups or migrating to a Nested Set model.
* **Bulk Import Performance:** The current pricing audit model logs entries individually. Bulk price updating via CSV or external APIs will require optimized batch insert queries to prevent connection timeouts inside the PostgreSQL database.

## 📈 Technical Debt & Future Scope
- Search and filtering across large catalog volumes will be offloaded to Elasticsearch in upcoming search integration sprints.
- Complex attribute-set matrices (e.g., color/size combinations) will be expanded in future inventory management iterations.