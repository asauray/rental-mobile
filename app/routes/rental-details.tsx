import * as React from "react";
import { RentalDetailView } from "../components/RentalDetailView";
import { Rental, RentalApi } from "../api/rental_api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TenantContext,
  useTenantContext,
} from "../hooks/TenantContextProvider";
import auth from "@react-native-firebase/auth";
import { useLocalSearchParams } from "expo-router";
import { useUserContext } from "../hooks/UserContextProvider";

interface RentalDetailsProps {
  rentalId: string;
}

export default function RentalDetails() {
  const { rentalId } = useLocalSearchParams();
  const [rental, setRental] = React.useState<Rental | null>(null);
  const { tenant } = useTenantContext();
  const { user } = useUserContext();

  React.useEffect(() => {
    if (user && tenant) {
      RentalApi.fetchRentalById(user, tenant, rentalId as string, () =>
        auth().signOut()
      ).then((rental) => {
        setRental(rental);
      });
    }
  }, [rentalId, user, tenant]);

  return rental && tenant && user ? (
    <RentalDetailView rental={rental} tenant={tenant} currentUser={user} />
  ) : (
    <Skeleton className="w-full h-full" />
  );
}
