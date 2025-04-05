import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import Config from "react-native-config";
import { Brand, CreateBrand } from "../types/brand";

const rootUrl = "http://192.168.1.41:8080"; //Config.API_ROOT_URL;

export const BrandApi = {
  createBrand: (
    createBrandDto: CreateBrand,
    tenant: number,
    user: FirebaseAuthTypes.User,
    signOut: () => Promise<void>
  ) => {
    const url = `${rootUrl}/api/v1/admin/rooms/brands`;
    return user
      .getIdToken()
      .then((idToken) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
            "Tenant-id": `${tenant}`,
          },
          body: JSON.stringify({
            brand: createBrandDto.brand,
            logo: createBrandDto.logo,
            human_readable_id: createBrandDto.humanReadableId,
            image_set: {
              image1: createBrandDto.imageSet.image1,
              image2: createBrandDto.imageSet.image2,
              image3: createBrandDto.imageSet.image3,
              image4: createBrandDto.imageSet.image4,
            },
            open_hours: {
              monday: createBrandDto.openHours.monday,
              tuesday: createBrandDto.openHours.tuesday,
              wednesday: createBrandDto.openHours.wednesday,
              thursday: createBrandDto.openHours.thursday,
              friday: createBrandDto.openHours.friday,
              saturday: createBrandDto.openHours.saturday,
              sunday: createBrandDto.openHours.sunday,
            },
          }),
        })
      )
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          return signOut();
        }
        if (!response.ok) {
          throw new Error("Failed to create brand");
        }
        return response.json();
      })
      .then((data) => data as Brand);
  },
};
