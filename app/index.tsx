import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import Home from "./homepage";
import SignIn from "./sign-in";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    if (!user) {
      AsyncStorage.clear();
    }
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;
  if (user) {
    return <Home />;
  } else {
    return <SignIn />;
  }
}
