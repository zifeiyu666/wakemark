"use client";

import { createContext, useContext, type ReactNode } from "react";

type ProductAccessValue = {
  hasServiceAccess: boolean;
  hasPaidSubscription: boolean;
};

const ProductAccessContext = createContext<ProductAccessValue>({
  hasServiceAccess: true,
  hasPaidSubscription: true,
});

export function ProductAccessProvider({
  hasServiceAccess,
  hasPaidSubscription,
  children,
}: {
  hasServiceAccess: boolean;
  hasPaidSubscription: boolean;
  children: ReactNode;
}) {
  return (
    <ProductAccessContext.Provider
      value={{ hasServiceAccess, hasPaidSubscription }}
    >
      {children}
    </ProductAccessContext.Provider>
  );
}

export function useProductAccess() {
  return useContext(ProductAccessContext);
}
