import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import Home from "./homepage";
import SignIn from "./sign-in";

export default function Index() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    user.getIdToken().then((token) => {
      console.log(token);
    });

    if (initializing) setInitializing(false);
    if (user) {
      //router.replace("/homepage");
    } else {
      //router.replace("/sign-in");
    }
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
