'use client';

import { createContext, useContext, useEffect, useState, type JSX, type PropsWithChildren } from "react";

type T = {
  text: string
  icon: JSX.Element | null,
};

const SpeechContext = createContext<T>({
  text: '',
  icon: null,
});

export const useSpeechContext = () => useContext(SpeechContext);

export const SpeechProvider = ({ children }: PropsWithChildren) => {
  const [value, setValue] = useState<T>({ text: '', icon: null });

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/speech')
        .then((res) => res.json())
        .then(({ text, icon }) => setValue({
          text,
          icon: icon ? <img src={icon} width={32} height={32} /> : null,
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
