import React from "react";
import { SelectTenantView } from "./SelectTenantView";
import { UserContext } from "./UserContextProvider";
import { Text } from "@/components/ui/text";

export default function SelectTenant({}) {
  const { user, setUser } = React.useContext(UserContext);
  if (user) {
    return <SelectTenantView user={user} />;
  } else {
    setUser(null);
    <Text>Please sign in</Text>;
  }
}
