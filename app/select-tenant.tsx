import React from "react";
import { SelectTenantView } from "./SelectTenantView";
import { useUserContext } from "./hooks/UserContextProvider";
import { Text } from "@/components/ui/text";

export default function SelectTenant({}) {
  const { user, setUser } = useUserContext();
  if (user) {
    return <SelectTenantView user={user} />;
  } else {
    setUser(null);
    <Text>Please sign in</Text>;
  }
}
