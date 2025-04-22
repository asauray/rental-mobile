import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";

export const useNotification = () => {
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener(async (notification) => {
        console.log("useNotificationHook: received a new notification");
        setNotification(notification);
      });
    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  return {
    notification,
    setNotification,
  };
};
