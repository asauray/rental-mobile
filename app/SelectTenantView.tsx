import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext, useEffect, useState } from "react";
import { RentalApi, Tenant } from "./api/rental_api";
import { TenantContext } from "./TenantContextProvider";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@/components/ui/skeleton";

interface SelectTenantViewProps {
  user: FirebaseAuthTypes.User;
}

export const SelectTenantView = ({ user }: SelectTenantViewProps) => {
  const [tenants, setTenants] = useState<Tenant[] | undefined>(undefined);
  const { tenant, setTenant } = useContext(TenantContext);

  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  useEffect(() => {
    RentalApi.fetchMyTenants(user, () => auth().signOut())
      .then((myTenantsResponse) => {
        console.log(myTenantsResponse);
        setTenants(myTenantsResponse.tenants);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  if (tenants) {
    if (tenants.length > 0) {
      return (
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
          <SelectTrigger>
            <SelectValue
              className="text-foreground text-sm native:text-lg"
              placeholder="Selectionnez un tenant"
            />
          </SelectTrigger>
          <SelectContent insets={contentInsets}>
            <SelectLabel>Tenant</SelectLabel>
            {tenants && (
              <SelectGroup>
                {tenants.map((tenant) => (
                  <View key={tenant.id}>
                    <SelectItem label={tenant.name} value={`${tenant.id}`}>
                      {tenant.id}
                    </SelectItem>
                  </View>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      );
    } else {
      return (
        <View className="h-full flex justify-center items-center">
          <Text>Vous n'avez aucun tenant.</Text>
        </View>
      );
    }
  } else {
    return (
      <View>
        <Skeleton className="h-16 w-72 rounded-3xl" />
      </View>
    );
  }
};
