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
export interface AllProductUnitResponse {
  units: ProductUnit[];
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

export interface ImageSet {
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}

export interface OpenHours {
  open: string;
  close: string;
}

export interface Brand {
  id: number;
  brand: string;
  logo: string;
  human_readable_id: string;
  image_set: ImageSet;
  business: string;
  open_hours: {
    monday: OpenHours;
    tuesday: OpenHours;
    wednesday: OpenHours;
    thursday: OpenHours;
    friday: OpenHours;
    saturday: OpenHours;
    sunday: OpenHours;
  };
  tenant_id: number;
}

export interface BrandsResponse {
  brands: Brand[];
}

export const RentalApi = {
  submitPushToken: (
    deviceId: string,
    expoToken: string,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/me/devices`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          method: "POST",
          body: JSON.stringify({
            device_id: deviceId,
            expo_push_token: expoToken,
          }),
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
      )
      .then((response) => {
        console.log(response.status);
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return {};
      });
  },
  fetchAllUnits: (
    brandId: number,
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/rooms/units?brandId=${brandId}`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Tenant-id": `${tenant}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return response.json();
      })
      .then((data) => data as AllProductUnitResponse);
  },
  fetchBrands: (
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/admin/rooms/brands`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Tenant-id": `${tenant}`,
          },
        })
      )
      .then((response) => {
        if (response.status == 401 || response.status == 403) {
          return signOut();
        }
        return response.json();
      })
      .then((data) => data as BrandsResponse);
  },
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
        // add 1s of delay to ensure the response is processed
        return new Promise((r) => setTimeout(r, 1000));
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
    console.log("url is ", url);
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
        if (response.status >= 200 && response.status < 300) {
          return response.json();
        } else if (response.status === 401 || response.status === 403) {
          console.log("signin out");
          return signOut();
        } else {
          console.log(
            "unhandled error on fetchMyTenants, http=",
            response.statusText
          );
          return signOut();
        }
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
        console.log("tenant", tenant);
        console.log("fetchUnitById(" + unitId + " response", response.status);
        if (response.status == 401 || response.status == 403) {
          console.log("signin out");
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
          console.log("signin out");
          return signOut();
        }
        return response.json();
      })
      .then((data) => {
        console.log(JSON.stringify(data));
        return data;
      })
      .then((data) => data as Reservations);
  },
};
