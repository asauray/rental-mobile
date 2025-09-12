import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useContext, useEffect, useState } from "react";
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
import { router } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useUserContext } from "./hooks/UserContextProvider";

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: "center",
  },
});

const signInDeepLink = "https://api.boncowork.com/sign-in";
const testEmailAddress = "test@boncowork.com";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { setUser } = useUserContext();

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
      setEmailSent(true);
    } catch (error) {
      console.error(error);
      Alert.alert("Error sending login link");
    }
  };

  React.useEffect(() => {
    const handleEmailLink = async () => {
      if (url && url.startsWith(signInDeepLink)) {
        console.log("handling email link: ", url);
        let emailForSignIn = email;
        
        // If email is not in state, try to get it from AsyncStorage
        if (!emailForSignIn) {
          const emailForSignIn = await AsyncStorage.getItem("emailForSignIn");
          if (emailForSignIn) {
            setEmail(emailForSignIn);
          }
        }
        
        if (emailForSignIn) {
          console.log("signing in with email link: ", emailForSignIn);
          try {
            const result = await auth().signInWithEmailLink(emailForSignIn, url);
            setUser(result.user);
            await AsyncStorage.removeItem("emailForSignIn"); // Clean up
            router.replace("/");
          } catch (error) {
            console.error("Error signing in with email link:", error);
            Alert.alert("Error", "Failed to sign in with email link");
          }
        } else {
          console.log("No email found for sign in link");
          Alert.alert("Error", "No email found for this sign-in link");
        }
      }
    };
    
    handleEmailLink();
  }, [url]);

  return (
      <SafeAreaView
        style={styles.authContainer}
        className="flex justify-center items-center gap-4 m-4"
      >
        {emailSent && (
          <View className="gap-4">
            <Logo />
            <Text>Regardez dans votre boite mail pour vous connecter.</Text>
            <Button onPress={() => signIn()}>
              <Text>Renvoyer un email</Text>
            </Button>
          </View>
        )}
        {!emailSent && (
          <>
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
          </>
        )}
      </SafeAreaView>
    );
}
