import React from "react";
import { TenantContext } from "./TenantContextProvider";
import { SelectTenantView } from "./SelectTenantView";
import { UserContext } from "./UserContextProvider";
import { Text } from "@/components/ui/text";

export default function Home({}) {
  const { user } = React.useContext(UserContext);
  if (user) {
    return <SelectTenantView user={user} />;
  } else {
    <Text>Please sign in</Text>;
  }
}
