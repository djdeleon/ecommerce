import { MasterBagStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canMasterBagTransitionTo, assertMasterBagTransition, generateMasterBagEventDescription, } from '../../../src/modules/fulfillment-sortation/states/master-bag.state.js';

describe('Master Bag State Machine Matrix', () => {
  describe('canMasterBagTransitionTo()', () => {
    test('allows valid transitions from Open', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Full)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Sealed)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Dispatched)).toBe(true);
    });

    test('rejects invalid transitions from Open', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Open)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Delivered)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Unbagged)).toBe(false);
    });

    test('allows valid transitions from Full', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Sealed)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Open)).toBe(true);
    });

    test('rejects invalid transitions from Full', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Full)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Dispatched)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Delivered)).toBe(false);
    });

    test('allows valid transitions from Sealed', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Dispatched)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Open)).toBe(true);
    });

    test('rejects invalid transitions from Sealed', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Sealed)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Full)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Delivered)).toBe(false);
    });

    test('allows valid transitions from Dispatched', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Dispatched, MasterBagStatus.Delivered)).toBe(true);
    });

    test('rejects invalid transitions from Dispatched', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Dispatched, MasterBagStatus.Open)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Dispatched, MasterBagStatus.Sealed)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Dispatched, MasterBagStatus.Dispatched)).toBe(false);
    });

    test('allows valid transitions from Delivered', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Delivered, MasterBagStatus.Unbagged)).toBe(true);
    });

    test('rejects invalid transitions from Delivered', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Delivered, MasterBagStatus.Open)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Delivered, MasterBagStatus.Sealed)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Delivered, MasterBagStatus.Delivered)).toBe(false);
    });

    test('Unbagged (Terminal State)', () => {
      expect(MasterBagStatus.Unbagged).toBe(MasterBagStatus.Unbagged);
    });

    test('rejects invalid transitions from Unbagged (Terminal State)', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Unbagged, MasterBagStatus.Open)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Unbagged, MasterBagStatus.Sealed)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Unbagged, MasterBagStatus.Dispatched)).toBe(false);
      expect(canMasterBagTransitionTo(MasterBagStatus.Unbagged, MasterBagStatus.Delivered)).toBe(false);
    });

    test('allows full happy path from Open -> Full -> Sealed -> Dispatched -> Delivered -> Unbagged', () => {
      expect(canMasterBagTransitionTo(MasterBagStatus.Open, MasterBagStatus.Full)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Full, MasterBagStatus.Sealed)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Sealed, MasterBagStatus.Dispatched)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Dispatched, MasterBagStatus.Delivered)).toBe(true);
      expect(canMasterBagTransitionTo(MasterBagStatus.Delivered, MasterBagStatus.Unbagged)).toBe(true);
    });
  });

  describe('assertMasterBagTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertMasterBagTransition(MasterBagStatus.Open, MasterBagStatus.Full, 'BAG-001');
        assertMasterBagTransition(MasterBagStatus.Full, MasterBagStatus.Sealed, 'BAG-001');
        assertMasterBagTransition(MasterBagStatus.Sealed, MasterBagStatus.Dispatched, 'BAG-001');
        assertMasterBagTransition(MasterBagStatus.Dispatched, MasterBagStatus.Delivered, 'BAG-001');
        assertMasterBagTransition(MasterBagStatus.Delivered, MasterBagStatus.Unbagged, 'BAG-001');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertMasterBagTransition(MasterBagStatus.Delivered, MasterBagStatus.Open, 'BAG-001');
      }).toThrow(
        "Invalid State Transition: Master Bag 'BAG-001' cannot transition from 'Delivered' to 'Open'."
      );

      expect(() => {
        assertMasterBagTransition(MasterBagStatus.Unbagged, MasterBagStatus.Sealed, 'BAG-001');
      }).toThrow(
        "Invalid State Transition: Master Bag 'BAG-001' cannot transition from 'Unbagged' to 'Sealed'."
      );
    });
  });

  describe('Master Bag Event Description Generator', () => {
    test('generates correct description for Open with facility name', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Open,
        facilityName: 'Manila Mega Gateway',
      });
      expect(desc).toBe('Master bag has been created and is open for parcel consolidation at Manila Mega Gateway.');

      const descMinimal = generateMasterBagEventDescription({
        status: MasterBagStatus.Open,
      });
      expect(descMinimal).toBe('Master bag has been created and is open for parcel consolidation.');
    });

    test('generates correct description for Full with parcels and weight', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Full,
        totalParcels: 25,
        totalWeight: 12500,
      });
      expect(desc).toBe('Master bag has reached capacity limit with 25 parcels (12500g) and is ready for sealing.');

      const descMinimal = generateMasterBagEventDescription({
        status: MasterBagStatus.Full,
      });
      expect(descMinimal).toBe('Master bag has reached capacity limit with multiple parcels (0g) and is ready for sealing.');
    });

    test('generates correct description for Sealed with bagCode', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Sealed,
        bagCode: 'BAG-2026-001',
      });
      expect(desc).toBe('Master bag BAG-2026-001 has been securely sealed and is ready for fleet transport dispatch.');
    });

    test('generates correct description for Dispatched with transport code and next facility', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Dispatched,
        transportCode: 'TR-500',
        nextFacilityName: 'Cebu Distribution Center',
      });
      expect(desc).toBe('Master bag loaded onto transport (TR-500) en route to next facility: Cebu Distribution Center.');

      const descMinimal = generateMasterBagEventDescription({
        status: MasterBagStatus.Dispatched,
      });
      expect(descMinimal).toBe('Master bag loaded onto transport en route to next facility: Destination Hub.');
    });

    test('generates correct description for Delivered with facility name', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Delivered,
        facilityName: 'Davao Hub',
      });
      expect(desc).toBe('Master bag has arrived and been received successfully at destination facility (Davao Hub).');
    });

    test('generates correct description for Unbagged with facility name', () => {
      const desc = generateMasterBagEventDescription({
        status: MasterBagStatus.Unbagged,
        facilityName: 'San Jose Local Branch',
      });
      expect(desc).toBe('Master bag contents have been unbagged and processed for sorting/last-mile delivery at San Jose Local Branch.');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generateMasterBagEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Master bag processing state updated.');
    });
  });
});