import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export const useAppLifeCycle = (stateChange: AppStateStatus) => {
  const [appIsInState, setAppIsInState] = useState<boolean | undefined>(true);
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    console.log("next app state:" + nextAppState);
    if (nextAppState === stateChange) {
      // App has come to the foreground
      console.log("App has come to the foreground");
      setAppIsInState(true);
      // You can trigger your effect here
    } else {
      setAppIsInState(false);
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

  return { appIsInState };
};
