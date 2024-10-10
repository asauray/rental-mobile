import { Button } from "@/components/ui/button";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useContext, useEffect, useState } from "react";
import { RentalApi, Tenant } from "./api/rental_api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TenantContext } from "./TenantContextProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ProfileViewProps {
  user: FirebaseAuthTypes.User;
}

const styles = StyleSheet.create({
  profilePicture: {
    height: 150,
    aspectRatio: 1.0,
    resizeMode: "contain",
  },
});

export const ProfileView = ({ user }: ProfileViewProps) => {
  const [tenants, setTenants] = useState<Tenant[] | undefined>(undefined);
  const { tenant, setTenant } = useContext(TenantContext);
  useEffect(() => {
    RentalApi.fetchMyTenants(user, () => auth().signOut()).then(
      (myTenantsResponse) => {
        setTenants(myTenantsResponse.tenants);
      }
    );
  }, []);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  return (
    <View className="p-4 h-full flex justify-between items-cente">
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

      {tenants && tenants.length > 0 && (
        <Select
          defaultValue={{
            value: String(tenant) || String(tenants[0].id),
            label: tenants.find((t) => t.id === tenant)?.name ?? "inconnu",
          }}
          onValueChange={(tenant) => {
            if (tenant) {
              setTenant(parseInt(tenant.value));
            }
          }}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue
              className="text-foreground text-sm native:text-lg"
              placeholder="Selectionnez un tenant"
            />
          </SelectTrigger>
          <SelectContent insets={contentInsets} className="w-[250px]">
            {tenants && (
              <SelectGroup>
                {tenants.map((tenant) => (
                  <View key={tenant.id}>
                    <SelectLabel>{tenant.name}</SelectLabel>
                    <SelectItem label={tenant.name} value={`${tenant.id}`}>
                      {tenant.id}
                    </SelectItem>
                  </View>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      )}
      <Button
        className="w-full"
        onPress={() => {
          auth().signOut();
        }}
      >
        <Text>Se Deconnecter</Text>
      </Button>
    </View>
  );
};
