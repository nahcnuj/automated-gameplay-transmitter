import { useEffect, useRef } from "react";

export const useInterval = (ms: number, f: () => Promise<void>) => {
  const ref = useRef(f);
  useEffect(() => {
    ref.current = f;
  }, [f]);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    let cancelled = false;
    function run() {
      ref.current().catch(console.error).finally(() => {
        if (cancelled) {
          return;
        }
        id = setTimeout(run, ms);
      });
    }
    id = setTimeout(run, ms);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [ms]);
};
