import React, { useState, useEffect } from "react";
import { StyleSheet, Button, View, Text, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import dynamicLinks from "@react-native-firebase/dynamic-links";

export default function Index() {
  const [email, setEmail] = useState("");

  const BUNDLE_ID = "net.sauray.cowork";

  const sendSignInLink = async (email: string) => {
    try {
      await AsyncStorage.setItem("emailForSignIn", email);
      await auth().sendSignInLinkToEmail(email, {
        handleCodeInApp: true,
        url: "https://cowork-booking-1354e.web.app",
        iOS: {
          bundleId: BUNDLE_ID,
        },
        android: {
          packageName: BUNDLE_ID,
        },
      });

      Alert.alert(`Login link sent to ${email}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error sending login link");
    }
  };

  return (
    <View style={styles.authContainer}>
      <Text style={styles.sectionTitle}>Magic Link Sign In</Text>
      <TextInput
        style={styles.textInput}
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <Button
        color={"007AFF"}
        title="Send login link"
        onPress={() => sendSignInLink(email)}
      />
    </View>
  );
}

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
