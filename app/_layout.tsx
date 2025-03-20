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
import { TenantContext, useTenantContext } from "./hooks/TenantContextProvider";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { UserContext, useUserContext } from "./hooks/UserContextProvider";

const LIGHT_THEME: Theme = {
  dark: false,
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "800",
    },
  },
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  dark: true,
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "800",
    },
  },
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
  const { user } = useUserContext();
  const { tenant } = useTenantContext();

  function onAuthStateChanged(newUser: FirebaseAuthTypes.User | null) {
    console.log(`onAuthStateChanged: ${newUser ? newUser.email : "null"}`);
    thisSetUser(newUser);
    if (initializing) setInitializing(false);
  }

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

  return (
    <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
      <TenantContext.Provider
        value={{
          tenant: thisTenant,
          setTenant: (tenant) => {
            if (tenant === thisTenant) {
              return;
            }
            console.log("Setting tenant: " + tenant);
            AsyncStorage.setItem("tenant", tenant.toString())
              .then(() => {
                AsyncStorage.getItem("tenant").then((value) => {
                  console.log("new tenant: " + tenant);
                });
                thisSetTenant(tenant);
                router.replace("/");
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
          <Stack
            initialRouteName="index"
            screenOptions={{ headerTitle: "Home" }}
          >
            <Stack.Screen
              name="/routes/rental-details"
              options={{ headerTitle: "Details" }}
            />
            <Stack.Screen
              name="sign-in"
              options={{ headerTitle: "Connection" }}
            />
            <Stack.Screen
              name="me/stripe-return"
              options={{ headerTitle: "Stripe" }}
            />
            <Stack.Screen
              name="me/stripe-refresh"
              options={{ title: "Stripe" }}
            />
            <Stack.Screen
              name="select-tenant"
              options={{ title: "Select Tenant" }}
            />
            <Stack.Screen name="brands/[id]" options={{ title: "Espaces" }} />
          </Stack>
          <PortalHost />
        </UserContext.Provider>
      </TenantContext.Provider>
    </ThemeProvider>
  );
}
