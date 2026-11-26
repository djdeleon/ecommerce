import { ParcelStatus } from "@prisma/client";

type TrackingEventPayload =
  | { status: 'PendingPickup' }
  | { status: 'ReadyForPickup' }
  | { status: 'PickedUp'; courierName?: string; plateNumber?: string }
  | { status: 'Bagged'; }
  | { status: 'DepartedFromHub'; hubName?: string; }
  | { status: 'ArrivedAtOriginHub'; hubName?: string; }
  | { status: 'InTransit'; originHub?: string; destinationHub?: string }
  | { status: 'ArrivedAtHub'; hubName?: string; }
  | { status: 'ArrivedAtDestinationHub'; hubName?: string; }
  | { status: 'OutForDelivery'; courierName?: string }
  | { status: 'Delivered' }
  | { status: 'FailedDelivery'; reason?: string }
  | { status: 'Rejected'; reason?: string }

export function generateEventDescription(payload: TrackingEventPayload) {
  switch (payload.status) {
    case ParcelStatus.PendingPickup:
      return 'Shipment manifest generated. Awaiting package preparation by the merchant.';

    case ParcelStatus.ReadyForPickup:
      return 'Parcel has been packed and is ready for courier collection.';

    case ParcelStatus.PickedUp:
      return `Parcel successfully collected by courier ${payload.courierName} (${payload.plateNumber})`;

    case ParcelStatus.Bagged:
      return `Parcel is bagged and waiting to be departed.`;

    case ParcelStatus.DepartedFromHub:
      return `Parcel has departed from ${payload.hubName ?? 'hub'}.`;

    case ParcelStatus.ArrivedAtOriginHub:
      return `Parcel arrived at ${payload.hubName}.`;

    case ParcelStatus.InTransit:
      return `Parcel has departed from ${payload.originHub} and is in transit to ${payload.destinationHub}.`;

    case ParcelStatus.ArrivedAtHub:
      return `Parcel arrived and sorted at fulfillment facility: ${payload.hubName}.`;
      
    case ParcelStatus.ArrivedAtDestinationHub:
      return `Parcel arrived at ${payload.hubName}.`;

    case ParcelStatus.OutForDelivery:
      return `Parcel is out for delivery. Courier ${payload.courierName} will attempt drop-off today.`;

    case ParcelStatus.Delivered:
      return 'Parcel delivered successfully.';

    case ParcelStatus.FailedDelivery:
      return `Delivery attempt unsuccessful. Reason: ${payload.reason}. A retry will be scheduled.`;

    case ParcelStatus.Rejected:
      return `Shipment rejected by facility/courier. Reason: ${payload.reason}. Order returning to merchant.`;

    default:
      return 'Parcel processing state updated.';
  }
}