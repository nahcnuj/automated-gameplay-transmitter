'use client';

import { createContext, useContext, useEffect, useState, type JSX, type PropsWithChildren } from "react";
import { CharacterSprite } from "../components/CharacterSprite";
import type { Statistics } from "src/games/cookieclicker";

type Props = {
  game: 'cookieclicker'
};

type Speech = {
  text: string
  icon?: string
};

type T = {
  speech?: Speech
  sprite?: JSX.Element
  gameState: { // TODO
    statistics?: Statistics
  }
};

const AIVTuberContext = createContext<T>({
  gameState: {},
});

export const useAIVTuberContext = () => useContext(AIVTuberContext);

export const AIVTuberProvider = ({ game, children }: PropsWithChildren<Props>) => {
  const [speech, setSpeech] = useState<Speech>();
  const [gameState, setGameState] = useState<T['gameState']>({});

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

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        await fetch('http://localhost:7777/api/game')
          .then((res) => res.ok ? res.json() : null)
          .then((state) => setGameState((prev: any) => ({ ...prev, ...state })));
      } catch (err) {
        console.warn('[WARN]', 'failed to fetch /api/game', err);
        return null;
      }
    }, 1_000);

    return () => clearInterval(id);
  }, [game]);

  const sprite = <CharacterSprite src="/img/nc433974.png" height="50" className="transform-[scale(-1,1)]" />;

  return (
    <AIVTuberContext.Provider value={{ speech, sprite, gameState }}>
      {children}
    </AIVTuberContext.Provider>
  );
}

