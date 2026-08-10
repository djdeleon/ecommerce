# 🏬 Sprint 03: Warehouse Facilities & Inventory Management

## 🎯 Objectives & Scope
The objective of Sprint 03 is to implement the backend structures and APIs governing physical storage facilities, stock allocation across multi-location hubs, and append-only auditing ledgers for all inventory adjustments.

- [ ] Create data models and migration tables for `warehouses` and `fulfillment_hubs` (#34)
- [ ] Implement polymorphic inventory stock tracking (`inventorable_type` / `inventorable_id`) across facilities (#35)
- [ ] Implement stock availability tracking with strict reserved vs. available quantity calculations (`INVENTORY_STOCKS`) (#36)
- [ ] Develop append-only audit ledgers (`INVENTORY_LEDGERS`) for historical stock movements and entry tracking (#37)
- [ ] Author comprehensive automated Pest PHP tests for inventory operations, ledger entries, and vendor isolation (TDD) (#38)

---

## 🛠️ Architectural Choices Made

### 1. Polymorphic Facility Routing
Instead of creating separate inventory tables for vendor-owned warehouses versus platform-managed fulfillment centers, a polymorphic relation (`inventorable_type` and `inventorable_id`) is used in `INVENTORY_STOCKS`. This decouples physical storage structures from stock management while allowing multi-location stock queries.

### 2. Immutable Append-Only Inventory Ledgers
Direct stock quantity updates without audit records present significant reconciliation risks. Sprint 03 enforces an append-only transaction ledger (`INVENTORY_LEDGERS`). Any delta in `quantity_available` or `quantity_reserved` must record an accompanying ledger entry specifying the acting user (`user_id`), quantity delta (`delta_quantity`), and operational rationale (`entry_type`).

### 3. Concurrency & Reserved Stock Isolation
Stock logic strictly separates `quantity_available` from `quantity_reserved`. This prevents double-allocation during high-concurrency checkout flows before items are formally transferred to the shipment pipeline.

---

## 📈 Technical Debt & Future Scope
*To be populated during retrospective/sprint completion.*