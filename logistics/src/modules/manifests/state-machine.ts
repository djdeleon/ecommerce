import { ManifestStatus } from '@prisma/client';

/**
 * Define allowed state transitions map
 */
const MANIFEST_TRANSITION_MATRIX: Record<ManifestStatus, ManifestStatus[]> = {
  [ManifestStatus.Scheduled]: [ManifestStatus.Dispatched, ManifestStatus.Cancelled],
  [ManifestStatus.Dispatched]: [ManifestStatus.Accumulating, ManifestStatus.Cancelled],
  [ManifestStatus.Accumulating]: [ManifestStatus.Completed, ManifestStatus.Cancelled],
  [ManifestStatus.Completed]: [ManifestStatus.Arrived],
  [ManifestStatus.Arrived]: [],
  [ManifestStatus.Cancelled]: [],
};

/**
 * Pure function to validate if a transition from current status to target status is legal.
 */
export function canTransitionTo(currentStatus: ManifestStatus, targetStatus: ManifestStatus): boolean {
  const allowedNextStates = MANIFEST_TRANSITION_MATRIX[currentStatus] || [];
  return allowedNextStates.includes(targetStatus);
}

/**
 * Helper that throws a clean domain error if transition is invalid.
 */
export function assertTransition(currentStatus: ManifestStatus, targetStatus: ManifestStatus, manifestCode: string) {
  if (!canTransitionTo(currentStatus, targetStatus)) {
    throw new Error(
      `Invalid State Transition: Manifest '${manifestCode}' cannot transition from '${currentStatus}' to '${targetStatus}'.`
    );
  }
}