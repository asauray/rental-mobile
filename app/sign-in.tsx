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

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 24,
    height: "100%",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
  },
  loadingContainer: {
    backgroundColor: "rgba(250,250,250,0.33)",
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    borderColor: "blue",
    borderWidth: 1,
    marginTop: 16,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
});

const signInDeepLink = "https://app.cowork.sauray.net/sign-in";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const url = Linking.useURL();

  const BUNDLE_ID = "net.sauray.booking.cowork";

  const sendSignInLink = async (email: string) => {
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

  if (url && url.startsWith("https://app.cowork.sauray.net/sign-in")) {
    auth()
      .signInWithEmailLink(email, url)
      .then((result) => {
        result && console.log(result);
        router.replace("/homepage");
      });
    return <Skeleton className="h-16 w-72 rounded-3xl" />;
  } else {
    return (
      <SafeAreaView
        style={styles.authContainer}
        className="flex justify-center items-center gap-4 m-4"
      >
        <Logo />
        <KeyboardAvoidingView
          className="w-full"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          enabled={false}
        >
          <Input
            className="w-full"
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
        </KeyboardAvoidingView>
        <Button className="w-full m-4" onPress={() => sendSignInLink(email)}>
          <Text>Se connecter</Text>
        </Button>
      </SafeAreaView>
    );
  }
}
