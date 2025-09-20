'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";
import ElizaCore from "eliza-ja-js/ElizaCore";
import Doctor from "eliza-ja-js/doctor-ja.json";
import { useEffect, useMemo, useState } from "react";

const eliza = new ElizaCore(Doctor);

const Reply = ({ comment, no = 0 }: NicoNamaComment['data']) => {
  const reply = useMemo(() => eliza.transform(comment), [comment]);

  return (
    <div className="text-3xl font-mono font-bold">
      {no ? `>>${no} ` : ''}
      {`${reply}`}
    </div>
  );
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

  useEffect(() => {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance());
    console.log('useEffect', window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = function () {
      console.log('onvoiceschanged', window.speechSynthesis.getVoices());
    };
  }, []);

  const systemMessages = comments.filter(({ data }) => data.userId === 'onecomme.system');
  const numStartQuote = systemMessages.filter(({ data }) => data.comment === '「生放送クルーズさん」が引用を開始しました').length
  const numEndQuote = systemMessages.filter(({ data }) => data.comment === '「生放送クルーズさん」が引用を終了しました').length

  const userLastComment = comments.filter(({ data }) => data.userId !== 'onecomme.system').at(-1);
  if (userLastComment && Date.now() - Date.parse(userLastComment.data.timestamp) > (23 * 60 + 30) * 60 * 1000) {
    return null
  }

  return (
    <div className="flex flex-col-reverse w-full h-full">
      <div className="text-sm">
        {
          'speechSynthesis' in window ?
            '✔' :
            ''
        }
        {
          latency <= 1000 ?
            '🟢' :
            latency <= 5000 ?
              '🟡' :
              '🔴'
        }
      </div>
      {
        numStartQuote > numEndQuote ?
          <div className="text-3xl font-bold bg-black/77 p-3 rounded-lg font-mono border-2 border-[#fbf0df] leading-none animate-bounce">
            ニコ生クルーズのみなさん、ようこそ！コメントしていってね！
          </div> :
          null
      }
      {comments.map(({ data }) => {
        if (Date.now() - Date.parse(data.timestamp) > 5 * 60 * 1000) {
          return null;
        }

        if (data.no || data.userId === 'onecomme.system' && data.name === '生放送クルーズ') {
          return (
            <div key={data.id} className="bg-black/77 p-2 rounded-lg border-2 border-[#fbf0df]">
              <div className="text-lg font-mono font-bold">
                {`${data.comment}`}
              </div>
              <Reply {...data} />
            </div>
          );
        }

        return null;
      }).filter((x) => x).slice(0, 3)}
    </div>
  );
}

export default App;
