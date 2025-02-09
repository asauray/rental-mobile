// import { useEffect, useRef, useState } from "react";
// import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
// import Home from "./homepage";
// import SignIn from "./sign-in";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Device from "expo-device";
// import * as Notifications from "expo-notifications";
// import Constants from "expo-constants";
// import { Platform, Text, View } from "react-native";
// import DeviceInfo from "react-native-device-info";
// import { RentalApi } from "./api/rental_api";
// import { router } from "expo-router";
// import { Skeleton } from "@/components/ui/skeleton";
// import { UserContext } from "./UserContextProvider";
// import React from "react";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: false,
//     shouldSetBadge: false,
//   }),
// });

// function handleRegistrationError(errorMessage: string) {
//   alert(errorMessage);
//   throw new Error(errorMessage);
// }

// async function registerForPushNotificationsAsync() {
//   if (Platform.OS === "android") {
//     Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#FF231F7C",
//     });
//   }
//   console.log("is device: ", Device.isDevice);
//   if (Device.isDevice) {
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     console.log("final status:", finalStatus);
//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== "granted") {
//       handleRegistrationError(
//         "Permission not granted to get push token for push notification!"
//       );
//       return;
//     }
//     const projectId =
//       Constants?.expoConfig?.extra?.eas?.projectId ??
//       Constants?.easConfig?.projectId;
//     if (!projectId) {
//       handleRegistrationError("Project ID not found");
//     }
//     try {
//       const pushTokenString = (
//         await Notifications.getExpoPushTokenAsync({
//           projectId,
//         })
//       ).data;
//       console.log("push token string");
//       console.log(pushTokenString);
//       return pushTokenString;
//     } catch (e: unknown) {
//       handleRegistrationError(`${e}`);
//     }
//   } else {
//     console.log("Must use physical device for push notifications");
//   }
// }

// export default function Index() {
//   // Set an initializing state whilst Firebase connects
//   const { user } = React.useContext(UserContext);

//   const [expoPushToken, setExpoPushToken] = useState("");
//   const [notification, setNotification] = useState<
//     Notifications.Notification | undefined
//   >(undefined);
//   const notificationListener = useRef<Notifications.Subscription>();
//   const responseListener = useRef<Notifications.Subscription>();

//   useEffect(() => {
//     console.log(`submitting user token, user=${user}`);
//     if (user) {
//       console.log("submitting user token: user logged in");
//       registerForPushNotificationsAsync()
//         .then(async (token) => {
//           console.log("got token: ", token);
//           if (token) {
//             const deviceId = await DeviceInfo.getUniqueId();
//             RentalApi.submitPushToken(
//               deviceId,
//               token,
//               user,
//               async () => {}
//             ).then(() => {
//               console.log("push token submitted");
//               setExpoPushToken(token);
//             });
//           } else {
//             setExpoPushToken("");
//           }
//         })
//         .catch((error: any) => {
//           console.log("unable to send expo token", error);
//           setExpoPushToken(`${error}`);
//         });
//       notificationListener.current =
//         Notifications.addNotificationReceivedListener((notification) => {
//           setNotification(notification);
//         });

//       responseListener.current =
//         Notifications.addNotificationResponseReceivedListener((response) => {
//           console.log(response);
//         });

//       return () => {
//         notificationListener.current &&
//           Notifications.removeNotificationSubscription(
//             notificationListener.current
//           );
//         responseListener.current &&
//           Notifications.removeNotificationSubscription(
//             responseListener.current
//           );
//       };
//     }
//   }, [user]);
//   if (user) {
//     return <Home />;
//   } else {
//     return <SignIn />;
//   }
// }
