import { useEffect, useRef } from "react";

// identical implementation copied from makamujo, now shared
export const useInterval = (ms: number, f: () => Promise<void>) => {
  const ref = useRef(f);
  useEffect(() => {
    ref.current = f;
  }, [f]);

  useEffect(() => {
    let id: NodeJS.Timer;
    function run() {
      ref.current().catch(console.error).finally(() => {
        id = setTimeout(run, ms);
      });
    }
    id = setTimeout(run, ms);
    return () => clearTimeout(id);
  }, [ms]);
};
