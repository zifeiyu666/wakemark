"use client";

import { createContext, useContext, type ReactNode } from "react";

type ProductAccessValue = {
  hasServiceAccess: boolean;
};

const ProductAccessContext = createContext<ProductAccessValue>({
  hasServiceAccess: true,
});

export function ProductAccessProvider({
  hasServiceAccess,
  children,
}: {
  hasServiceAccess: boolean;
  children: ReactNode;
}) {
  return (
    <ProductAccessContext.Provider value={{ hasServiceAccess }}>
      {children}
    </ProductAccessContext.Provider>
  );
}

export function useProductAccess() {
  return useContext(ProductAccessContext);
}
