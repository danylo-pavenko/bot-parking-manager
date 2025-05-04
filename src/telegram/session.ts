export interface SessionData {
  step?: string;
  temp: {
    addressId?: number;
    spotNumber?: string;
    price?: number;
    guardId?: number;
    spotId?: number;
    messageId?: number;
    fullName?: string;
    phone?: string;
    ipn?: string;
    paymentMethod?: 'CASH' | 'CARD';
    amount?: number;
  };
}
