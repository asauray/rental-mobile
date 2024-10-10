import React from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { ProductUnit, Rental, RentalApi } from "./api/rental_api";
import { Text } from "@/components/ui/text";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { P } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReservationViewProps {
  reservation: Rental;
  tenant: number;
  currentUser: FirebaseAuthTypes.User;
  reloadRentals: () => void;
}

export const ReservationView = (props: ReservationViewProps) => {
  const [unit, setUnit] = React.useState<ProductUnit | undefined>(undefined);
  React.useEffect(() => {
    RentalApi.fetchUnitById(
      props.reservation.unit_id,
      props.tenant,
      props.currentUser,
      () => auth().signOut()
    ).then((unit) => {
      setUnit(unit);
    });
  }, [props.reservation.unit_id]);

  return unit ? (
    <Card>
      <CardHeader>
        <CardTitle>{props.reservation.customer_first_name}</CardTitle>
        <CardDescription>
          {unit.model.brand} - {unit.model.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 native:gap-2">
        <CardDescription>
          <P>{unit.model.price_per_day / 100}€</P>
        </CardDescription>
        <CardDescription>
          <P>{dayjs(props.reservation.start_date).format("DD MMMM H:mm")}</P>
        </CardDescription>
        <CardDescription>
          <P>{dayjs(props.reservation.end_date).format("DD MMMM H:mm")}</P>
        </CardDescription>
      </CardContent>
      {props.reservation.state == "pending_capture" && (
        <CardFooter className="gap-4 flex justify-end">
          <Button
            variant="default"
            onPress={() => {
              console.log("replying to reservation: " + props.reservation.id);
              RentalApi.replyToReservation(
                props.reservation.id,
                "accept",
                props.tenant,
                props.currentUser,
                () => auth().signOut()
              ).then(() => props.reloadRentals());
            }}
          >
            <Text>Accepter</Text>
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              console.log("replying to reservation: " + props.reservation.id);
              RentalApi.replyToReservation(
                props.reservation.id,
                "reject",
                props.tenant,
                props.currentUser,
                () => auth().signOut()
              ).then(() => props.reloadRentals());
            }}
          >
            <Text>Refuser</Text>
          </Button>
        </CardFooter>
      )}
      {props.reservation.state == "confirmed" && (
        <CardFooter className="gap-4 flex justify-end">
          <Button
            variant="destructive"
            onPress={() => {
              console.log("replying to reservation: " + props.reservation.id);
              RentalApi.replyToReservation(
                props.reservation.id,
                "cancel",
                props.tenant,
                props.currentUser,
                () => auth().signOut()
              ).then(() => props.reloadRentals());
            }}
          >
            <Text>Annuler</Text>
          </Button>
        </CardFooter>
      )}
    </Card>
  ) : (
    <Skeleton className="h-12 w-12 rounded-full" />
  );
};
