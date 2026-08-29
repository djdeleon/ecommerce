<?php

namespace App\Enums;

enum OrderItemStatus: string
{
    case TO_PAY     = 'to_pay';     // triggers when a customer encounters some problem with their online payment
    case TO_SHIP    = 'to_ship';    // Paid, waiting for vendor to package
    case TO_RECEIVE = 'to_receive'; // Shipped / In transit / Delivered
    case COMPLETED  = 'completed';  // Delivered & confirmed by customer
    case CANCELLED  = 'cancelled';  // Cancelled before shipping
    case REJECTED   = 'rejected';   // Declined by Vendor
    case RETURNED   = 'returned';   // Returned

    /**
     * Legal Transition State
     */
    public function canTransitionTo(self $target): bool
    {
        return match($this) {
            self::TO_PAY     => in_array($target, [self::TO_SHIP, self::CANCELLED]),
            self::TO_SHIP    => in_array($target, [self::TO_RECEIVE, self::REJECTED, self::CANCELLED]),
            self::TO_RECEIVE => in_array($target, [self::COMPLETED, self::RETURNED]),
            default          => false, // Terminal states: CANCELLED, REJECTED, COMPLETED, RETURNED
        };
    }

    /**
     * Full Domain Rules
     */
    public function canTransitionWithPayment(
        self $target,
        OrderPaymentStatus $orderPaymentStatus,
        string $actor // 'customer', 'vendor', 'system', 'admin'
    ): bool {
        if (! $this->canTransitionTo($target)) {
            return false;
        }

        return match($target) {
            self::TO_SHIP => $orderPaymentStatus === OrderPaymentStatus::COMPLETED && $actor === 'system',

            self::TO_RECEIVE => $orderPaymentStatus === OrderPaymentStatus::COMPLETED && $actor === 'vendor',

            self::COMPLETED => $orderPaymentStatus === OrderPaymentStatus::COMPLETED && in_array($actor, ['system', 'customer']),

            self::CANCELLED => $actor === 'customer' && in_array($orderPaymentStatus, [
                                                            OrderPaymentStatus::PENDING, 
                                                            OrderPaymentStatus::AUTHORIZED, 
                                                            OrderPaymentStatus::FAILED, 
                                                            OrderPaymentStatus::COMPLETED
                                                        ]),

            self::REJECTED => $actor === 'vendor' && $orderPaymentStatus === OrderPaymentStatus::COMPLETED,
            
            self::RETURNED => $actor === 'vendor' && $orderPaymentStatus === OrderPaymentStatus::COMPLETED,

            default => false,
        };
    }

    /**
     * an order status is set to TO_PAY for the INITIAL STATUS for the newly created order,
     * - This is the initial status of the order so we shouldn't be saying "can be" but "is set to" and simply lay out all the side effects
     * - - an order record is created
     * - - order items status are set to TO_PAY
     * - - an order payment is set to PENDING
     * 
     * an order status can be set to TO_SHIP,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_PAY
     * 
     * a vendor can set the order status to TO_RECEIVE,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_SHIP
     * 
     * an order status can be set to COMPLETED in Two Ways:
     * 1. a customer can set,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_RECEIVE
     * 2. the system automatically sets the status in 1 week prior to delivery date,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_RECEIVE
     * 
     * a customer can set the order status to CANCELLED in Two Ways,
     * 1. a customer can set,
     * - IF the Order Payment Status is PENDING / AUTHORIZED / FAILED
     * - AND the latest Order Item Status is TO_PAY
     * 2. a customer can set,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_SHIP
     * 
     * A vendor can set the order status to REJECTED,
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest Order Item Status is TO_SHIP
     * 
     * an order status can be set to RETURNED, 
     * - IF the Order Payment Status is COMPLETED
     * - AND the latest order item status is TO_RECEIVE
     */ 
}
