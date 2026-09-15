type TrackingEventPayload = 
  | { status: 'pending_pickup' }
  | { status: 'ready_for_pickup' }
  | { status: 'picked_up'; courierName: string; plateNumber: string }
  | { status: 'in_transit'; originHub: string; destinationHub: string }
  | { status: 'arrived_at_hub'; hubName: string; }
  | { status: 'out_for_delivery'; courierName: string }
  | { status: 'delivered' }
  | { status: 'failed_delivery'; reason: string }
  | { status: 'rejected'; reason: string }

export function generateEventDescription(payload: TrackingEventPayload) {
  switch (payload.status) {
    case 'pending_pickup':
      return 'Shipment manifest generated. Awaiting package preparetion by the merchant.';

    case 'ready_for_pickup':
      return 'Parcel has been packed and is ready for courier collection.';

    case 'picked_up':
      return `Parcel successfully collected by order ${payload.courierName} (${payload.plateNumber})`;

    case 'in_transit':
      return `Parcel has departed from ${payload.originHub} and is in transit to ${payload.destinationHub}.`;

    case 'arrived_at_hub':
      return `Parcel arrived and sorted at fulfillment facility: ${payload.hubName}.`;

    case 'out_for_delivery':
      return `Parcel is out for delivery. Courier ${payload.courierName} will attempt drop-off today.`;

    case 'delivered':
      return 'Parcel delivered successfully.';

    case 'failed_delivery':
      return `Delivery attempt unsuccessful. Reason: ${payload.reason}. A retry will be scheduled.`;

    case 'rejected':
      return `Shipment rejected by facility/courier. Reason: ${payload.reason}. Order returning to merchant.`;

    default:
      return 'Parcel processing state updated.'
  }
}