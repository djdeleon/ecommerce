import { PhysicalVehicleStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Physical Vehicle Fleet Lifecycle
 */
const PHYSICAL_VEHICLE_TRANSITION_MATRIX: Record<PhysicalVehicleStatus, PhysicalVehicleStatus[]> = {
  [PhysicalVehicleStatus.Available]: [PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.Maintenance],
  [PhysicalVehicleStatus.InTransit]: [PhysicalVehicleStatus.Available, PhysicalVehicleStatus.Maintenance],
  [PhysicalVehicleStatus.Maintenance]: [PhysicalVehicleStatus.Available],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canPhysicalVehicleTransitionTo(
  currentStatus: PhysicalVehicleStatus,
  targetStatus: PhysicalVehicleStatus
): boolean {
  const allowedNextStates = PHYSICAL_VEHICLE_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertPhysicalVehicleTransition(
  currentStatus: PhysicalVehicleStatus,
  targetStatus: PhysicalVehicleStatus,
  plateNumber: string
) {
  if (!canPhysicalVehicleTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Physical Vehicle '${plateNumber}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type PhysicalVehicleEventPayload =
  | { status: 'Available'; facilityName?: string }
  | { status: 'InTransit'; transportCode?: string; destinationName?: string }
  | { status: 'Maintenance'; reason?: string };

export function generatePhysicalVehicleEventDescription(payload: PhysicalVehicleEventPayload): string {
  switch (payload.status) {
    case PhysicalVehicleStatus.Available:
      return `Vehicle is available and parked${payload.facilityName ? ` at facility ${payload.facilityName}` : ''}, ready for fleet transport assignment.`;

    case PhysicalVehicleStatus.InTransit:
      return `Vehicle has been dispatched${payload.transportCode ? ` on transport ${payload.transportCode}` : ''}${payload.destinationName ? ` en route to ${payload.destinationName}` : ''}.`;

    case PhysicalVehicleStatus.Maintenance:
      return `Vehicle has been pulled out of service for maintenance. Reason: ${payload.reason ?? 'Routine checkup / repairs'}.`;

    default:
      return 'Vehicle status updated.';
  }
}