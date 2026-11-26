import { MasterBagStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Master Bag Lifecycle (Happy Path & Exceptions)
 */
const MASTER_BAG_TRANSITION_MATRIX: Record<MasterBagStatus, MasterBagStatus[]> = {
  [MasterBagStatus.Open]: [MasterBagStatus.Full, MasterBagStatus.Sealed, MasterBagStatus.Dispatched],
  [MasterBagStatus.Full]: [MasterBagStatus.Sealed, MasterBagStatus.Open],
  [MasterBagStatus.Sealed]: [MasterBagStatus.Dispatched, MasterBagStatus.Open], // Allow re-opening if sealed by mistake before dispatch
  [MasterBagStatus.Dispatched]: [MasterBagStatus.Delivered],
  [MasterBagStatus.Delivered]: [MasterBagStatus.Unbagged],
  [MasterBagStatus.Unbagged]: [],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canMasterBagTransitionTo(currentStatus: MasterBagStatus, targetStatus: MasterBagStatus): boolean {
  const allowedNextStates = MASTER_BAG_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertMasterBagTransition(
  currentStatus: MasterBagStatus,
  targetStatus: MasterBagStatus,
  bagCode: string
) {
  if (!canMasterBagTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Master Bag '${bagCode}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type MasterBagEventPayload =
  | { status: 'Open'; facilityName?: string }
  | { status: 'Full'; totalParcels?: number; totalWeight?: number }
  | { status: 'Sealed'; bagCode?: string; sealedAt?: Date }
  | { status: 'Dispatched'; transportCode?: string; nextFacilityName?: string }
  | { status: 'Delivered'; facilityName?: string }
  | { status: 'Unbagged'; facilityName?: string };

export function generateMasterBagEventDescription(payload: MasterBagEventPayload): string {
  switch (payload.status) {
    case MasterBagStatus.Open:
      return `Master bag has been created and is open for parcel consolidation${payload.facilityName ? ` at ${payload.facilityName}` : ''}.`;

    case MasterBagStatus.Full:
      return `Master bag has reached capacity limit with ${payload.totalParcels ?? 'multiple'} parcels (${payload.totalWeight ?? 0}g) and is ready for sealing.`;

    case MasterBagStatus.Sealed:
      return `Master bag ${payload.bagCode ?? ''} has been securely sealed and is ready for fleet transport dispatch.`;

    case MasterBagStatus.Dispatched:
      return `Master bag loaded onto transport${payload.transportCode ? ` (${payload.transportCode})` : ''} en route to next facility: ${payload.nextFacilityName ?? 'Destination Hub'}.`;

    case MasterBagStatus.Delivered:
      return `Master bag has arrived and been received successfully at destination facility${payload.facilityName ? ` (${payload.facilityName})` : ''}.`;

    case MasterBagStatus.Unbagged:
      return `Master bag contents have been unbagged and processed for sorting/last-mile delivery at ${payload.facilityName ?? 'Facility Hub'}.`;

    default:
      return 'Master bag processing state updated.';
  }
}