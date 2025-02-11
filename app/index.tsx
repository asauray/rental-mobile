import * as React from "react";
import dayjs from "dayjs";
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  SectionList,
  View,
} from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { RentalApi, Reservations } from "./api/rental_api";
import { H4, Muted, P } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import AntDesign from "@expo/vector-icons/AntDesign";
import auth from "@react-native-firebase/auth";
import { ProfileView } from "./ProfileView";
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
import { UserContext } from "./UserContextProvider";
import { Redirect, router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import DeviceInfo from "react-native-device-info";

import * as amplitude from "@amplitude/analytics-react-native";
amplitude.init("0e1b5f251b9dd40685d0188a6ee4f22f");

const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  console.log("is device: ", Device.isDevice);
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log("final status:", finalStatus);
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("push token string");
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    console.log("Must use physical device for push notifications");
  }
}

export default function Home({}) {
  const { tenant } = React.useContext(TenantContext);

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
        user &&
        RentalApi.fetchRentals(
          fromDate.format(),
          reservationProps.states,
          "day",
          tenant,
          user,
          () => auth().signOut()
        )
          .then((newReservations) => {
            setReservations(newReservations);
            setRefreshing(false);
          })
          .catch((error) => {
            console.log("rental error");
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

    const [expoPushToken, setExpoPushToken] = React.useState("");
    const [notification, setNotification] = React.useState<
      Notifications.Notification | undefined
    >(undefined);
    const notificationListener =
      React.useRef<Notifications.EventSubscription>();
    const responseListener = React.useRef<Notifications.EventSubscription>();

    React.useEffect(() => {
      console.log(`submitting user token, user=${user}`);
      if (user) {
        console.log("submitting user token: user logged in");
        registerForPushNotificationsAsync()
          .then(async (token) => {
            console.log("got token: ", token);
            if (token) {
              const deviceId = await DeviceInfo.getUniqueId();
              RentalApi.submitPushToken(
                deviceId,
                token,
                user,
                async () => {}
              ).then(() => {
                console.log("push token submitted");
                setExpoPushToken(token);
              });
            } else {
              setExpoPushToken("");
            }
          })
          .catch((error: any) => {
            console.log("unable to send expo token", error);
            setExpoPushToken(`${error}`);
          });
        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            setNotification(notification);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log(response);
          });

        return () => {
          notificationListener.current &&
            Notifications.removeNotificationSubscription(
              notificationListener.current
            );
          responseListener.current &&
            Notifications.removeNotificationSubscription(
              responseListener.current
            );
        };
      }
    }, [user]);

    return tenant && user && reservations ? (
      <SafeAreaView className="h-full">
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
              currentUser={user}
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
      </SafeAreaView>
    ) : (
      <View className="flex justify-center items-center w-full h-full gap-4">
        <Skeleton className="h-16 w-72 rounded-3xl" />
        <Skeleton className="h-16 w-72 rounded-3xl" />
        <Skeleton className="h-16 w-72 rounded-3xl" />
      </View>
    );
  };

  const PendingReservations = () => (
    <NotificationsView currentUser={user} tenant={tenant} />
  );
  const ConfirmedReservations = () => (
    <ReservationsView states={["confirmed"]} />
  );
  const Tab = createBottomTabNavigator();

  interface ReservationProps {
    states: [string];
  }

  const { user } = React.useContext(UserContext);
  const [initializing, setInitializing] = React.useState(true);

  if (!user) {
    return <Redirect href={"/sign-in"} />;
  }

  if (!tenant) {
    return <Redirect href={"/select-tenant"} />;
  }

  console.log("tenant is ", tenant);
  if (!tenant) {
    return <SelectTenantView user={user} />;
  }

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
        children={() => <ProfileView tenant={tenant} user={user} />}
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
