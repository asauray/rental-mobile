import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import { Logo } from "./logo";
import { Input } from "@/components/ui/input";
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { Button } from "@/components/ui/button";
import { Text } from "~/components/ui/text";
import * as Burnt from "burnt";
import { router } from "expo-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useHeaderHeight } from "@react-navigation/elements";

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: "center",
  },
});

const signInDeepLink = "https://cowork-app.sauray.net/sign-in";
const testEmailAddress = "test@boncowork.com";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const url = Linking.useURL();
  const height = useHeaderHeight();
  const BUNDLE_ID = "net.sauray.booking.cowork";

  const signIn = async () => {
    if (email === testEmailAddress) {
      await auth().signInWithEmailAndPassword(email, password);
    } else {
      await sendSignInLink();
    }
  };
  const sendSignInLink = async () => {
    try {
      await AsyncStorage.setItem("emailForSignIn", email);
      await auth().sendSignInLinkToEmail(email, {
        handleCodeInApp: true,
        url: signInDeepLink,
        iOS: {
          bundleId: BUNDLE_ID,
        },
        android: {
          packageName: BUNDLE_ID,
        },
      });

      Burnt.toast({
        title: "Email sent",
        message: "Check your email for the sign-in link",
        preset: "done",
        icon: {
          ios: {
            // SF Symbol. For a full list, see https://developer.apple.com/sf-symbols/.
            name: "checkmark.seal",
            color: "#1D9BF0",
          },
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error sending login link");
    }
  };

  if (url && email && url.startsWith("https://cowork-app.sauray.net/sign-in")) {
    console.log("signing in with email link: ", email);
    auth().signInWithEmailLink(email, url);
  } else {
    return (
      <SafeAreaView
        style={styles.authContainer}
        className="flex justify-center items-center gap-4 m-4"
      >
        <Logo />
        <KeyboardAvoidingView
          className="w-full"
          keyboardVerticalOffset={height + 47}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="m-4 gap-4">
            <Input
              className="w-full"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
            />
            {email === testEmailAddress && (
              <Input
                className="w-full"
                textContentType="password"
                autoCapitalize="none"
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                }}
              />
            )}
            <Button onPress={() => signIn()}>
              <Text>Se connecter</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}
