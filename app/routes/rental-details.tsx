import * as React from "react";
import { RentalDetailView } from "../components/RentalDetailView";
import { Rental, RentalApi } from "../api/rental_api";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantContext } from "../hooks/TenantContextProvider";
import auth from "@react-native-firebase/auth";
import { useLocalSearchParams } from "expo-router";
import { useUserContext } from "../hooks/UserContextProvider";

export default function RentalDetails() {
  const { rentalId } = useLocalSearchParams();
  const [rental, setRental] = React.useState<Rental | null>(null);
  const { tenant } = useTenantContext();
  const { user } = useUserContext();

  React.useEffect(() => {
    console.log("rentalId: " + rentalId);
    console.log("user: " + user);
    console.log("tenant: " + tenant);
    if (user && tenant) {
      RentalApi.fetchRentalById(user, tenant, rentalId as string, () =>
        auth().signOut()
      ).then((rental) => {
        console.log("got response rental: " + rental);
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
