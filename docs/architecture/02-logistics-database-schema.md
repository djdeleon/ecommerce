# 📊 Logistics Database Schema

> 🔗 **[Open Interactive Master Canvas on dbdiagram.io](https://dbdiagram.io/d/ecommerce-6a70022b067336e1de479b34)**

> 🔗 **[Logistics Database Schema ERD 1.0](/docs/assets/logistics-erd-1.0.png)**
---
## 🧩 Segregated Domain Blueprints

### 1. Core Transit & Shipment Domain
This domain manages the lifecycle of order packages ingested from external e-commerce systems, tracking their immediate state mutations and structural operational properties.

```mermaid
erDiagram
    SHIPMENTS {
        bigint id PK
        string tracking_number UK
        string external_order_id "From Laravel"
        string provider_name "e.g., internal, jt, flash"
        string sender_name
        string sender_phone_number
        string sender_address
        string recipient_name
        string recipient_phone_number
        string recipient_address
        decimal recipient_latitude
        decimal recipient_longitude
        decimal weight_kg
        string status "Default: pending_pickup"
        bigint current_network_id FK "Nullable"
        bigint assigned_courier_id FK "Nullable"
        timestamptz created_at
    }
    SHADOW_NETWORKS {
        bigint id PK "Represents Networks table"
    }
    SHADOW_COURIERS {
        bigint id PK "Represents Couriers table"
    }

    SHADOW_NETWORKS ||--o{ SHIPMENTS : "currently holds"
    SHADOW_COURIERS ||--o{ SHIPMENTS : "manages delivery for"

```
Note: current_network_id and assigned_courier_id remain entirely optional during early lifecycle phases (e.g., pending_pickup) to prevent database constraint errors prior to active fulfillment dispatching.

### 2. Network Nodes & Fleet Domain
This domain establishes physical geographic operations hubs alongside the asset management infrastructure governing couriers.

```mermaid
erDiagram
    NETWORKS {
        bigint id PK
        string name
        string code UK "e.g., HUB-MNL-01"
        string type "sorting_hub, branch, etc."
        string address
        decimal latitude
        decimal longitude
    }
    COURIERS {
        bigint id PK
        string first_name
        string last_name
        string phone_number UK
        string vehicle_type "motorcycle, van, truck"
        string plate_number UK
        string status "active, inactive, on_delivery"
        bigint current_network_id FK "Nullable"
    }

    NETWORKS ||--o{ COURIERS : "stations / rosters"
```

### 3. Historical Telemetry & Auditing Domain
This domain decouples chronological transit tracking, history capturing, and sequence auditing from active transaction processing engines.

```mermaid
erDiagram
    TRACKING_LOGS {
        bigint id PK
        bigint shipment_id FK
        string status
        string description
        bigint network_id FK "Null on delete"
        bigint courier_id FK "Null on delete"
    }
    SHADOW_SHIPMENTS {
        bigint id PK "Represents Shipments table"
    }
    SHADOW_NETWORKS {
        bigint id PK "Represents Networks table"
    }
    SHADOW_COURIERS {
        bigint id PK "Represents Couriers table"
    }

    SHADOW_SHIPMENTS ||--o{ TRACKING_LOGS : "logs history for"
    SHADOW_NETWORKS ||--o{ TRACKING_LOGS : "records location event"
    SHADOW_COURIERS ||--o{ TRACKING_LOGS : "attributes action to"
```
