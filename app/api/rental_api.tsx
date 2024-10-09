import Config from "react-native-config";

const rootUrl = "http://192.168.1.15:8080"; //Config.API_ROOT_URL;
export interface Rental {
  id: number;
  state: string;
  unit_id: number;
  start_date: string;
  end_date: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone_number: string;
  created_at: string;
}

export interface BookingsGroupedByDay {
  day: string;
  Rentals: Rental[];
}

export interface Reservations {
  bookings_grouped_by_day: BookingsGroupedByDay[];
  previous: string;
  next: string;
}

export interface ProductUnit {
  id: number;
  model: Model;
  stock: number;
}

export interface RoomProperties {
  category: string;
}

export interface Model {
  id: number;
  name: string;
  brand: string;
  brand_id: number;
  description: string;
  description_fr: string;
  description_en: string;
  class: string;
  thumbnail_url: string;
  image_urls: string[];
  price_per_hour: number;
  price_per_day: number;
  room_properties: RoomProperties;
  slot_duration_seconds: number;
  formatted_slot_duration: string;
  formatted_price_per_slot: string;
}
export const RentalApi = {
  fetchUnitById: (unitId: number) => {
    const url = `${rootUrl}/api/v1/rooms/units/${unitId}`;
    console.log("fetching");
    return fetch(url, {
      headers: {
        "Tenant-id": "2",
      },
    })
      .then((response) => response.json())
      .then((data) => data as ProductUnit);
  },
  fetchRentals: (
    fromDate: string | undefined,
    states: [string] | undefined
  ) => {
    let queryParams: Record<string, string> = {};
    if (fromDate) {
      queryParams["from_date_time"] = fromDate;
    }
    if (states) {
      queryParams["states"] = states.join(",");
    }
    const url = `${rootUrl}/api/v1/me/reservations?${new URLSearchParams(
      queryParams
    )}`;
    console.log("fetching");
    return fetch(url, {
      headers: {
        "Tenant-id": "2",
      },
    })
      .then((response) => response.json())
      .then((data) => data as Reservations);
  },
};
