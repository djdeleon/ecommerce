import { DeliveryStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canDeliveryTransitionTo, assertDeliveryTransition, generateDeliveryEventDescription, } from '../../../src/modules/deliveries/state-machine.js';

describe('Delivery State Machine Matrix', () => {
  describe('canDeliveryTransitionTo()', () => {
    test('allows valid transitions from Scheduled', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Loading)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Dispatched)).toBe(true);
    });

    test('rejects invalid transitions from Scheduled', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Scheduled)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Arrived)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Completed)).toBe(false);
    });

    test('allows valid transitions from Loading', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Dispatched)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Scheduled)).toBe(true);
    });

    test('rejects invalid transitions from Loading', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Loading)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Arrived)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Completed)).toBe(false);
    });

    test('allows valid transitions from Dispatched', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Arrived)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Completed)).toBe(true);
    });

    test('rejects invalid transitions from Dispatched', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Scheduled)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Loading)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Dispatched)).toBe(false);
    });

    test('allows valid transitions from Arrived', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Completed)).toBe(true);
    });

    test('rejects invalid transitions from Arrived', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Scheduled)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Loading)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Dispatched)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Arrived)).toBe(false);
    });

    test('Completed (Terminal State)', () => {
      expect(DeliveryStatus.Completed).toBe(DeliveryStatus.Completed);
    });

    test('rejects invalid transitions from Completed (Terminal State)', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Completed, DeliveryStatus.Scheduled)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Completed, DeliveryStatus.Loading)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Completed, DeliveryStatus.Dispatched)).toBe(false);
      expect(canDeliveryTransitionTo(DeliveryStatus.Completed, DeliveryStatus.Arrived)).toBe(false);
    });

    test('allows full happy path from Scheduled -> Loading -> Dispatched -> Arrived -> Completed', () => {
      expect(canDeliveryTransitionTo(DeliveryStatus.Scheduled, DeliveryStatus.Loading)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Loading, DeliveryStatus.Dispatched)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Dispatched, DeliveryStatus.Arrived)).toBe(true);
      expect(canDeliveryTransitionTo(DeliveryStatus.Arrived, DeliveryStatus.Completed)).toBe(true);
    });
  });

  describe('assertDeliveryTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertDeliveryTransition(DeliveryStatus.Scheduled, DeliveryStatus.Loading, 'DEL-001');
        assertDeliveryTransition(DeliveryStatus.Loading, DeliveryStatus.Dispatched, 'DEL-001');
        assertDeliveryTransition(DeliveryStatus.Dispatched, DeliveryStatus.Arrived, 'DEL-001');
        assertDeliveryTransition(DeliveryStatus.Arrived, DeliveryStatus.Completed, 'DEL-001');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertDeliveryTransition(DeliveryStatus.Completed, DeliveryStatus.Dispatched, 'DEL-001');
      }).toThrow(
        "Invalid State Transition: Delivery 'DEL-001' cannot transition from 'Completed' to 'Dispatched'."
      );

      expect(() => {
        assertDeliveryTransition(DeliveryStatus.Arrived, DeliveryStatus.Scheduled, 'DEL-001');
      }).toThrow(
        "Invalid State Transition: Delivery 'DEL-001' cannot transition from 'Arrived' to 'Scheduled'."
      );
    });
  });

  describe('Delivery Event Description Generator', () => {
    test('generates correct description for Scheduled with sector code', () => {
      const desc = generateDeliveryEventDescription({
        status: DeliveryStatus.Scheduled,
        sectorCode: 'SEC-03-BUL',
      });
      expect(desc).toBe('Last-mile delivery run for sector SEC-03-BUL has been scheduled.');

      const descMinimal = generateDeliveryEventDescription({
        status: DeliveryStatus.Scheduled,
      });
      expect(descMinimal).toBe('Last-mile delivery run has been scheduled.');
    });

    test('generates correct description for Loading with parcels and weight', () => {
      const desc = generateDeliveryEventDescription({
        status: DeliveryStatus.Loading,
        totalParcels: 35,
        currentWeightGrams: 24500,
      });
      expect(desc).toBe('Delivery vehicle is currently being loaded with 35 parcels (24500g).');

      const descMinimal = generateDeliveryEventDescription({
        status: DeliveryStatus.Loading,
      });
      expect(descMinimal).toBe('Delivery vehicle is currently being loaded with multiple parcels (0g).');
    });

    test('generates correct description for Dispatched with courier name and plate number', () => {
      const desc = generateDeliveryEventDescription({
        status: DeliveryStatus.Dispatched,
        courierName: 'Juan Dela Cruz',
        plateNumber: 'XYZ-9876',
      });
      expect(desc).toBe('Delivery run has been dispatched. Assigned courier (Juan Dela Cruz - XYZ-9876) is on route.');

      const descMinimal = generateDeliveryEventDescription({
        status: DeliveryStatus.Dispatched,
      });
      expect(descMinimal).toBe('Delivery run has been dispatched. Assigned courier is on route.');
    });

    test('generates correct description for Arrived with sector code', () => {
      const desc = generateDeliveryEventDescription({
        status: DeliveryStatus.Arrived,
        sectorCode: 'SEC-05-MNL',
      });
      expect(desc).toBe('Delivery team has arrived at the target delivery zone (SEC-05-MNL).');

      const descMinimal = generateDeliveryEventDescription({
        status: DeliveryStatus.Arrived,
      });
      expect(descMinimal).toBe('Delivery team has arrived at the target delivery zone.');
    });

    test('generates correct description for Completed with total delivered count', () => {
      const desc = generateDeliveryEventDescription({
        status: DeliveryStatus.Completed,
        totalDelivered: 32,
      });
      expect(desc).toBe('Delivery run successfully completed. 32 parcels dropped off.');

      const descMinimal = generateDeliveryEventDescription({
        status: DeliveryStatus.Completed,
      });
      expect(descMinimal).toBe('Delivery run successfully completed. ');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generateDeliveryEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Delivery run status updated.');
    });
  });
});