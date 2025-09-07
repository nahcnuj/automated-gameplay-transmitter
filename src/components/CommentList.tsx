'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";
import { useEffect, useState } from "react";

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

  const displayComments = comments.filter(({ data }) => data.no && Date.now() - Date.parse(data.timestamp) < 60000).slice(-3);
  // const latestComment = comments.filter(({ data }) => data.no).at(-1);

  return (
    <div className="flex flex-col-reverse w-full h-full">
      <div className="text-sm">
        {latency <= 1000 ? '🟢Healthy' : latency <= 5000 ? '🟡Unstable' : '🔴Outage'}
      </div>
      {displayComments.length > 0 ? displayComments.map(({ data }) => (
        <div key={data.id} className="text-3xl font-bold bg-black/77 p-2 rounded-lg font-mono border-2 border-[#fbf0df]">
          {data.comment}
        </div>
      )) :
        <div className="text-5xl font-bold bg-black/77 p-3 rounded-lg font-mono border-2 border-[#fbf0df] leading-none animate-bounce">
          コメントお待ちしています
        </div>
      }
    </div>
  );
}

export default App;
