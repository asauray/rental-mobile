import dayjs from "dayjs";

export interface PayoutDto {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  arrival_date: string;
}

export interface DailyPayout {
  date: string;
  items: PayoutDto[];
}
export interface GraphPoint {
  date: Date;
  value: number;
}

export interface PayoutsResponse {
  payouts: DailyPayout[];
}

export interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: dayjs.Dayjs;
  expectedArrivalDate: dayjs.Dayjs;
}
export interface PayoutOnDay {
  date: dayjs.Dayjs;
  items: Payout[];
}

export interface Payouts {
  payouts: PayoutOnDay[];
}
