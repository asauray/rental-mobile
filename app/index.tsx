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
import { UserContext } from "./hooks/UserContextProvider";
import { Redirect, router, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import DeviceInfo from "react-native-device-info";

import * as amplitude from "@amplitude/analytics-react-native";
import { useTenantContext } from "./hooks/TenantContextProvider";
import { Button } from "@/components/ui/button";
import { ReservationCalendar } from "./components/ReservationCalendar";
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
  const { tenant } = useTenantContext();
  const [channels, setChannels] = React.useState<
    Notifications.NotificationChannel[]
  >([]);
  const notificationListener = React.useRef<Notifications.EventSubscription>();
  const responseListener = React.useRef<Notifications.EventSubscription>();

  React.useEffect(() => {
    registerForPushNotificationsAsync();
    if (Platform.OS === "android") {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        RentalApi.resetCache();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {});

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const PendingReservations = () => (
    <NotificationsView currentUser={user} tenant={tenant} />
  );
  const ConfirmedReservations = () => (
    <ReservationCalendar states={["confirmed"]} />
  );
  const Tab = createBottomTabNavigator();

  interface ReservationProps {
    states: [string];
  }

  const { user } = React.useContext(UserContext);

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
