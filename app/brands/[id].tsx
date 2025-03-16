import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Brand, ProductUnit, RentalApi } from "../api/rental_api";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, H2, H4, P } from "@/components/ui/typography";
import { Image, StyleSheet } from "react-native";
import auth from "@react-native-firebase/auth";
import { useTenantContext } from "../hooks/TenantContextProvider";

const styles = StyleSheet.create({
  brandImage: {
    height: 200,
    aspectRatio: 1.5,
    resizeMode: "contain",
  },
  imageSet: {
    height: 150,
    aspectRatio: 1.0,
    resizeMode: "cover",
  },
});

export interface CoworkViewProps {}
export default function CoworkView({}: CoworkViewProps) {
  const { tenant } = useTenantContext();
  const user = auth().currentUser;
  const { id } = useLocalSearchParams();
  const idNum = parseInt(id as string);
  const [brand, setBrand] = useState<Brand | undefined>(undefined);
  const [rooms, setRooms] = useState<ProductUnit[] | undefined>(undefined);

  useEffect(() => {
    tenant &&
      user &&
      RentalApi.fetchBrands(tenant, user, () => auth().signOut()).then(
        (newBrands) => {
          const newBrand = newBrands.brands.find(
            (newBrand) => newBrand.id === idNum
          );
          if (newBrand) {
            setBrand(newBrand);
          }
        }
      );
  }, [id, tenant, user]);

  useEffect(() => {
    brand &&
      tenant &&
      user &&
      RentalApi.fetchAllUnits(brand.id, tenant, user, () =>
        auth().signOut()
      ).then((units) => setRooms(units.units));
  }, [brand]);

  return brand ? (
    <ScrollView>
      <View className="p-4 gap-4">
        <H1>{brand.brand}</H1>
        <View className="flex flex-wrap flex-row gap-4 justify-evenly items-center">
          <Image src={brand.image_set.image1} style={styles.imageSet} />
          <Image src={brand.image_set.image2} style={styles.imageSet} />
          <Image src={brand.image_set.image3} style={styles.imageSet} />
          <Image src={brand.image_set.image4} style={styles.imageSet} />
        </View>
        <H2>Salles</H2>
        <View className="flex gap-4 justify-evenly">
          {brand && rooms ? (
            rooms.map((room) => (
              <View key={room.id}>
                <H4>{room.model.name}</H4>
                <P>Places totales disponibles {room.stock}</P>
              </View>
            ))
          ) : (
            <Skeleton />
          )}
        </View>
      </View>
    </ScrollView>
  ) : (
    <Skeleton />
  );
}
