const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'pending_pickup': ['ready_for_pickup', 'rejected'],
  'ready_for_pickup': ['picked_up', 'pending_pickup'],
  'picked_up': ['in_transit', 'arrived_at_hub'],
  'in_transit': ['arrived_at_hub', 'out_for_delivery'],
  'arrived_at_hub': ['in_transit', 'out_for_delivery'],
  'out_for_delivery': ['delivered', 'failed_delivery'],
  'failed_delivery': ['out_for_delivery', 'arrived_at_hub'],
  'delivered': [],
  'rejected': []
}

function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus]
  return allowed ? allowed.includes(nextStatus) : false
}