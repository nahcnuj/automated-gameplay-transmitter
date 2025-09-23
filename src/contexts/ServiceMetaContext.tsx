'use client';

import type { ServiceMeta } from "@onecomme.com/onesdk";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

const ServiceMetaContext = createContext<ServiceMeta>({});

export const useServiceMetaContext = () => useContext(ServiceMetaContext);

export function ServiceMetaProvider({ children }: PropsWithChildren) {
  const [serviceMeta, setServiceMeta] = useState<ServiceMeta>({});

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/meta')
        .then((res) => res.json())
        .then(setServiceMeta)
        .catch(console.warn);
    }, 500);

    return () => clearInterval(id);
  }, []);

  return (
    <ServiceMetaContext.Provider value={serviceMeta}>
      {children}
    </ServiceMetaContext.Provider>
  );
}

