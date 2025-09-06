'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";
import { useEffect, useState } from "react";

export function App() {
  const [latency, setLatency] = useState(Number.POSITIVE_INFINITY);
  const [comments, setComments] = useState<NicoNamaComment[]>([]);

  useEffect(() => {
    const id = setInterval(async () => {
      const comments = await fetch('http://85.131.251.123:7777/api/comments').then(async res => await res.json());
      setComments(comments);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const status = await fetch('http://85.131.251.123:7777/api/status').then(async res => await res.json());
      setLatency(Date.now() - status?.latest);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const latestComment = comments.at(-1);

  return (
    <div className="w-full">
      <div className="text-5xl font-bold bg-[#1a1a1a] p-3 rounded-xl font-mono border-2 border-[#fbf0df]">
        {latestComment ? `${latestComment.data.no} ${latestComment.data.comment}` : 'コメントを待っています'}
      </div>
      <div className="text-sm">
        {latency <= 1000 ? '🟢Healthy' : latency <= 5000 ? '🟡Unstable' : '🔴Outage'}
      </div>
    </div>
  );
}

export default App;
