import React from "react";
import { ProductUnit, Rental, RentalApi, Reservations } from "./api/rental_api";
import auth, { FirebaseAuthTypes, reload } from "@react-native-firebase/auth";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import AntDesign from "@expo/vector-icons/AntDesign";
import { H4, P } from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

interface NotificationsViewProps {
  tenant: number;
  currentUser: FirebaseAuthTypes.User;
}

export const NotificationsView = ({
  tenant,
  currentUser,
}: NotificationsViewProps) => {
  const [reservations, setReservations] = React.useState<
    Reservations | undefined
  >(undefined);

  const reloadData = () => {
    setRefreshing(true);
    tenant &&
      currentUser &&
      RentalApi.fetchRentals(
        dayjs().subtract(1, "day").format(),
        dayjs().add(12, "week").format(),
        ["pending_capture"],
        "purchase",
        tenant,
        currentUser,
        () => auth().signOut()
      )
        .then((newReservations) => {
          setReservations(newReservations);
          setRefreshing(false);
        })
        .catch((error) => {
          console.log("notifications view", error);
          setRefreshing(false);
        });
  };

  React.useEffect(() => {
    reloadData();
  }, []);

  const data = reservations?.bookings_grouped_by_day || [];

  const [refreshing, setRefreshing] = React.useState(false);

  const onPullDown = React.useCallback(() => {
    reloadData();
  }, []);

  const NotificationView = ({ reservation }: { reservation: Rental[] }) => {
    const [units, setUnits] = React.useState<
      Map<number, ProductUnit> | undefined
    >(undefined);
    React.useEffect(() => {
      const uniqueUnitIds = [
        ...new Set(reservation.map((item) => item.unit_id)),
      ];
      Promise.all(
        uniqueUnitIds.map((unitId) =>
          RentalApi.fetchUnitById(unitId, tenant, currentUser, () =>
            auth().signOut()
          )
        )
      ).then((units) => {
        const acc = new Map<number, ProductUnit>();
        const map = units.reduce(function (map, obj) {
          map.set(obj.id, obj);
          return map;
        }, acc);

        setUnits(map);
      });
    }, [reservation]);

    const total =
      units &&
      reservation.reduce((acc, r) => {
        const unit = units.get(r.unit_id);
        return unit ? acc + r.price_amount_minor : acc;
      }, 0) / 100;

    return units ? (
      <Card>
        <CardHeader>
          <CardTitle>{reservation[0].customer_first_name}</CardTitle>
          <CardDescription>Total: {total}.00 €</CardDescription>
          <P>{reservation[0].customer_email}</P>
          <P>{reservation[0].customer_phone_number}</P>
        </CardHeader>
        <CardContent className="gap-4 native:gap-2">
          {reservation.map((r) => {
            const unit = units.get(r.unit_id);
            return (
              unit && (
                <View>
                  <CardDescription>
                    <P>{r.formatted_price}</P>
                  </CardDescription>
                  <CardDescription>
                    <P>{dayjs(r.start_date).format("DD MMMM H:mm")}</P>
                  </CardDescription>
                  <CardDescription>
                    <P>{dayjs(r.end_date).format("DD MMMM H:mm")}</P>
                  </CardDescription>
                </View>
              )
            );
          })}
        </CardContent>
        <CardFooter className="gap-4 flex justify-end">
          <Button
            variant="default"
            onPress={() => {
              console.log("replying to reservation: " + reservation[0].id);
              RentalApi.replyToReservation(
                reservation[0].id,
                "accept",
                tenant,
                currentUser,
                () => auth().signOut()
              ).then(() => reloadData());
            }}
          >
            <Text>Accepter</Text>
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              Alert.prompt(
                "Refuser la réservation",
                "Etes-vous sur de bien vouloir refuser la réservation",
                [
                  {
                    isPreferred: false,
                    text: "Retour",
                  },
                  {
                    isPreferred: false,
                    text: "Confirmer",
                    onPress: () => {
                      console.log(
                        "replying to reservation: " + reservation[0].id
                      );
                      RentalApi.replyToReservation(
                        reservation[0].id,
                        "reject",
                        tenant,
                        currentUser,
                        () => auth().signOut()
                      ).then(() => reloadData());
                    },
                  },
                ]
              );
              console.log("replying to reservation: " + reservation[0].id);
            }}
          >
            <Text>Refuser</Text>
          </Button>
        </CardFooter>
      </Card>
    ) : (
      <Skeleton className="h-12 w-12 rounded-full" />
    );
  };

  return tenant && currentUser && reservations ? (
    <View className="h-full">
      <FlatList
        ListEmptyComponent={() => (
          <View className="flex justify-center items-center w-full h-full gap-2">
            <AntDesign name="checkcircleo" size={24} color="black" />
            <H4 className="text-wrap text-center ml-8 mr-8">
              Aucunes réservations en attente de validation
            </H4>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
        className="gap-4 gap-y-4 p-4"
        data={data}
        onStartReached={() => {
          //reloadData(previous || next);
        }}
        onEndReached={() => {}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullDown} />
        }
        ItemSeparatorComponent={() => <View className="h-4"></View>}
        renderItem={({ item }) => (
          <NotificationView reservation={item.rentals} />
        )}
        keyExtractor={(item) => `${item.grouping_key}`}
      ></FlatList>
    </View>
  ) : (
    <View className="flex justify-center items-center w-full h-full gap-4">
      <Skeleton className="h-16 w-72 rounded-3xl" />
      <Skeleton className="h-16 w-72 rounded-3xl" />
      <Skeleton className="h-16 w-72 rounded-3xl" />
    </View>
  );
};

export default NotificationsView;
