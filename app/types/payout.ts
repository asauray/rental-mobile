export interface PayoutDto {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  expected_arrival_date: string;
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
