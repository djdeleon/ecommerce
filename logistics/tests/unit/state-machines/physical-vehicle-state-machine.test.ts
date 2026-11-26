import { PhysicalVehicleStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { assertPhysicalVehicleTransition, canPhysicalVehicleTransitionTo, generatePhysicalVehicleEventDescription } from '../../../src/modules/vehicles/physical-vehicle.state.js';

describe('Physical Vehicle State Machine Matrix', () => {
  describe('canPhysicalVehicleTransitionTo()', () => {
    test('allows valid transitions from Available', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.InTransit)).toBe(true);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.Maintenance)).toBe(true);
    });

    test('rejects invalid transitions from Available', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.Available)).toBe(false);
    });

    test('allows valid transitions from InTransit', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.Available)).toBe(true);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.Maintenance)).toBe(true);
    });

    test('rejects invalid transitions from InTransit', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.InTransit)).toBe(false);
    });

    test('allows valid transitions from Maintenance', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.Available)).toBe(true);
    });

    test('rejects invalid transitions from Maintenance', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.InTransit)).toBe(false);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.Maintenance)).toBe(false);
    });

    test('allows full loop path from Available -> InTransit -> Available -> Maintenance -> Available', () => {
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.InTransit)).toBe(true);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.Available)).toBe(true);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.Maintenance)).toBe(true);
      expect(canPhysicalVehicleTransitionTo(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.Available)).toBe(true);
    });
  });

  describe('assertPhysicalVehicleTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.InTransit, 'ABC-1234');
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.Available, 'ABC-1234');
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.Available, PhysicalVehicleStatus.Maintenance, 'ABC-1234');
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.Available, 'ABC-1234');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.Maintenance, PhysicalVehicleStatus.InTransit, 'ABC-1234');
      }).toThrow(
        "Invalid State Transition: Physical Vehicle 'ABC-1234' cannot transition from 'Maintenance' to 'InTransit'."
      );

      expect(() => {
        assertPhysicalVehicleTransition(PhysicalVehicleStatus.InTransit, PhysicalVehicleStatus.InTransit, 'ABC-1234');
      }).toThrow(
        "Invalid State Transition: Physical Vehicle 'ABC-1234' cannot transition from 'InTransit' to 'InTransit'."
      );
    });
  });

  describe('Physical Vehicle Event Description Generator', () => {
    test('generates correct description for Available with facility name', () => {
      const desc = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.Available,
        facilityName: 'North Luzon Mega Gateway',
      });
      expect(desc).toBe('Vehicle is available and parked at facility North Luzon Mega Gateway, ready for fleet transport assignment.');

      const descMinimal = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.Available,
      });
      expect(descMinimal).toBe('Vehicle is available and parked, ready for fleet transport assignment.');
    });

    test('generates correct description for InTransit with transport code and destination name', () => {
      const desc = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.InTransit,
        transportCode: 'TR-100',
        destinationName: 'Cebu Hub',
      });
      expect(desc).toBe('Vehicle has been dispatched on transport TR-100 en route to Cebu Hub.');

      const descMinimal = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.InTransit,
      });
      expect(descMinimal).toBe('Vehicle has been dispatched.');
    });

    test('generates correct description for Maintenance with reason', () => {
      const desc = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.Maintenance,
        reason: 'Engine overheating inspection',
      });
      expect(desc).toBe('Vehicle has been pulled out of service for maintenance. Reason: Engine overheating inspection.');

      const descMinimal = generatePhysicalVehicleEventDescription({
        status: PhysicalVehicleStatus.Maintenance,
      });
      expect(descMinimal).toBe('Vehicle has been pulled out of service for maintenance. Reason: Routine checkup / repairs.');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generatePhysicalVehicleEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Vehicle status updated.');
    });
  });
});