import { Static, Type } from "@sinclair/typebox"

export const PARCEL_PATHS = {
  store: '/parcels',
}

const AddressSchema = Type.Object({
  region: Type.String({ minLength: 2 }),
  province: Type.String({ minLength: 2 }),
  city: Type.String({ minLength: 2 }),
  barangay: Type.String({ minLength: 2 }),
  full_address: Type.String({ minLength: 5 }),
  coordinates: Type.Object({
    longitude: Type.String({
      description: "Longitude as a string coordinate",
      examples: ["120.9842"]
    }),
    latitude: Type.String({
      description: "Latitude as a string coordinate",
      examples: ["14.5995"]
    }),
  }),
});

export const StoreSchema = {
  url: PARCEL_PATHS.store,
  body: Type.Object({
    merchant_details: Type.Object({
      name: Type.String({
        minLength: 2,
        description: "Name of the merchant store or sender",
        examples: ["Acme E-Commerce Store"]
      }),
      contact_number: Type.String({
        minLength: 7,
        maxLength: 15,
        description: "Contact phone number for the merchant or warehouse dispatcher",
        examples: ["09112233445"]
      }),
      pickup_address: AddressSchema,
    }),
    customer_details: Type.Object({
      name: Type.String({
        minLength: 2,
        description: "Full name of the recipient",
        examples: ["Jane Doe"]
      }),
      contact_number: Type.String({
        minLength: 7,
        maxLength: 15,
        description: "Active mobile or telephone number for delivery notifications and rider contact",
        examples: ["09123456789"]
      }),
      email: Type.String({
        format: 'email',
        description: "Recipient's email address for tracking updates and notifications",
        examples: ["jane.doe@example.com"]
      }),
      delivery_address: AddressSchema,
    }),
    parcel_info: Type.Object({
      weight_grams: Type.Number({
        minimum: 1,
        description: "Total physical weight of the parcel in grams",
        examples: [1500]
      }),
      length_cm: Type.Number({
        minimum: 0.1,
        description: "Package length in centimeters",
        examples: [25.5]
      }),
      width_cm: Type.Number({
        minimum: 0.1,
        description: "Package width in centimeters",
        examples: [15.0]
      }),
      height_cm: Type.Number({
        minimum: 0.1,
        description: "Package height in centimeters",
        examples: [10.0]
      }),
      item_description: Type.String({
        minLength: 3,
        description: "Brief description of the item(s) inside the parcel for customs/safety",
        examples: ["Wireless Mechanical Keyboard"]
      }),
      declared_value: Type.Number({
        minimum: 0,
        description: "Monetary value of the items declared for insurance purposes",
        examples: [2500.00]
      }),
    }),
    order_info: Type.Object({
      order_id: Type.String({
        minLength: 1,
        description: "External order reference ID from the merchant platform",
        examples: ["ORD-2026-00123"]
      }),
      tracking_number: Type.String({
        minLength: 3,
        description: "Unique tracking number generated or supplied for the order"
      }),
      service_type: Type.String({
        minLength: 2,
        description: "Shipping service level",
        examples: ["Standard", "Express", "Same-Day"]
      }),
      payment_method: Type.String({
        minLength: 2,
        description: "Payment mode used by the customer",
        examples: ["COD", "Prepaid", "Credit Card"]
      }),
      cod_amount: Type.Number({
        minimum: 0,
        description: "Cash on delivery amount to be collected (0 if fully prepaid)"
      }),
      currency: Type.String({
        minLength: 3,
        maxLength: 3,
        description: "ISO 4217 currency code",
        examples: ["PHP", "USD"]
      }),
    })
  })
}

export type StoreBody = Static<typeof StoreSchema.body>