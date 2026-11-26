import { SortingBatchStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { assertSortingBatchTransition, canSortingBatchTransitionTo, generateSortingBatchEventDescription } from '../../../src/modules/fulfillment-sortation/states/sorting-batch.state.js';


describe('Sorting Batch State Machine Matrix', () => {
  describe('canSortingBatchTransitionTo()', () => {
    test('allows valid transitions from Scheduled', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Scheduled, SortingBatchStatus.Active)).toBe(true);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Scheduled, SortingBatchStatus.Cancelled)).toBe(true);
    });

    test('rejects invalid transitions from Scheduled', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Scheduled, SortingBatchStatus.Scheduled)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Scheduled, SortingBatchStatus.Completed)).toBe(false);
    });

    test('allows valid transitions from Active', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Active, SortingBatchStatus.Completed)).toBe(true);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Active, SortingBatchStatus.Cancelled)).toBe(true);
    });

    test('rejects invalid transitions from Active', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Active, SortingBatchStatus.Scheduled)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Active, SortingBatchStatus.Active)).toBe(false);
    });

    test('Completed (Terminal State)', () => {
      expect(SortingBatchStatus.Completed).toBe(SortingBatchStatus.Completed);
    });

    test('rejects invalid transitions from Completed (Terminal State)', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Completed, SortingBatchStatus.Scheduled)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Completed, SortingBatchStatus.Active)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Completed, SortingBatchStatus.Cancelled)).toBe(false);
    });

    test('Cancelled (Terminal State)', () => {
      expect(SortingBatchStatus.Cancelled).toBe(SortingBatchStatus.Cancelled);
    });

    test('rejects invalid transitions from Cancelled (Terminal State)', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Cancelled, SortingBatchStatus.Scheduled)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Cancelled, SortingBatchStatus.Active)).toBe(false);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Cancelled, SortingBatchStatus.Completed)).toBe(false);
    });

    test('allows full happy path from Scheduled -> Active -> Completed', () => {
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Scheduled, SortingBatchStatus.Active)).toBe(true);
      expect(canSortingBatchTransitionTo(SortingBatchStatus.Active, SortingBatchStatus.Completed)).toBe(true);
    });
  });

  describe('assertSortingBatchTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertSortingBatchTransition(SortingBatchStatus.Scheduled, SortingBatchStatus.Active, 'SB-001');
        assertSortingBatchTransition(SortingBatchStatus.Scheduled, SortingBatchStatus.Cancelled, 'SB-001');
        assertSortingBatchTransition(SortingBatchStatus.Active, SortingBatchStatus.Completed, 'SB-001');
        assertSortingBatchTransition(SortingBatchStatus.Active, SortingBatchStatus.Cancelled, 'SB-001');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertSortingBatchTransition(SortingBatchStatus.Completed, SortingBatchStatus.Active, 'SB-001');
      }).toThrow(
        "Invalid State Transition: Sorting Batch 'SB-001' cannot transition from 'Completed' to 'Active'."
      );

      expect(() => {
        assertSortingBatchTransition(SortingBatchStatus.Cancelled, SortingBatchStatus.Scheduled, 'SB-001');
      }).toThrow(
        "Invalid State Transition: Sorting Batch 'SB-001' cannot transition from 'Cancelled' to 'Scheduled'."
      );
    });
  });

  describe('Sorting Batch Event Description Generator', () => {
    test('generates correct description for Scheduled with facility and cutoff time', () => {
      const desc = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Scheduled,
        facilityName: 'North Luzon Hub',
        cutOffTime: '18:00',
      });
      expect(desc).toBe('Sorting batch has been scheduled for North Luzon Hub with cut-off time at 18:00.');

      const descMinimal = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Scheduled,
      });
      expect(descMinimal).toBe('Sorting batch has been scheduled.');
    });

    test('generates correct description for Active with batch code and facility name', () => {
      const desc = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Active,
        batchCode: 'SB-2026-001',
        facilityName: 'Manila Mega Gateway',
      });
      expect(desc).toBe('Sorting batch SB-2026-001 is now active and actively processing parcels/bags at Manila Mega Gateway.');

      const descMinimal = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Active,
      });
      expect(descMinimal).toBe('Sorting batch  is now active and actively processing parcels/bags.');
    });

    test('generates correct description for Completed with batch code and total parcels', () => {
      const desc = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Completed,
        batchCode: 'SB-2026-001',
        totalParcels: 120,
      });
      expect(desc).toBe('Sorting batch SB-2026-001 has completed successfully processing 120 parcels.');

      const descMinimal = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Completed,
      });
      expect(descMinimal).toBe('Sorting batch  has completed successfully.');
    });

    test('generates correct description for Cancelled with reason', () => {
      const desc = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Cancelled,
        reason: 'Power outage at facility',
      });
      expect(desc).toBe('Sorting batch was cancelled. Reason: Power outage at facility.');

      const descMinimal = generateSortingBatchEventDescription({
        status: SortingBatchStatus.Cancelled,
      });
      expect(descMinimal).toBe('Sorting batch was cancelled. Reason: Operational adjustment.');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generateSortingBatchEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Sorting batch status updated.');
    });
  });
});