# 🛒 Sprint 05: Order Processing & Checkout Domain

## 🎯 Objectives & Scope
The objective of Sprint 05 is to implement a secure, multi-vendor order processing engine. This system handles customer checkouts, executes transactional inventory reservation locks, handles payment status tracking, and calculates vendor escrow splits.

- [ ] Create migrations and models for `orders`, `order_items`, and `order_item_statuses` (#51)
- [ ] Implement `payments` and `seller_payout_ledgers` schemas for transactional bookkeeping (#52)
- [ ] Develop atomic checkout logic linking order creation with `InventoryStock::reserveStock()` (#53)
- [ ] Implement deterministic status state transitions for orders and itemized lines (#54)
- [ ] Author RESTful checkout APIs and multi-tenant isolation routes with Pest PHP (TDD) (#55)

---

## 🛠️ Architectural Choices Made

### 1. Granular Multi-Vendor Basket Deconstruction
Rather than treating an order as a single monolithic block, we deconstruct a customer's basket into explicit, isolated `order_items`. This is a vital architectural decision for multi-vendor systems:
*   The global checkout results in one `orders` header (representing the customer's total payment and invoice).
*   Individual items are routed dynamically to different vendors via `order_items.vendor_id`.
*   Statuses are tracked at the line-item level (`order_item_statuses`) so Vendor A can pack their item independently while Vendor B's item is still waiting for stock.

### 2. Snapshot Pricing & Financial Decoupling
To protect historical financial records from future catalog price changes, `order_items` records the exact `price_at_purchased` as a snapshot decimal value. Subtotals are written statically to the database, ensuring that any downstream catalog, variant, or tax adjustments cannot retroactively alter auditing ledgers.

### 3. All-or-Nothing Checkout Transactions
To prevent race conditions during high-volume checkout hits, the entire checkout pipeline (creating the order, inserting order items, reserving inventory, and creating the payment ledger) is wrapped in a unified PostgreSQL `DB::transaction()`. If a single item in a multi-item basket fails stock reservation limits, the database state automatically rolls back cleanly.

---

## 📈 Technical Debt & Future Scope
- **Payment Gateway Integration:** Real credit card/e-wallet processing (e.g., Stripe, GCash API integrations) is deferred to future sprints; this sprint implements payment simulation ledgers.
- **Shipment Pipeline Interceptor:** Automatic generation of shipment records (`shipments` and `shipment_legs`) upon successful transition of an order item status to `'paid'` will be hooked in once the Shipments Domain is unblocked.