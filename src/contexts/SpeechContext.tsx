'use client';

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

type T = {
  text: string
  icon?: string,
};

const SpeechContext = createContext<T>({
  text: '',
});

export const useSpeechContext = () => useContext(SpeechContext);

export const SpeechProvider = ({ children }: PropsWithChildren) => {
  const [value, setValue] = useState<T>({ text: '' });

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/speech')
        .then((res) => res.json())
        .then(({ text, icon }) => setValue({
          text,
          icon,
        }));
    }, 500);

    return () => clearInterval(id);
  }, []);

  return (
    <SpeechContext.Provider value={value}>
      {children}
    </SpeechContext.Provider>
  );
}
