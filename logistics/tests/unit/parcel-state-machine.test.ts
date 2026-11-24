import { ParcelStatus } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { canParcelTransitionTo, assertParcelTransition } from '../../src/modules/parcels/state-machine.js';

describe('Parcel State Machine Matrix', () => {
  describe('canParcelTransitionTo()', () => {
    test('allows valid transitions from PendingPickup', () => {
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.ReadyForPickup)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.Rejected)).toBe(true);
    });

    test('rejects invalid transitions from PendingPickup', () => {
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.Delivered)).toBe(false);
    });

    test('allows valid transitions from ReadyForPickup', () => {
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.PickedUp)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.Rejected)).toBe(true);
    });

    test('rejects invalid transitions from ReadyForPickup', () => {
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.Delivered)).toBe(false);
    });

    test('allows valid transitions from PickedUp', () => {
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.ArrivedAtOriginHub)).toBe(true);
    });

    test('rejects invalid transitions from PickedUp', () => {
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.Rejected)).toBe(false);
    });

    test('allows valid transitions from ArrivedAtOriginHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.Sorting)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.DepartedFromOriginHub)).toBe(true);
    });

    test('rejects invalid transitions from ArrivedAtOriginHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.Rejected)).toBe(false);
    });

    test('allows valid transitions from DepartedFromOriginHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.Sorting)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(true);
    });

    test('rejects invalid transitions from DepartedFromOriginHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.Rejected)).toBe(false);
    });

    test('allows valid transitions from ArrivedAtHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.Sorting)).toBe(true);
    });

    test('rejects invalid transitions from ArrivedAtHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.Rejected)).toBe(false);
    });

    test('allows valid transitions from Sorting', () => {
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.Bagged)).toBe(true);
    });

    test('rejects invalid transitions from Sorting', () => {
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.Rejected)).toBe(false);
    })

    test('allows valid transitions from Bagged', () => {
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.DepartedFromOriginHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.DepartedFromHub)).toBe(true);
    });

    test('rejects invalid transitions from Bagged', () => {
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.Rejected)).toBe(false);
    })

    test('allows valid transitions from DepartedFromHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(true);
    });

    test('rejects invalid transitions from DepartedFromHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.Rejected)).toBe(false);
    })

    test('allows valid transitions from ArrivedAtDestinationHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.OutForDelivery)).toBe(true);
    });

    test('rejects invalid transitions from ArrivedAtDestinationHub', () => {
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.Rejected)).toBe(false);
    })

    test('allows valid transitions from OutForDelivery', () => {
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.Delivered)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.FailedDelivery)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.Rejected)).toBe(true);
    });

    test('rejects invalid transitions from OutForDelivery', () => {
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.OutForDelivery)).toBe(false);
    })

    test('allows valid transitions from FailedDelivery', () => {
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.OutForDelivery)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.Rejected)).toBe(true);
    });

    test('rejects invalid transitions from FailedDelivery', () => {
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.FailedDelivery, ParcelStatus.Delivered)).toBe(false);
    })

    test('Delivered (Terminal State)', () => {
      expect(ParcelStatus.Delivered).toBe(ParcelStatus.Delivered);
    });

    test('rejects invalid transitions from Delivered (Terminal State)', () => {
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Delivered, ParcelStatus.Rejected)).toBe(false);
    })

    test('Rejected (Terminal State)', () => {
      expect(ParcelStatus.Rejected).toBe(ParcelStatus.Rejected);
    });

    test('rejects invalid transitions from Rejected (Terminal State)', () => {
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.PendingPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.ReadyForPickup)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.PickedUp)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.ArrivedAtOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.DepartedFromOriginHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.ArrivedAtHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.Sorting)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.Bagged)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.DepartedFromHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.ArrivedAtDestinationHub)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.OutForDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.FailedDelivery)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.Delivered)).toBe(false);
      expect(canParcelTransitionTo(ParcelStatus.Rejected, ParcelStatus.Rejected)).toBe(false);
    })

    test('allows full happy path [Distribution Center -> Mega Gateway -> Local Branch] from PendingPickup -> ReadyForPickup -> PickedUp -> ArrivedAtOriginHub -> DepartedFromOriginHub -> ArrivedAtHub -> Sorting -> Bagged -> DepartedFromHub -> ArrivedAtDestinationHub -> OutForDelivery -> Delivered', () => {
      expect(canParcelTransitionTo(ParcelStatus.PendingPickup, ParcelStatus.ReadyForPickup)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ReadyForPickup, ParcelStatus.PickedUp)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.PickedUp, ParcelStatus.ArrivedAtOriginHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.DepartedFromOriginHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtHub, ParcelStatus.Sorting)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.Sorting, ParcelStatus.Bagged)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.Bagged, ParcelStatus.DepartedFromHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtDestinationHub)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.OutForDelivery)).toBe(true);
      expect(canParcelTransitionTo(ParcelStatus.OutForDelivery, ParcelStatus.Delivered)).toBe(true);
    });
  });

  describe('assertParcelTransition()', () => {
    test('does not throw an error on valid transition', () => {
      expect(() => {
        assertParcelTransition(ParcelStatus.PendingPickup, ParcelStatus.ReadyForPickup, 'TRK-12345');
        assertParcelTransition(ParcelStatus.PendingPickup, ParcelStatus.Rejected, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ReadyForPickup, ParcelStatus.PickedUp, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ReadyForPickup, ParcelStatus.Rejected, 'TRK-12345');
        assertParcelTransition(ParcelStatus.PickedUp, ParcelStatus.ArrivedAtOriginHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.Sorting, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ArrivedAtOriginHub, ParcelStatus.DepartedFromOriginHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.DepartedFromOriginHub, ParcelStatus.ArrivedAtDestinationHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.DepartedFromOriginHub, ParcelStatus.Sorting, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ArrivedAtHub, ParcelStatus.Sorting, 'TRK-12345');
        assertParcelTransition(ParcelStatus.Sorting, ParcelStatus.Bagged, 'TRK-12345');
        assertParcelTransition(ParcelStatus.Bagged, ParcelStatus.DepartedFromOriginHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.Bagged, ParcelStatus.DepartedFromHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.DepartedFromHub, ParcelStatus.ArrivedAtDestinationHub, 'TRK-12345');
        assertParcelTransition(ParcelStatus.ArrivedAtDestinationHub, ParcelStatus.OutForDelivery, 'TRK-12345');
        assertParcelTransition(ParcelStatus.OutForDelivery, ParcelStatus.Delivered, 'TRK-12345');
        assertParcelTransition(ParcelStatus.OutForDelivery, ParcelStatus.FailedDelivery, 'TRK-12345');
        assertParcelTransition(ParcelStatus.OutForDelivery, ParcelStatus.Rejected, 'TRK-12345');
        assertParcelTransition(ParcelStatus.FailedDelivery, ParcelStatus.OutForDelivery, 'TRK-12345');
        assertParcelTransition(ParcelStatus.FailedDelivery, ParcelStatus.Rejected, 'TRK-12345');
      }).not.toThrow();
    });

    test('throws a descriptive domain error on invalid transition', () => {
      expect(() => {
        assertParcelTransition(ParcelStatus.Delivered, ParcelStatus.PendingPickup, 'TRK-12345');
      }).toThrow(
        "Invalid State Transition: Parcel 'TRK-12345' cannot transition from 'Delivered' to 'PendingPickup'."
      );

      expect(() => {
        assertParcelTransition(ParcelStatus.Rejected, ParcelStatus.OutForDelivery, 'TRK-12345');
      }).toThrow(
        "Invalid State Transition: Parcel 'TRK-12345' cannot transition from 'Rejected' to 'OutForDelivery'."
      );

      expect(() => {
        assertParcelTransition(ParcelStatus.PendingPickup, ParcelStatus.Delivered, 'TRK-12345');
      }).toThrow(
        "Invalid State Transition: Parcel 'TRK-12345' cannot transition from 'PendingPickup' to 'Delivered'."
      );
    });
  });
});