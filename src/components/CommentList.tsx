'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";

const isUser = ({ no }: NicoNamaComment['data']) => no;
const fromCruise = ({ name }: NicoNamaComment['data']) => name === '生放送クルーズ';

export function CommentList({ comments }: { comments: NicoNamaComment[] }) {
  return (
    <div className="w-full h-full flex flex-col justify-end">
      {comments.map(({ data }) => (
        <div key={data.id} className={`p-1 my-1 rounded-md border-1 border-[#fbf0df] relative ${isUser(data) ? 'bg-[#001100f7]' : "bg-blue-950/95 after:[content:'〟'] after:absolute after:bottom-1 after:-right-6 after:text-5xl after:text-blue-50/20"}`}>
          <div className={`text-lg/6 ${fromCruise(data) ? '' : 'font-bold'}`}>
            {data.comment}
          </div>
        </div>
      ))}
    </div>
  );
}
