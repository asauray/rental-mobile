import { Redirect } from "expo-router";
import { useTenantContext } from "../hooks/TenantContextProvider";
import { useUserContext } from "../hooks/UserContextProvider";
import { NotificationsView } from "../NotificationView";

export default function PendingReservations() {
  const { tenant } = useTenantContext();
  const { user } = useUserContext();

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (!tenant) {
    return <Redirect href="/select-tenant" />;
  }
  return <NotificationsView currentUser={user} tenant={tenant} />;
}
