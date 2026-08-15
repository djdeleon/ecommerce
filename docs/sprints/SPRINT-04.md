# 🚚 Sprint 04: Shipments & Logistics Domain

## 🎯 Objectives & Scope
The objective of Sprint 04 is to implement the logistics engine that orchestrates the movement of items from facilities to customers, manages the driver fleet, and provides real-time polymorphic tracking logs.

- [ ] Implement Driver profiles and Vehicle registration systems (#42)
- [ ] Create core Shipment records with unique tracking number generation (#43)
- [ ] Develop multi-stage Shipment Legs using polymorphic origin/destination routing (#44)
- [ ] Implement append-only Shipment Logs for real-time transit status updates (#45)
- [ ] Author comprehensive REST APIs for driver assignments and tracking lookups (#46)

---

## 🛠️ Architectural Choices Made

### 1. Multi-Stage Shipment Pipeline
Instead of a single "Status" column, we use **Shipment Legs**. This allows a package to travel through multiple hops (e.g., Warehouse ➔ Fulfillment Hub ➔ Customer) with different drivers assigned to each stage, providing superior logistics granularity.

### 2. Polymorphic Transit Locations
Following the pattern from the Inventory domain, shipment legs and logs use polymorphic relations (`originable`, `destinationable`, `locationable`). This allows a package to be "at" a Warehouse, a Fulfillment Hub, or even a specific Driver's Vehicle during transit.

### 3. Automated Tracking Identifiers
Shipments will utilize a non-sequential, unique tracking number generation strategy to prevent ID-scraping and provide a professional customer-facing interface.

---

## 📈 Technical Debt & Future Scope
- Integration with Real-time Map/GPS APIs.
- Webhook notifications for customer status updates (Out for Delivery/Delivered).
```