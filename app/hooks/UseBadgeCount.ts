import { useCallback, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus } from "react-native";

export const useBadgeCount = () => {
  const [badgeCount, setBadgeCount] = useState<number | undefined>(undefined);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    console.log("next app state:" + nextAppState);
    if (nextAppState === "active") {
      // App has come to the foreground
      console.log("App has come to the foreground");
      Notifications.getBadgeCountAsync().then((badgeCount) =>
        setBadgeCount(badgeCount)
      );
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  return {
    badgeCount,
  };
};
