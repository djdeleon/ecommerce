# 📊 Database Architecture & Specifications

This document defines the global persistence layout, relationship properties, and sub-domain structural boundaries governing the platform.

> 🔗 **[Open Interactive Master Canvas on dbdiagram.io](https://dbdiagram.io/d/ecommerce-6a70022b067336e1de479b34)**

> 🔗 **[Database Schema ERD 1.0](/docs/assets/ERD-1.0.svg)**
---

## 🧩 Segregated Domain Blueprints

### 1. Identity & RBAC Domain
This domain governs core authentication criteria, social credentials, and granular permission sets.

```mermaid
erDiagram
    USERS {
        bigint id PK
        string name
        string email UK
        timestamp email_verified_at
        string password "Nullable for social logins"
    }
    ROLES {
        smallint id PK
        string name
        string guard_name
    }
    PERMISSIONS {
        smallint id PK
        string name
        string guard_name
    }
    ROLES_HAS_PERMISSIONS {
        smallint role_id FK
        smallint permission_id FK
    }

    ROLES ||--o{ ROLES_HAS_PERMISSIONS : contains
    PERMISSIONS ||--o{ ROLES_HAS_PERMISSIONS : standardizes
```

*Note: Polymorphic assignments (model_has_roles, model_has_permissions) are tracked at the application middleware layer to support dynamic cross-cutting authorization without enforcing rigid physical database-level constraints.*

### 2. Social Accounts Domain
This domain decouples third-party OAuth authentication tokens from the primary identity structures.

```mermaid
erDiagram
    SOCIAL_ACCOUNTS {
        bigint id PK
        bigint user_id FK
        string provider_name
        string provider_id
        string token
    }
    SHADOW_USERS {
        bigint id PK "Represents Users table from Identity Domain"
    }

    SHADOW_USERS ||--o{ SOCIAL_ACCOUNTS : links
```

### 3. Products Domain
This domain handles vendor associations, hierarchical categories, product definitions, variations, and immutable price tracking logs.

```mermaid
erDiagram
    VENDORS {
        int id PK
        bigint user_id FK
        string shop_name
        string business_tin
    }
    PRODUCTS {
        bigint id PK
        bigint vendor_id FK "Logical reference to Users table"
        smallint category_id FK
        string name
        string slug
        string description
        string status
    }
    PRODUCT_CATEGORIES {
        smallint id PK
        smallint parent_id "Self-reference (Adjacency List)"
        string name
        string slug
    }
    PRODUCT_VARIANTS {
        bigint id PK
        bigint product_id FK
        string sku UK
        decimal price
    }
    PRODUCT_PRICE_LEDGERS {
        bigint id PK
        bigint variant_id FK
        decimal old_price
        decimal new_price
        bigint changed_by_id FK "Logical reference to Users table"
        timestamp created_at
    }
    SHADOW_USERS {
        bigint id PK "Represents Users table from Identity Domain"
    }

    SHADOW_USERS ||--o{ VENDORS : profile_extensions
    SHADOW_USERS ||--o{ PRODUCTS : owns
    SHADOW_USERS ||--o{ PRODUCT_PRICE_LEDGERS : mutates
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : classifies
    PRODUCTS ||--o{ PRODUCT_VARIANTS : contains
    PRODUCT_VARIANTS ||--o{ PRODUCT_PRICE_LEDGERS : historicizes
```

### 4. Warehouse Domain
This domain manages dedicated merchant warehouses and platform-controlled fulfillment distribution centers.

```mermaid
erDiagram
    WAREHOUSES {
        int id PK
        bigint vendor_id FK "Logical reference to Users table"
        string address
    }
    FULFILLMENT_HUBS {
        int id PK
        string name
    }
    SHADOW_USERS {
        bigint id PK "Represents Users table from Identity Domain"
    }

    SHADOW_USERS ||--o{ WAREHOUSES : runs
```

### 5. Inventory Domain
This domain tracks stock levels and append-only entry logs across varying physical facilities using polymorphic routing.

```mermaid
erDiagram
    INVENTORY_STOCKS {
        bigint id PK
        bigint variant_id FK
        string inventorable_type "Polymorphic facility type"
        bigint inventorable_id "Polymorphic facility ID"
        smallint quantity_available
        smallint quantity_reserved
    }
    INVENTORY_LEDGERS {
        bigint id PK
        bigint inventory_stock_id FK
        bigint user_id FK "Logical reference to Users table"
        smallint delta_quantity
        string entry_type
    }
    SHADOW_PRODUCT_VARIANTS {
        bigint id PK "Represents variants from Product Domain"
    }
    SHADOW_USERS {
        bigint id PK "Represents Users table from Identity Domain"
    }

    SHADOW_PRODUCT_VARIANTS ||--o{ INVENTORY_STOCKS : quantifies
    SHADOW_USERS ||--o{ INVENTORY_LEDGERS : audits
    INVENTORY_STOCKS ||--o{ INVENTORY_LEDGERS : records
```

### 6. Shipments Domain
This domain tracks multi-stage shipping legs, driver configurations, and real-time transit logs.

```mermaid
erDiagram
    SHIPMENTS {
        bigint id PK
        bigint item_id FK "Logical reference to Order Items"
        string current_status
        string tracking_number UK
    }
    SHIPMENT_LEGS {
        bigint id PK
        bigint shipment_id FK
        string leg_type
        string originable_type "Polymorphic source location"
        bigint originable_id "Polymorphic source ID"
        string destinationable_type "Polymorphic target location"
        bigint destinationable_id "Polymorphic target ID"
        int assigned_driver_id FK
        string status
    }
    SHIPMENT_LOGS {
        bigint id PK
        bigint leg_id FK
        string status_tag
        bigint actor_id FK "Logical reference to Users table"
        string locationable_type "Polymorphic transit location"
        bigint locationable_id "Polymorphic transit ID"
        string description_status
        timestamp created_at
    }
    DRIVERS {
        int id PK
        bigint user_id FK
        string license_number
        int active_vehicle_id FK
        timestamp background_checked_at
    }
    DRIVER_VEHICLES {
        int id PK
        int driver_id FK
        string plate_number UK
        string vehicle_type
    }
    SHADOW_USERS {
        bigint id PK "Represents Users table from Identity Domain"
    }

    SHIPMENTS ||--o{ SHIPMENT_LEGS : pipelines
    SHIPMENT_LEGS ||--o{ SHIPMENT_LOGS : timestamps
    DRIVERS ||--o{ SHIPMENT_LEGS : fulfills
    DRIVERS ||--o{ DRIVER_VEHICLES : registers
    DRIVER_VEHICLES ||--o| DRIVERS : controls
    SHADOW_USERS ||--o| DRIVERS : activates
    SHADOW_USERS ||--o{ SHIPMENT_LOGS : updates
```
