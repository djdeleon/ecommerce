import { SortingBatchStatus } from '@prisma/client';

/**
 * Define allowed state transitions map for Sorting Batch Lifecycle
 */
const SORTING_BATCH_TRANSITION_MATRIX: Record<SortingBatchStatus, SortingBatchStatus[]> = {
  [SortingBatchStatus.Scheduled]: [SortingBatchStatus.Active, SortingBatchStatus.Cancelled],
  [SortingBatchStatus.Active]: [SortingBatchStatus.Completed, SortingBatchStatus.Cancelled],
  [SortingBatchStatus.Completed]: [],
  [SortingBatchStatus.Cancelled]: [],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canSortingBatchTransitionTo(currentStatus: SortingBatchStatus, targetStatus: SortingBatchStatus): boolean {
  const allowedNextStates = SORTING_BATCH_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertSortingBatchTransition(
  currentStatus: SortingBatchStatus,
  targetStatus: SortingBatchStatus,
  batchCode: string
) {
  if (!canSortingBatchTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Sorting Batch '${batchCode}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}

type SortingBatchEventPayload =
  | { status: 'Scheduled'; facilityName?: string; cutOffTime?: string }
  | { status: 'Active'; batchCode?: string; facilityName?: string }
  | { status: 'Completed'; batchCode?: string; totalParcels?: number }
  | { status: 'Cancelled'; reason?: string };

export function generateSortingBatchEventDescription(payload: SortingBatchEventPayload): string {
  switch (payload.status) {
    case SortingBatchStatus.Scheduled:
      return `Sorting batch has been scheduled${payload.facilityName ? ` for ${payload.facilityName}` : ''}${payload.cutOffTime ? ` with cut-off time at ${payload.cutOffTime}` : ''}.`;

    case SortingBatchStatus.Active:
      return `Sorting batch ${payload.batchCode ?? ''} is now active and actively processing parcels/bags${payload.facilityName ? ` at ${payload.facilityName}` : ''}.`;

    case SortingBatchStatus.Completed:
      return `Sorting batch ${payload.batchCode ?? ''} has completed successfully${payload.totalParcels ? ` processing ${payload.totalParcels} parcels` : ''}.`;

    case SortingBatchStatus.Cancelled:
      return `Sorting batch was cancelled. Reason: ${payload.reason ?? 'Operational adjustment'}.`;

    default:
      return 'Sorting batch status updated.';
  }
}