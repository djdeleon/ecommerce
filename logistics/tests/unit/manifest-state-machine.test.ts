import { ManifestStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canTransitionTo, assertTransition } from '../../src/modules/manifests/state-machine.js';

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
});