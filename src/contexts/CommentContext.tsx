'use client';

import type { NicoNamaComment } from "@onecomme.com/onesdk";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

const CommentContext = createContext<{ comments: NicoNamaComment[] }>({
  comments: [],
});

export const useCommentContext = () => useContext(CommentContext);

/**
 * Provides the NicoNama comments context to its children.
 * 
 * This provider fetches comments from the local API (`http://localhost:7777/api/comments`)
 * every second and updates the context value with the latest comments.
 *
 * @param children - The React child components that will consume the comments context.
 * @returns A context provider that supplies the current list of comments.
 */
export const CommentProvider = ({ children }: PropsWithChildren) => {
  const [comments, setComments] = useState<NicoNamaComment[]>([]);

  useEffect(() => {
    const id = setInterval(async () => {
      await fetch('http://localhost:7777/api/comments')
        .then(async res => await res.json())
        .then((x) => { return setComments(x);});
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return (
    <CommentContext.Provider value={{
      comments,
    }}>
      {children}
    </CommentContext.Provider>
  );
}