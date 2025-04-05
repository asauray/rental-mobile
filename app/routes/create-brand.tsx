import * as React from "react";
import { CreateBrandForm } from "../components/CreateBrandForm";
import { useTenantContext } from "../hooks/TenantContextProvider";
import { useUserContext } from "../hooks/UserContextProvider";
import { Redirect } from "expo-router";

export default function CreateBrand() {
  const { tenant } = useTenantContext();
  const { user } = useUserContext();

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (!tenant) {
    return <Redirect href="/select-tenant" />;
  }

  return <CreateBrandForm tenant={tenant} currentUser={user} />;
}
