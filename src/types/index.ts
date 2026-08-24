import { Request } from 'express';

export type UserRole = 'farmer' | 'agent' | 'admin' | 'food_unit' | 'customer';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    phone: string;
    role: UserRole;
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export type PickupStatus =
  | 'created'
  | 'assigned'
  | 'otp_generated'
  | 'picked_up'
  | 'admin_approved'
  | 'payment_pending'
  | 'payment_completed'
  | 'cancelled';

export type VehicleType = 'bike' | 'three_wheeler' | 'mini_truck' | 'truck';

// Marketplace types
export type MarketplaceOrderStatus = 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'upi' | 'card' | 'net_banking' | 'wallet' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type NotificationType = 'order' | 'offer' | 'promotion' | 'price_drop' | 'general';
export type DiscountType = 'percentage' | 'flat';

export function getVehicleTypeForWeight(weight: number): VehicleType {
  if (weight <= 50) return 'bike';
  if (weight <= 150) return 'three_wheeler';
  if (weight <= 300) return 'mini_truck';
  return 'truck';
}

export function getMaxWeightForVehicle(vehicleType: VehicleType): number {
  switch (vehicleType) {
    case 'bike': return 50;
    case 'three_wheeler': return 150;
    case 'mini_truck': return 300;
    case 'truck': return 99999;
  }
}
