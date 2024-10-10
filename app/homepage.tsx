import * as React from "react";
import dayjs from "dayjs";
import { RefreshControl, SectionList, View } from "react-native";
import { Text } from "@/components/ui/text";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Rental, RentalApi, Reservations } from "./api/rental_api";
import { H4, Muted, P } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import AntDesign from "@expo/vector-icons/AntDesign";
import auth from "@react-native-firebase/auth";
import { ProfileView } from "./ProfileView";
import { router } from "expo-router";
import { TenantContext } from "./TenantContextProvider";
import { SelectTenantView } from "./SelectTenantView";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WeekSelectorView } from "./WeekSelectorView";
import { ReservationView } from "./ReservationView";
import { NotificationsView } from "./NotificationView";

const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

export default function Home() {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    router.replace("/sign-in");
    return;
  }

  const { tenant } = React.useContext(TenantContext);
  if (!tenant) {
    return <SelectTenantView user={currentUser} />;
  }

  const Tab = createBottomTabNavigator();
  interface ReservationProps {
    states: [string];
  }
  const PendingReservations = () => (
    <NotificationsView currentUser={currentUser} tenant={tenant} />
  );
  const ConfirmedReservations = () => (
    <ReservationsView states={["confirmed"]} />
  );
  const ReservationsView = (reservationProps: ReservationProps) => {
    const [from, setFrom] = React.useState<dayjs.Dayjs>(
      dayjs().startOf("week")
    );

    const [reservations, setReservations] = React.useState<
      Reservations | undefined
    >(undefined);

    const reloadData = (fromDate: dayjs.Dayjs) => {
      setRefreshing(true);
      tenant &&
        currentUser &&
        RentalApi.fetchRentals(
          fromDate.format(),
          reservationProps.states,
          "day",
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
      reloadData(from);
    }, [from]);

    const data =
      reservations?.bookings_grouped_by_day.map((group) => {
        return { title: group.grouping_key, data: group.rentals };
      }) || [];

    const [refreshing, setRefreshing] = React.useState(false);

    const onPullDown = React.useCallback(() => {
      reloadData(from);
    }, []);

    return tenant && currentUser && reservations ? (
      <View className="h-full">
        <Accordion
          type="single"
          collapsible
          defaultValue={undefined}
          className="w-full max-w-sm native:max-w-md"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="flex justify-center items-center flex-wrap">
              <Text className="basis-full text-center">{`Semaine ${from.week()}`}</Text>
              <Muted>{`Du ${from.format("YYYY/MM/DD")} au ${from
                ?.endOf("week")
                .format("YYYY/MM/DD")}`}</Muted>
            </AccordionTrigger>
            <AccordionContent>
              <WeekSelectorView
                onSelect={(from, to) => {
                  setFrom(from);
                }}
                initialDay={from}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                reloadData(from);
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
      </View>
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
