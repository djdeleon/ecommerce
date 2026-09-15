import { ShipmentStatus } from "@prisma/client"

const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PendingPickup]: [ShipmentStatus.ReadyForPickup, ShipmentStatus.Rejected],
  [ShipmentStatus.ReadyForPickup]: [ShipmentStatus.PickedUp, ShipmentStatus.PendingPickup],
  [ShipmentStatus.PickedUp]: [ShipmentStatus.InTransit, ShipmentStatus.ArrivedAtHub],
  [ShipmentStatus.InTransit]: [ShipmentStatus.ArrivedAtHub, ShipmentStatus.OutForDelivery],
  [ShipmentStatus.ArrivedAtHub]: [ShipmentStatus.InTransit, ShipmentStatus.OutForDelivery],
  [ShipmentStatus.OutForDelivery]: [ShipmentStatus.Delivered, ShipmentStatus.FailedDelivery],
  [ShipmentStatus.FailedDelivery]: [ShipmentStatus.OutForDelivery, ShipmentStatus.ArrivedAtHub],
  [ShipmentStatus.Delivered]: [],
  [ShipmentStatus.Rejected]: []
};

function isValidTransition(currentStatus: ShipmentStatus, nextStatus: ShipmentStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus]
  return allowed ? allowed.includes(nextStatus) : false
}