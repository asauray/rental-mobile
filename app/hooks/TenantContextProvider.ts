import { createContext, ReactNode, useContext, useState } from "react";

interface TenantContextValue {
  tenant: number | undefined;
  setTenant: (tenant: number) => void;
}
const TenantContext = createContext<TenantContextValue>({
  tenant: undefined,
  setTenant: (tenant: number) => {},
});

const useTenantContext = () => {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("Trying to acess useTenantContext out of the Provider");
  }

  return context;
};

export { TenantContext, useTenantContext };
