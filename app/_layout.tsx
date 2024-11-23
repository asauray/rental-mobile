import "~/global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { TenantContext } from "./TenantContextProvider";
import { UserContext } from "./UserContextProvider";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import * as Notifications from "expo-notifications";
import { RentalApi } from "./api/rental_api";
import DeviceInfo from "react-native-device-info";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStaticNavigation } from "@react-navigation/native";
import Home from "./homepage";
import SignIn from "./sign-in";

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.dark,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before getting the color scheme.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [thisTenant, thisSetTenant] = React.useState<number | undefined>(
    undefined
  );

  const [initializing, setInitializing] = React.useState(true);
  const [thisUser, thisSetUser] = React.useState<FirebaseAuthTypes.User | null>(
    null
  );

  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  function onAuthStateChanged(user) {
    if (!initializing && !user) {
      AsyncStorage.clear();
      router.replace("/sign-in");
    } else if (!initializing && user) {
      router.replace("/homepage");
      user.getIdToken().then((token) => {
        console.log(token);
      });
    }
    console.log("set new user: ", user);
    thisSetUser(user);
    if (initializing) setInitializing(false);
  }

  const { user } = React.useContext(UserContext);

  const [expoPushToken, setExpoPushToken] = React.useState("");
  const [notification, setNotification] = React.useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = React.useRef<Notifications.Subscription>();
  const responseListener = React.useRef<Notifications.Subscription>();

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

  React.useEffect(() => {
    console.log("submitting user token");
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

  React.useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  React.useEffect(() => {
    (async () => {
      const tenant = await AsyncStorage.getItem("tenant");
      thisSetTenant(tenant ? parseInt(tenant, 10) : undefined);
      console.log("new default tenant: " + tenant);

      const theme = await AsyncStorage.getItem("theme");
      if (Platform.OS === "web") {
        // Adds the background color to the html element to prevent white background on overscroll.
        document.documentElement.classList.add("bg-background");
      }
      if (!theme) {
        AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }
  const RootStack = createNativeStackNavigator({
    screens: {
      Home: {
        if: true,
        screen: Home,
      },
      SignIn: {
        if: false,
        screen: SignIn,
        options: {
          title: "Sign in",
        },
      },
    },
  });

  const Navigation = createStaticNavigation(RootStack);
  return (
    <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
      <TenantContext.Provider
        value={{
          tenant: thisTenant,
          setTenant: (tenant) => {
            console.log("Setting tenant: " + tenant);
            AsyncStorage.setItem("tenant", tenant.toString())
              .then(() => {
                AsyncStorage.getItem("tenant").then((value) => {
                  console.log("new tenant: " + tenant);
                });
                thisSetTenant(tenant);
              })
              .catch((error) => {
                console.log(error);
              });
          },
        }}
      >
        <UserContext.Provider
          value={{
            user: thisUser,
            setUser: (user) => {
              thisSetUser(user);
            },
          }}
        >
          <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
          <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ title: "Index" }} />
            <Stack.Screen name="sign-in" options={{ title: "Connection" }} />
            <Stack.Screen name="homepage" options={{ title: "Home" }} />
            <Stack.Screen name="brands/[id]" options={{ title: "Espaces" }} />
          </Stack>
          <PortalHost />
        </UserContext.Provider>
      </TenantContext.Provider>
    </ThemeProvider>
  );
}
