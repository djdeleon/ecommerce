import { CourierStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canCourierTransitionTo, assertCourierTransition, generateCourierEventDescription, } from '../../../src/modules/couriers/state-machine.js';

describe('Courier State Machine Matrix', () => {
  describe('canCourierTransitionTo()', () => {
    test('allows valid transitions from Offline', () => {
      expect(canCourierTransitionTo(CourierStatus.Offline, CourierStatus.Available)).toBe(true);
    });

    test('rejects invalid transitions from Offline', () => {
      expect(canCourierTransitionTo(CourierStatus.Offline, CourierStatus.Offline)).toBe(false);
      expect(canCourierTransitionTo(CourierStatus.Offline, CourierStatus.Busy)).toBe(false);
    });

    test('allows valid transitions from Available', () => {
      expect(canCourierTransitionTo(CourierStatus.Available, CourierStatus.Busy)).toBe(true);
      expect(canCourierTransitionTo(CourierStatus.Available, CourierStatus.Offline)).toBe(true);
    });

    test('rejects invalid transitions from Available', () => {
      expect(canCourierTransitionTo(CourierStatus.Available, CourierStatus.Available)).toBe(false);
    });

    test('allows valid transitions from Busy', () => {
      expect(canCourierTransitionTo(CourierStatus.Busy, CourierStatus.Available)).toBe(true);
      expect(canCourierTransitionTo(CourierStatus.Busy, CourierStatus.Offline)).toBe(true);
    });

    test('rejects invalid transitions from Busy', () => {
      expect(canCourierTransitionTo(CourierStatus.Busy, CourierStatus.Busy)).toBe(false);
    });

    test('allows full shift lifecycle path from Offline -> Available -> Busy -> Available -> Offline', () => {
      expect(canCourierTransitionTo(CourierStatus.Offline, CourierStatus.Available)).toBe(true);
      expect(canCourierTransitionTo(CourierStatus.Available, CourierStatus.Busy)).toBe(true);
      expect(canCourierTransitionTo(CourierStatus.Busy, CourierStatus.Available)).toBe(true);
      expect(canCourierTransitionTo(CourierStatus.Available, CourierStatus.Offline)).toBe(true);
    });
  });

  describe('assertCourierTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertCourierTransition(CourierStatus.Offline, CourierStatus.Available, 'Juan Dela Cruz');
        assertCourierTransition(CourierStatus.Available, CourierStatus.Busy, 'Juan Dela Cruz');
        assertCourierTransition(CourierStatus.Busy, CourierStatus.Available, 'Juan Dela Cruz');
        assertCourierTransition(CourierStatus.Available, CourierStatus.Offline, 'Juan Dela Cruz');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertCourierTransition(CourierStatus.Offline, CourierStatus.Busy, 'Juan Dela Cruz');
      }).toThrow(
        "Invalid State Transition: Courier 'Juan Dela Cruz' cannot transition from 'Offline' to 'Busy'."
      );

      expect(() => {
        assertCourierTransition(CourierStatus.Busy, CourierStatus.Busy, 'Juan Dela Cruz');
      }).toThrow(
        "Invalid State Transition: Courier 'Juan Dela Cruz' cannot transition from 'Busy' to 'Busy'."
      );
    });
  });

  describe('Courier Event Description Generator', () => {
    test('generates correct description for Offline with and without reason', () => {
      const descWithReason = generateCourierEventDescription({
        status: CourierStatus.Offline,
        reason: 'Shift ended',
      });
      expect(descWithReason).toBe('Courier is currently offline and off-duty. Reason: Shift ended');

      const descMinimal = generateCourierEventDescription({
        status: CourierStatus.Offline,
      });
      expect(descMinimal).toBe('Courier is currently offline and off-duty.');
    });

    test('generates correct description for Available with facility name', () => {
      const desc = generateCourierEventDescription({
        status: CourierStatus.Available,
        facilityName: 'San Jose Local Branch',
      });
      expect(desc).toBe('Courier is online, available, and ready for assignment at San Jose Local Branch.');

      const descMinimal = generateCourierEventDescription({
        status: CourierStatus.Available,
      });
      expect(descMinimal).toBe('Courier is online, available, and ready for assignment.');
    });

    test('generates correct description for Busy with task type and delivery code', () => {
      const desc = generateCourierEventDescription({
        status: CourierStatus.Busy,
        taskType: 'last-mile delivery run',
        deliveryCode: 'DEL-2026-001',
      });
      expect(desc).toBe('Courier is currently busy on an active last-mile delivery run (DEL-2026-001).');

      const descMinimal = generateCourierEventDescription({
        status: CourierStatus.Busy,
      });
      expect(descMinimal).toBe('Courier is currently busy on an active delivery run.');
    });

    test('generates default description for unknown status payload', () => {
      const desc = generateCourierEventDescription({ status: 'UnknownStatus' as any });
      expect(desc).toBe('Courier status updated.');
    });
  });
});