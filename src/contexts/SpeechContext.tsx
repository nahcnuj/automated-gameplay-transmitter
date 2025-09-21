'use client';

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

const SpeechContext = createContext<{ text: string }>({
  text: '',
});

export const useSpeechContext = () => useContext(SpeechContext);

export const SpeechProvider = ({ children }: PropsWithChildren) => {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/speech')
        .then((res) => res.text())
        .then(setText);
    }, 100);

    return () => clearInterval(id);
  }, []);

  return (
    <SpeechContext.Provider value={{
      text,
    }}>
      {children}
    </SpeechContext.Provider>
  );
}
