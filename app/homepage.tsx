import * as React from "react";
import dayjs from "dayjs";
import { RefreshControl, SectionList, View } from "react-native";
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
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ProductUnit, Rental, RentalApi, Reservations } from "./api/rental_api";
import { H4, P } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import AntDesign from "@expo/vector-icons/AntDesign";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { ProfileView } from "./ProfileView";
import { router } from "expo-router";
import { TenantContext } from "./TenantContextProvider";

interface ReservationViewProps {
  reservation: Rental;
  tenant: number;
  currentUser: FirebaseAuthTypes.User;
  reloadRentals: () => void;
}

const ReservationView = (props: ReservationViewProps) => {
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
export default function Home() {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    router.replace("/sign-in");
    return;
  }

  const { tenant } = React.useContext(TenantContext);

  const Tab = createBottomTabNavigator();
  interface ReservationProps {
    states: [string];
    actions: boolean;
  }
  const PendingReservations = () => (
    <ReservationsView states={["pending_capture"]} actions={true} />
  );
  const ConfirmedReservations = () => (
    <ReservationsView states={["confirmed"]} actions={false} />
  );
  const ReservationsView = (reservationProps: ReservationProps) => {
    let next = dayjs().subtract(3, "day").format();

    const [reservations, setReservations] = React.useState<
      Reservations | undefined
    >(undefined);

    const reloadData = (fromDate: string) => {
      setRefreshing(true);
      tenant &&
        currentUser &&
        RentalApi.fetchRentals(
          fromDate,
          reservationProps.states,
          tenant,
          currentUser,
          () => auth().signOut()
        )
          .then((newReservations) => {
            setReservations(newReservations);
            setRefreshing(false);
          })
          .catch((error) => {
            console.log(error);
            setRefreshing(false);
          });
    };

    React.useEffect(() => {
      reloadData(next);
    }, []);

    const data =
      reservations?.bookings_grouped_by_day.map((group) => {
        return { title: group.day, data: group.rentals };
      }) || [];

    const [refreshing, setRefreshing] = React.useState(false);

    const onPullDown = React.useCallback(() => {
      reloadData(next);
    }, []);

    return tenant && currentUser && reservations ? (
      <SectionList
        ListEmptyComponent={() => (
          <View className="flex justify-center items-center w-full h-full gap-2">
            <AntDesign name="checkcircleo" size={24} color="black" />
            <H4>Aucunes réservations</H4>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
        className="gap-4 gap-y-4 p-4"
        sections={data}
        onStartReached={() => {
          //reloadData(previous || next);
        }}
        onEndReached={() => {}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onPullDown} />
        }
        ItemSeparatorComponent={() => <View className="h-4"></View>}
        renderItem={({ item }) => (
          <ReservationView
            reservation={item}
            currentUser={currentUser}
            tenant={tenant}
            reloadRentals={() => {
              console.log("reload all rentals");
              reloadData(next);
            }}
          />
        )}
        renderSectionHeader={({ section }) => (
          <H4 className="m-2 bg-white w-full">
            {dayjs(section.title, "YYYY-MM-DD").format("DD MMMM")}
          </H4>
        )}
        keyExtractor={(item) => `${item.id}`}
      ></SectionList>
    ) : (
      <View className="flex justify-center items-center w-full h-full gap-4">
        <Skeleton className="h-16 w-72 rounded-3xl" />
        <Skeleton className="h-16 w-72 rounded-3xl" />
        <Skeleton className="h-16 w-72 rounded-3xl" />
      </View>
    );
  };

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Pending Reservations"
        component={PendingReservations}
        options={{
          tabBarLabel: "Notifications",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={ConfirmedReservations}
        options={{
          tabBarLabel: "Agenda",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Entypo name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        children={() => <ProfileView user={currentUser} />}
        options={{
          tabBarLabel: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
