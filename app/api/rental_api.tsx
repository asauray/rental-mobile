import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import Config from "react-native-config";

const rootUrl = Config.API_ROOT_URL;
export interface Rental {
  id: number;
  state: string;
  unit_id: number;
  start_date: string;
  end_date: string;
  price_amount_minor: number;
  currency: string;
  formatted_price: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone_number: string;
  created_at: string;
}

export interface BookingsGroupedByDay {
  day: string;
  grouping_key: string;
  rentals: Rental[];
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
  slot_price_amount_minor: number;
  slot_price_currency: string;
  formatted_slot_duration: string;
  formatted_price_per_slot: string;
}
export interface Tenant {
  id: number;
  name: string;
}
export interface MyTenantsResponse {
  tenants: Tenant[];
}
export const RentalApi = {
  replyToReservation: (
    reservationId: number,
    response: "accept" | "reject" | "cancel",
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/me/reservations/${reservationId}`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          method: "POST",
          body: JSON.stringify({
            response: response,
          }),
          headers: {
            "Tenant-id": `${tenant}`,
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
      })
      .catch((error) => {
        console.log("fuck");
        console.log(error);
      });
  },
  fetchMyTenants: (
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/me/tenants`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return response.json();
      })
      .then((data) => data as MyTenantsResponse);
  },
  fetchUnitById: (
    unitId: number,
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/rooms/units/${unitId}`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          headers: {
            "Tenant-id": `${tenant}`,
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return response.json();
      })
      .then((data) => data as ProductUnit);
  },
  fetchRentals: (
    fromDate: string | undefined,
    states: string[] | undefined,
    groupBy: "day" | "purchase",
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    console.log(`tenant: ${tenant}`);
    let queryParams: Record<string, string> = {};
    queryParams["group_by"] = groupBy;
    if (fromDate) {
      queryParams["from_date_time"] = fromDate;
    }
    if (states) {
      queryParams["states"] = states.join(",");
    }
    const url = `${rootUrl}/api/v1/me/reservations?${new URLSearchParams(
      queryParams
    )}`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          headers: {
            "Tenant-id": `${tenant}`,
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        return data;
      })
      .then((data) => data as Reservations);
  },
};
