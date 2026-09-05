<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Driver = 'driver';
}
