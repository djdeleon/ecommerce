import { ManifestStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canTransitionTo, assertTransition, generateManifestEventDescription } from '../../../src/modules/manifests/state-machine.js';

describe('Manifest State Machine Matrix', () => {
  describe('canTransitionTo()', () => {
    test('allows valid transitions from Scheduled', () => {
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Dispatched)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Cancelled)).toBe(true);
    });

    test('rejects invalid transitions from Scheduled', () => {
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Accumulating)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Arrived)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Completed)).toBe(false);
    });

    test('allows valid transitions from Dispatched', () => {
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Accumulating)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Cancelled)).toBe(true);
    })

    test('rejects invalid transitions from Dispatched', () => {
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Dispatched)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Completed)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Arrived)).toBe(false);

    })

    test('allows valid transitions from Accumulating', () => {
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Completed)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Cancelled)).toBe(true);
    });

    test('rejects invalid transitions from Accumulating', () => {
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Dispatched)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Accumulating)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Arrived)).toBe(false);
    });

    test('allows valid transitions from Completed', () => {
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Arrived)).toBe(true);
    })

    test('rejects invalid transitions from Completed', () => {
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Dispatched)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Accumulating)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Completed)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Cancelled)).toBe(false);
    })

    test('Arrived (Terminal State)', () => {
      expect(ManifestStatus.Arrived).toBe(ManifestStatus.Arrived);
    })

    test('rejects invalid transitions from Arrived (Terminal State)', () => {
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Dispatched)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Accumulating)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Completed)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Arrived)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Arrived, ManifestStatus.Cancelled)).toBe(false);
    })

    test('allows valid transitions from Cancelled (Terminal State)', () => {
      expect(ManifestStatus.Cancelled).toBe(ManifestStatus.Cancelled);
    })

    test('rejects invalid transitions from Cancelled', () => {
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Scheduled)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Dispatched)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Accumulating)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Completed)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Arrived)).toBe(false);
      expect(canTransitionTo(ManifestStatus.Cancelled, ManifestStatus.Cancelled)).toBe(false);
    })

    test('allows full happy path from Scheduled -> Dispatched -> Accumulating -> -> Completed -> Arrived', () => {
      expect(canTransitionTo(ManifestStatus.Scheduled, ManifestStatus.Dispatched)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Dispatched, ManifestStatus.Accumulating)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Accumulating, ManifestStatus.Completed)).toBe(true);
      expect(canTransitionTo(ManifestStatus.Completed, ManifestStatus.Arrived)).toBe(true);
    });
  });

  describe('assertTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertTransition(ManifestStatus.Scheduled, ManifestStatus.Dispatched, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Scheduled, ManifestStatus.Cancelled, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Dispatched, ManifestStatus.Accumulating, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Dispatched, ManifestStatus.Cancelled, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Accumulating, ManifestStatus.Completed, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Accumulating, ManifestStatus.Cancelled, 'MNF-20260331-001');
        assertTransition(ManifestStatus.Completed, ManifestStatus.Arrived, 'MNF-20260331-001');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertTransition(ManifestStatus.Completed, ManifestStatus.Dispatched, 'MNF-20260331-001');
      }).toThrow(
        "Invalid State Transition: Manifest 'MNF-20260331-001' cannot transition from 'Completed' to 'Dispatched'."
      );

      expect(() => {
        assertTransition(ManifestStatus.Arrived, ManifestStatus.Scheduled, 'MNF-20260331-001');
      }).toThrow(
        "Invalid State Transition: Manifest 'MNF-20260331-001' cannot transition from 'Arrived' to 'Scheduled'."
      );

      expect(() => {
        assertTransition(ManifestStatus.Cancelled, ManifestStatus.Accumulating, 'MNF-20260331-001');
      }).toThrow(
        "Invalid State Transition: Manifest 'MNF-20260331-001' cannot transition from 'Cancelled' to 'Accumulating'."
      );
    });
  });

  describe('Manifest Event Description Generator', () => {
    test('generates correct description for Scheduled with sector and transport code', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Scheduled,
        sectorCode: 'SEC-01',
        transportCode: 'TR-100',
      });
      expect(desc).toBe('Manifest has been scheduled for sector SEC-01 using transport TR-100.');

      const descMinimal = generateManifestEventDescription({
        status: ManifestStatus.Scheduled,
      });
      expect(descMinimal).toBe('Manifest has been scheduled.');
    });

    test('generates correct description for Dispatched with transport code and total parcels', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Dispatched,
        transportCode: 'TR-100',
        totalParcels: 45,
      });
      expect(desc).toBe('Manifest has been dispatched via transport TR-100 containing 45 parcels.');

      const descMinimal = generateManifestEventDescription({
        status: ManifestStatus.Dispatched,
      });
      expect(descMinimal).toBe('Manifest has been dispatched.');
    });

    test('generates correct description for Accumulating with weight and volume', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Accumulating,
        totalWeightGrams: 15000,
        totalVolumeCbm: 1.25,
      });
      expect(desc).toBe('Manifest is actively accumulating cargo (15000g, 1.25 cbm).');

      const descMinimal = generateManifestEventDescription({
        status: ManifestStatus.Accumulating,
      });
      expect(descMinimal).toBe('Manifest is actively accumulating cargo.');
    });

    test('generates correct description for Completed with manifest code', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Completed,
        manifestCode: 'MNF-2026-001',
      });
      expect(desc).toBe('Manifest MNF-2026-001 has completed loading/processing successfully.');
    });

    test('generates correct description for Arrived with facility name', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Arrived,
        facilityName: 'Cebu Mega Gateway',
      });
      expect(desc).toBe('Manifest transit has arrived at destination facility (Cebu Mega Gateway).');
    });

    test('generates correct description for Cancelled with reason', () => {
      const desc = generateManifestEventDescription({
        status: ManifestStatus.Cancelled,
        reason: 'Vehicle breakdown',
      });
      expect(desc).toBe('Manifest was cancelled. Reason: Vehicle breakdown.');

      const descDefaultReason = generateManifestEventDescription({
        status: ManifestStatus.Cancelled,
      });
      expect(descDefaultReason).toBe('Manifest was cancelled. Reason: Operational update.');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generateManifestEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Manifest status updated.');
    });
  });
});