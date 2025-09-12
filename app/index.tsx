import * as React from "react";
import dayjs from "dayjs";
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  SectionList,
  View,
  TouchableOpacity,
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
import * as TaskManager from "expo-task-manager";
import { PayoutDto } from "./types/payout";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { PayoutsScreen } from "./routes/payouts-screen";
import ReservationSearch from "./ReservationSearch";
import { NotificationRefreshProvider, useNotificationRefresh } from "./hooks/NotificationRefreshContext";

amplitude.init("0e1b5f251b9dd40685d0188a6ee4f22f");

const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// Define the background task outside of any component
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  console.log("Background notification task: received a new notification");
  try {
    // Handle background notification processing here
    // Note: We can't access React context here, so keep it simple
    console.log("Background notification processed");
  } catch (err) {
    console.error("Error in background notification task:", err);
  }
});

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

async function registerForPushNotificationsAsync(user: FirebaseAuthTypes.User) {
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
      const deviceId = await DeviceInfo.getUniqueId();
      await RentalApi.submitPushToken(deviceId, pushTokenString, user, () => auth().signOut());
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    console.log("Must use physical device for push notifications");
  }
}

function HomeContent() {
  const { tenant } = useTenantContext() as { tenant: number };
  const { triggerRefresh } = useNotificationRefresh();
  const [channels, setChannels] = React.useState<
    Notifications.NotificationChannel[]
  >([]);
  const notificationListener = React.useRef<Notifications.EventSubscription>();
  const responseListener = React.useRef<Notifications.EventSubscription>();

  const { user } = React.useContext(UserContext) as {
    user: FirebaseAuthTypes.User;
  };
  
  React.useEffect(() => {
    registerForPushNotificationsAsync(user);
    if (Platform.OS === "android") {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        RentalApi.resetCache();
        console.log("Push notification received, triggering refresh");
        triggerRefresh(); // Trigger refresh for all components listening
        if (user && tenant) {
          const pendingReservations = await RentalApi.fetchRentals(
            dayjs().subtract(1, "day").format(),
            dayjs().add(14, "week").format(),
            ["pending_capture"],
            "purchase",
            tenant,
            user,
            () => auth().signOut()
          );
          await Notifications.setBadgeCountAsync(
            pendingReservations.bookings_grouped_by_day.length
          );
        }
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
  }, [triggerRefresh, user]);

  React.useEffect(() => {
    // Register the background task when component mounts
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  }, []);

  const ConfirmedReservations = () => {
    const navigation = require("@react-navigation/native").useNavigation();
    return (
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("ReservationSearch")}
            style={{ padding: 8 }}
            accessibilityLabel="Rechercher une réservation"
          >
            <Entypo name="magnifying-glass" size={24} color="#222" />
          </TouchableOpacity>
        </View>
        <ReservationCalendar states={["confirmed"]} />
      </View>
    );
  };
  const Tab = createBottomTabNavigator();

  interface ReservationProps {
    states: [string];
  }



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

export default function Home({}) {
  return <HomeContent />;
}
