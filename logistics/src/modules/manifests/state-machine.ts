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

type ManifestEventPayload =
  | { status: 'Scheduled'; sectorCode?: string; transportCode?: string }
  | { status: 'Dispatched'; transportCode?: string; totalParcels?: number }
  | { status: 'Accumulating'; totalWeightGrams?: number; totalVolumeCbm?: number }
  | { status: 'Completed'; manifestCode?: string }
  | { status: 'Arrived'; facilityName?: string }
  | { status: 'Cancelled'; reason?: string };

export function generateManifestEventDescription(payload: ManifestEventPayload): string {
  switch (payload.status) {
    case ManifestStatus.Scheduled:
      return `Manifest has been scheduled${payload.sectorCode ? ` for sector ${payload.sectorCode}` : ''}${payload.transportCode ? ` using transport ${payload.transportCode}` : ''}.`;

    case ManifestStatus.Dispatched:
      return `Manifest has been dispatched${payload.transportCode ? ` via transport ${payload.transportCode}` : ''}${payload.totalParcels ? ` containing ${payload.totalParcels} parcels` : ''}.`;

    case ManifestStatus.Accumulating:
      return `Manifest is actively accumulating cargo${payload.totalWeightGrams ? ` (${payload.totalWeightGrams}g` : ''}${payload.totalVolumeCbm ? `, ${payload.totalVolumeCbm} cbm)` : ''}.`;

    case ManifestStatus.Completed:
      return `Manifest ${payload.manifestCode ?? ''} has completed loading/processing successfully.`;

    case ManifestStatus.Arrived:
      return `Manifest transit has arrived at destination facility${payload.facilityName ? ` (${payload.facilityName})` : ''}.`;

    case ManifestStatus.Cancelled:
      return `Manifest was cancelled. Reason: ${payload.reason ?? 'Operational update'}.`;

    default:
      return 'Manifest status updated.';
  }
}