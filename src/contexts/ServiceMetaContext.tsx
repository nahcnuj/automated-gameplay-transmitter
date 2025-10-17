'use client';

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

export type LiveInfo = {
  url?: string
  startTime?: number
  total?: number
  points?: {
    ad?: number
    gift?: number
  }
};

const ServiceMetaContext = createContext<LiveInfo>({});

export const useServiceMetaContext = () => useContext(ServiceMetaContext);

export function ServiceMetaProvider({ children }: PropsWithChildren) {
  const [serviceMeta, setServiceMeta] = useState<LiveInfo>({});

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

