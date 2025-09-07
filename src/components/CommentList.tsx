'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";
import ElizaCore from "eliza-ja-js/ElizaCore";
import Doctor from "eliza-ja-js/doctor-ja.json";
import { useEffect, useMemo, useState } from "react";

const eliza = new ElizaCore(Doctor);

const Reply = ({ comment, no = 0 }: NicoNamaComment['data']) => {
  const reply = useMemo(() => eliza.transform(comment), [comment]);

  return <>
    <div className="text-lg font-mono">
      {`${comment}`}
    </div>
    <div className="text-5xl font-mono font-bold">
      {`>>${no} ${reply}`}
    </div>
  </>;
};

export function App() {
  const [latency, setLatency] = useState(Number.POSITIVE_INFINITY);
  const [comments, setComments] = useState<NicoNamaComment[]>([]);

  useEffect(() => {
    const id = setInterval(async () => {
      const comments = await fetch('http://localhost:7777/api/comments').then(async res => await res.json());
      setComments(comments);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const status = await fetch('http://localhost:7777/api/status').then(async res => await res.json());
      setLatency(Date.now() - status?.latest);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const displayComments = comments.toReversed().filter(({ data }) => true).slice(0, 3);
  // const latestComment = comments.filter(({ data }) => data.no).at(-1);

  return (
    <div className="flex flex-col-reverse w-full h-full">
      <div className="text-sm">
        {latency <= 1000 ? '🟢Healthy' : latency <= 5000 ? '🟡Unstable' : '🔴Outage'}
      </div>
      {displayComments.length > 0 ? displayComments.map(({ data }) => (
        <div key={data.id} className="bg-black/77 p-2 rounded-lg border-2 border-[#fbf0df]">
          <Reply {...data} />
        </div>
      )) :
        <div className="text-7xl font-bold bg-black/77 p-3 rounded-lg font-mono border-2 border-[#fbf0df] leading-none animate-bounce">
          コメントお待ちしています
        </div>
      }
    </div>
  );
}

export default App;
