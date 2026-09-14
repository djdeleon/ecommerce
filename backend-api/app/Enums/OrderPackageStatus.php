<?php

namespace App\Enums;

enum OrderPackageStatus: string
{
    case ToPay     = 'to_pay';     // triggers when a customer encounters some problem with their online payment
    case ToShip    = 'to_ship';    // Paid, waiting for vendor to package
    case ToReceive = 'to_receive'; // Shipped / In transit / Delivered
    case Completed  = 'completed';  // Delivered & confirmed by customer
    case Cancelled  = 'cancelled';  // Cancelled before shipping
    case ToReturn   = 'to_return';  // Requested by the customer
    case Rejected   = 'rejected';   // Declined by Vendor
    case Returned   = 'returned';   // Returned

    /**
     * New Features
     * ToReceive should be marked BY 3PL (> 10 Orders) or Fulfillment Hub Centers (< 10 Orders when the vendor goes to the hub itself to drop-off the orders)
     * in the ToReceive order is where the Shipment Logs should be handled.
     * - So the vendor needs to have a way to print a waybill?? yes it should be in the ToShip state
     * 
     * This is also going to be part of Checkout System
     * 
     * We can then implement shipping fee coupons to easily deduct shipping fee in the cart items page.
     * 
     * This should ba paired with the PH Geographic. 
     * 
     * How to implement:
     * 
     */

    /**
     * Legal Transition State
     */
    public function canTransitionTo(self $target): bool
    {
        return match($this) {
            self::ToPay     => in_array($target, [self::ToShip, self::Cancelled]),
            self::ToShip    => in_array($target, [self::ToReceive, self::Rejected, self::Cancelled]),
            self::ToReceive => in_array($target, [self::Completed, self::ToReturn]),
            self::ToReturn  =>  in_array($target, [self::Returned, self::Rejected]),
            default         => false, // Terminal states: Cancelled, Rejected, Completed, Returned
        };
    }

    /**
     * Full Domain Rules
     */
    public function canTransitionWithPayment(
        self $target,
        OrderPackagePaymentStatus $orderPaymentStatus,
        string $actor // 'customer', 'vendor', 'system', 'admin'
    ): bool {
        if (! $this->canTransitionTo($target)) {
            return false;
        }

        return match($target) {
            self::ToShip => $orderPaymentStatus === OrderPackagePaymentStatus::Completed && $actor === 'system',

            self::ToReceive => $orderPaymentStatus === OrderPackagePaymentStatus::Completed && $actor === 'vendor',

            self::Completed => $orderPaymentStatus === OrderPackagePaymentStatus::Completed && in_array($actor, ['system', 'customer']),

            self::Cancelled => in_array($actor, ['customer', 'vendor']) && in_array($orderPaymentStatus, [
                                                            OrderPackagePaymentStatus::Pending, 
                                                            OrderPackagePaymentStatus::Authorized, 
                                                            OrderPackagePaymentStatus::Failed, 
                                                            OrderPackagePaymentStatus::Completed,
                                                            OrderPackagePaymentStatus::PartialRefund,
                                                        ]),

            self::Rejected => $actor === 'vendor' && $orderPaymentStatus === OrderPackagePaymentStatus::Completed,
            
            self::ToReturn => $actor === 'customer' && $orderPaymentStatus === OrderPackagePaymentStatus::Completed,

            self::Returned => $actor === 'vendor' && $orderPaymentStatus === OrderPackagePaymentStatus::Completed,

            default => false,
        };
    }

    /**
     * an order status is set to ToPay for the INITIAL STATUS for the newly created order,
     * - This is the initial status of the order so we shouldn't be saying "can be" but "is set to" and simply lay out all the side effects
     * - - an order record is created
     * - - order items status are set to ToPay
     * - - an order payment is set to Pending
     * 
     * an order status can be set to ToShip,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToPay
     * 
     * a vendor can set the order status to ToReceive,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToShip
     * 
     * an order status can be set to Completed in Two Ways:
     * 1. a customer can set,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToReceive
     * 2. the system automatically sets the status in 1 week prior to delivery date,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToReceive
     * 
     * a customer can set the order status to Cancelled in Two Ways,
     * 1. a customer can set,
     * - IF the Order Payment Status is Pending / Authorized / Failed
     * - AND the latest Order Item Status is ToPay
     * 2. a customer can set,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToShip
     * 
     * A vendor can set the order status to Rejected,
     * - IF the Order Payment Status is Completed
     * - AND the latest Order Item Status is ToShip
     * 
     * an order status can be set to Returned, 
     * - IF the Order Payment Status is Completed
     * - AND the latest order item status is ToReceive
     */ 
}
