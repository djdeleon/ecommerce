import { DeliveryStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Last-Mile Delivery Lifecycle
 */
const DELIVERY_TRANSITION_MATRIX: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.Scheduled]: [DeliveryStatus.Loading, DeliveryStatus.Dispatched],
  [DeliveryStatus.Loading]: [DeliveryStatus.Dispatched, DeliveryStatus.Scheduled],
  [DeliveryStatus.Dispatched]: [DeliveryStatus.Arrived, DeliveryStatus.Completed],
  [DeliveryStatus.Arrived]: [DeliveryStatus.Completed],
  [DeliveryStatus.Completed]: [],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canDeliveryTransitionTo(currentStatus: DeliveryStatus, targetStatus: DeliveryStatus): boolean {
  const allowedNextStates = DELIVERY_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertDeliveryTransition(
  currentStatus: DeliveryStatus,
  targetStatus: DeliveryStatus,
  deliveryCode: string
) {
  if (!canDeliveryTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Delivery '${deliveryCode}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type DeliveryEventPayload =
  | { status: 'Scheduled'; sectorCode?: string }
  | { status: 'Loading'; totalParcels?: number; currentWeightGrams?: number }
  | { status: 'Dispatched'; courierName?: string; plateNumber?: string }
  | { status: 'Arrived'; sectorCode?: string }
  | { status: 'Completed'; totalDelivered?: number };

export function generateDeliveryEventDescription(payload: DeliveryEventPayload): string {
  switch (payload.status) {
    case DeliveryStatus.Scheduled:
      return `Last-mile delivery run${payload.sectorCode ? ` for sector ${payload.sectorCode}` : ''} has been scheduled.`;

    case DeliveryStatus.Loading:
      return `Delivery vehicle is currently being loaded with ${payload.totalParcels ?? 'multiple'} parcels (${payload.currentWeightGrams ?? 0}g).`;

    case DeliveryStatus.Dispatched:
      return `Delivery run has been dispatched. Assigned courier${payload.courierName ? ` (${payload.courierName}${payload.plateNumber ? ` - ${payload.plateNumber}` : ''})` : ''} is on route.`;

    case DeliveryStatus.Arrived:
      return `Delivery team has arrived at the target delivery zone${payload.sectorCode ? ` (${payload.sectorCode})` : ''}.`;

    case DeliveryStatus.Completed:
      return `Delivery run successfully completed. ${payload.totalDelivered ? `${payload.totalDelivered} parcels dropped off.` : ''}`;

    default:
      return 'Delivery run status updated.';
  }
}