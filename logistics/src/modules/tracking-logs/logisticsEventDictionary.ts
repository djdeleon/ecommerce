import { ShipmentStatus } from "@prisma/client";

type TrackingEventPayload = 
  | { status: 'PendingPickup' }
  | { status: 'ReadyForPickup' }
  | { status: 'PickedUp'; courierName?: string; plateNumber?: string }
  | { status: 'InTransit'; originHub?: string; destinationHub?: string }
  | { status: 'ArrivedAtHub'; hubName?: string; }
  | { status: 'OutForDelivery'; courierName?: string }
  | { status: 'Delivered' }
  | { status: 'FailedDelivery'; reason?: string }
  | { status: 'Rejected'; reason?: string }

export function generateEventDescription(payload: TrackingEventPayload) {
  switch (payload.status) {
    case ShipmentStatus.PendingPickup:
      return 'Shipment manifest generated. Awaiting package preparation by the merchant.';

    case ShipmentStatus.ReadyForPickup:
      return 'Parcel has been packed and is ready for courier collection.';

    case ShipmentStatus.PickedUp:
      return `Parcel successfully collected by courier ${payload.courierName} (${payload.plateNumber})`;

    case ShipmentStatus.InTransit:
      return `Parcel has departed from ${payload.originHub} and is in transit to ${payload.destinationHub}.`;

    case ShipmentStatus.ArrivedAtHub:
      return `Parcel arrived and sorted at fulfillment facility: ${payload.hubName}.`;

    case ShipmentStatus.OutForDelivery:
      return `Parcel is out for delivery. Courier ${payload.courierName} will attempt drop-off today.`;

    case ShipmentStatus.Delivered:
      return 'Parcel delivered successfully.';

    case ShipmentStatus.FailedDelivery:
      return `Delivery attempt unsuccessful. Reason: ${payload.reason}. A retry will be scheduled.`;

    case ShipmentStatus.Rejected:
      return `Shipment rejected by facility/courier. Reason: ${payload.reason}. Order returning to merchant.`;

    default:
      return 'Parcel processing state updated.';
  }
}