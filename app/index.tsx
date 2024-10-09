import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import SignIn from "./sign-in";

export default function Index() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  if (!user) {
    return <SignIn />;
  }

  return (
    <View>
      <Text>Welcome {user.email}</Text>
    </View>
  );
}
