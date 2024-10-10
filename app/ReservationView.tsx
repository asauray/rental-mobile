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
import { Muted, P } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { View } from "react-native";

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
      <CardHeader className="flex flex-row justify-between items-center">
        <View>
          <CardTitle>{props.reservation.customer_first_name}</CardTitle>
          <View className="flex flex-row justify-between">
            <Muted>
              {unit.model.brand} - {unit.model.name}
            </Muted>
          </View>
        </View>
        <P>{props.reservation.formatted_price}</P>
      </CardHeader>
      <CardContent className="flex gap-2">
        <View>
          <P>
            Du {dayjs(props.reservation.start_date).format("DD MMMM H:mm")} au{" "}
            {dayjs(props.reservation.end_date).format("DD MMMM H:mm")}
          </P>
        </View>

        {props.reservation.state == "confirmed" && (
          <View className="flex items-end">
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
          </View>
        )}
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
    </Card>
  ) : (
    <Skeleton className="h-12 w-12 rounded-full" />
  );
};
