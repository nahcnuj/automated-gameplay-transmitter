'use client';

import { createContext, useContext, useEffect, useState, type JSX, type PropsWithChildren } from "react";
import { CharacterSprite } from "../components/CharacterSprite";

type Speech = {
  text: string
  icon?: string,
};

type T = {
  speech?: Speech,
  sprite?: JSX.Element,
};

const AIVTuberContext = createContext<T>({});

export const useAIVTuberContext = () => useContext(AIVTuberContext);

export const AIVTuberProvider = ({ children }: PropsWithChildren) => {
  const [speech, setSpeech] = useState<Speech>();
  // const [value, setValue] = useState<T>({});

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/speech')
        .then((res) => res.json())
        .then(({ text, icon }) => setSpeech({
          text,
          icon,
        }));
    }, 500);

    return () => clearInterval(id);
  }, []);

  // const sprite = <CharacterSprite src="/img/nc433974.png" height="50" className="transform-[scale(-1,1)]"/>;
  const sprite = <CharacterSprite src="/img/nc436438.png" height="50" className="transform-[scale(-1,1)]"/>;

  return (
    <AIVTuberContext.Provider value={{ speech, sprite }}>
      {children}
    </AIVTuberContext.Provider>
  );
}

