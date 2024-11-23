import { Button } from "@/components/ui/button";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Brand, RentalApi } from "./api/rental_api";

import { SelectTenantView } from "./SelectTenantView";
import { H4, P } from "@/components/ui/typography";
import { router } from "expo-router";

export interface ProfileViewProps {
  tenant: number;
  user: FirebaseAuthTypes.User;
}

const styles = StyleSheet.create({
  profilePicture: {
    height: 150,
    aspectRatio: 1.0,
    resizeMode: "contain",
  },
});

export const ProfileView = ({ tenant, user }: ProfileViewProps) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  useEffect(() => {
    RentalApi.fetchBrands(tenant, user, () => auth().signOut()).then(
      (newBrands) => {
        setBrands(newBrands.brands);
      }
    );
  }, []);
  return (
    <ScrollView>
      <View className="p-4 gap-4 h-full flex justify-between items-center">
        <Card>
          <CardHeader className="p-4 flex justify-between items-center">
            <CardTitle>{user.email}</CardTitle>
            <Image
              defaultSource={require("~/assets/images/avatar-placeholder.jpg")}
              style={styles.profilePicture}
              src={user.photoURL || undefined}
            />
          </CardHeader>
        </Card>

        <SelectTenantView user={user} />
        <Card className="w-full">
          <CardHeader className="p-4 flex justify-between items-start">
            <CardTitle>Espaces</CardTitle>
          </CardHeader>
          <CardContent>
            {brands.map((brand) => (
              <View
                key={brand.id}
                className="flex flex-row justify-between items-center"
              >
                <P>{brand.brand}</P>

                {
                  <Button
                    variant="outline"
                    onPress={() => {
                      router.push(`/brands/${brand.id}`);
                    }}
                  >
                    <Text>Details</Text>
                  </Button>
                }
              </View>
            ))}
          </CardContent>
        </Card>
        <Button
          className="w-full"
          onPress={() => {
            auth().signOut();
          }}
        >
          <Text>Se Deconnecter</Text>
        </Button>
      </View>
    </ScrollView>
  );
};
