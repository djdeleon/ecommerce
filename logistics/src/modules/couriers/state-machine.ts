import { CourierStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Courier Status Lifecycle
 */
const COURIER_TRANSITION_MATRIX: Record<CourierStatus, CourierStatus[]> = {
  [CourierStatus.Offline]: [CourierStatus.Available],
  [CourierStatus.Available]: [CourierStatus.Busy, CourierStatus.Offline],
  [CourierStatus.Busy]: [CourierStatus.Available, CourierStatus.Offline],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canCourierTransitionTo(currentStatus: CourierStatus, targetStatus: CourierStatus): boolean {
  const allowedNextStates = COURIER_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertCourierTransition(
  currentStatus: CourierStatus,
  targetStatus: CourierStatus,
  courierName: string
) {
  if (!canCourierTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Courier '${courierName}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type CourierEventPayload =
  | { status: 'Offline'; reason?: string }
  | { status: 'Available'; facilityName?: string }
  | { status: 'Busy'; deliveryCode?: string; taskType?: string };

export function generateCourierEventDescription(payload: CourierEventPayload): string {
  switch (payload.status) {
    case CourierStatus.Offline:
      return `Courier is currently offline and off-duty${payload.reason ? `. Reason: ${payload.reason}` : '.'}`;

    case CourierStatus.Available:
      return `Courier is online, available, and ready for assignment${payload.facilityName ? ` at ${payload.facilityName}` : ''}.`;

    case CourierStatus.Busy:
      return `Courier is currently busy on an active ${payload.taskType ?? 'delivery run'}${payload.deliveryCode ? ` (${payload.deliveryCode})` : ''}.`;

    default:
      return 'Courier status updated.';
  }
}