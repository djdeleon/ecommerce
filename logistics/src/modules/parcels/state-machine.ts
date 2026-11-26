import { ParcelStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Parcel Status Lifecycle (Happy Path & Exceptions)
 */
const PARCEL_TRANSITION_MATRIX: Record<ParcelStatus, ParcelStatus[]> = {
  // First-Mile Lifecycle
  [ParcelStatus.PendingPickup]: [ParcelStatus.ReadyForPickup, ParcelStatus.Rejected],
  [ParcelStatus.ReadyForPickup]: [ParcelStatus.PickedUp, ParcelStatus.Rejected],
  [ParcelStatus.PickedUp]: [ParcelStatus.ArrivedAtOriginHub],
  [ParcelStatus.ArrivedAtOriginHub]: [
    // For Distribution Center and Mega Gateway Facilities
    ParcelStatus.Sorting,

    // For Local Branch
    ParcelStatus.DepartedFromOriginHub
  ],
  [ParcelStatus.DepartedFromOriginHub]: [
    ParcelStatus.ArrivedAtHub,
    ParcelStatus.ArrivedAtDestinationHub,
    ParcelStatus.Sorting,
  ],

  // Mid-Mile Lifecycle
  [ParcelStatus.ArrivedAtHub]: [ParcelStatus.Sorting],
  [ParcelStatus.Sorting]: [ParcelStatus.Bagged],
  [ParcelStatus.Bagged]: [ParcelStatus.DepartedFromOriginHub, ParcelStatus.DepartedFromHub],
  [ParcelStatus.DepartedFromHub]: [ParcelStatus.ArrivedAtHub, ParcelStatus.ArrivedAtDestinationHub],
  [ParcelStatus.ArrivedAtDestinationHub]: [ParcelStatus.OutForDelivery],

  // Last-Mile Lifecycle
  [ParcelStatus.OutForDelivery]: [
    ParcelStatus.Delivered,
    ParcelStatus.FailedDelivery,
    ParcelStatus.Rejected,
  ],
  [ParcelStatus.FailedDelivery]: [ParcelStatus.OutForDelivery, ParcelStatus.Rejected],
  [ParcelStatus.Delivered]: [],
  [ParcelStatus.Rejected]: [],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canParcelTransitionTo(currentStatus: ParcelStatus, targetStatus: ParcelStatus): boolean {
  const allowedNextStates = PARCEL_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertParcelTransition(
  currentStatus: ParcelStatus,
  targetStatus: ParcelStatus,
  trackingNumber: string
) {
  if (!canParcelTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Parcel '${trackingNumber}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type TrackingEventPayload =
  | { status: 'PendingPickup' }
  | { status: 'ReadyForPickup' }
  | { status: 'PickedUp'; courierName?: string; plateNumber?: string }
  | { status: 'ArrivedAtOriginHub'; hubName?: string; }
  | { status: 'DepartedFromOriginHub'; hubName?: string; }
  | { status: 'ArrivedAtHub'; hubName?: string; }
  | { status: 'Sorting'; hubName?: string; }
  | { status: 'Bagged'; bagCode?: string; hubName?: string }
  | { status: 'DepartedFromHub'; hubName?: string; }
  | { status: 'ArrivedAtDestinationHub'; hubName?: string; }
  | { status: 'OutForDelivery'; courierName?: string }
  | { status: 'Delivered', recipientName: string; }
  | { status: 'FailedDelivery'; reason?: string }
  | { status: 'Rejected'; reason?: string }

export function generateParcelEventDescription(payload: TrackingEventPayload) {
  switch (payload.status) {
    case ParcelStatus.PendingPickup:
      return 'Parcel order created. Awaiting package preparation by the merchant.';

    case ParcelStatus.ReadyForPickup:
      return 'Parcel has been packed and is awaiting courier pickup.';

    case ParcelStatus.PickedUp:
      return `Parcel successfully picked up by courier${payload.courierName ? ` (${payload.courierName}${payload.plateNumber ? ` - ${payload.plateNumber}` : ''})` : ''}.`;

    case ParcelStatus.ArrivedAtOriginHub:
      return `Parcel has arrived at origin facility: ${payload.hubName ?? 'FSTFY Facility Hub'}.`;

    case ParcelStatus.DepartedFromOriginHub:
      return `Parcel has departed from origin facility (${payload.hubName ?? 'Mega Gateway'}) and is en route to the transit network.`;

    case ParcelStatus.ArrivedAtHub:
      return `Parcel has arrived and is undergoing processing at transit facility: ${payload.hubName ?? 'FSTFY Facility Hub'}.`;

    case ParcelStatus.Sorting:
      return `Parcel has completed sorting operations and departed from ${payload.hubName ?? 'FSTFY Facility Hub'}.`;

    case ParcelStatus.Bagged:
      return `Parcel has been securely consolidated into master bag${payload.bagCode ? ` (${payload.bagCode})` : ''} at ${payload.hubName ?? 'FSTFY Facility Hub'} and is awaiting dispatch.`;

    case ParcelStatus.DepartedFromHub:
      return `Parcel has departed from: ${payload.hubName ?? 'FSTFY Facility Hub'}.`;

    case ParcelStatus.ArrivedAtDestinationHub:
      return `Parcel has arrived at destination branch (${payload.hubName ?? 'FSTFY Facility Hub'}) and is being prepared for last-mile delivery.`;

    case ParcelStatus.OutForDelivery:
      return `Parcel is out for delivery. Assigned courier${payload.courierName ? ` (${payload.courierName})` : ''} is on the way to complete drop-off today.`;

    case ParcelStatus.Delivered:
      return `Parcel has been delivered successfully${payload.recipientName ? ` to ${payload.recipientName}` : ''}.`;

    case ParcelStatus.FailedDelivery:
      return `Delivery attempt unsuccessful. Reason: ${payload.reason}. A retry will be scheduled.`;

    case ParcelStatus.Rejected:
      return `Parcel rejected by facility/courier. Reason: ${payload.reason}. Order returning to merchant.`;

    default:
      return 'Parcel processing state updated.';
  }
}