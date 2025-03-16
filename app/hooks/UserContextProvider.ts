import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { createContext, ReactNode, useContext, useState } from "react";

interface UserContextValue {
  user: FirebaseAuthTypes.User | null;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
}
const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: (newUser: FirebaseAuthTypes.User | null) => {},
});

const useUserContext = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("Trying to acess useUserContext out of the Provider");
  }

  return context;
};

export { UserContext, useUserContext };
