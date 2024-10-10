import "~/global.css";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Theme, ThemeProvider } from "@react-navigation/native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { TenantContext } from "./TenantContextProvider";

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
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const tenant = await AsyncStorage.getItem("tenant");
      thisSetTenant(tenant ? parseInt(tenant, 10) : undefined);

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
        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
        <Stack initialRouteName="index">
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="sign-in" options={{ title: "Connection" }} />
          <Stack.Screen name="homepage" options={{ title: "Home" }} />
        </Stack>
        <PortalHost />
      </TenantContext.Provider>
    </ThemeProvider>
  );
}
