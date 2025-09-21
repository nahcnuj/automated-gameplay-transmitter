import { CommentList } from "./components/CommentList";
import { useCommentContext } from "./contexts/CommentContext";
import "./index.css";

export function App() {
  const { comments } = useCommentContext();

  return (
    <div className="w-screen h-screen max-w-[1280px] max-h-[720px] m-auto overflow-hidden flex">
      <div className="h-full flex-auto">
        <div className="h-full flex flex-col">
          <div className="flex-auto">
            {/* Game screen */}
          </div>
          <div className="h-fit flex-none">
            <div className="after:block after:bg-[#001100e3] after:-mb-10 after:translate-x-243 after:-translate-y-18 after:w-10 after:h-10 after:[clip-path:polygon(100%_50%,8%_0,8%_100%)]">
              <div className="w-full h-40 p-2 border-5 border-green-200 bg-[#001100e3] rounded-xl text-5xl/16 font-bold text-white [text-shadow:-2px_-2px_4px_#000,2px_2px_4px_#000]">
                &nbsp;
              </div>
            </div>
            <div className="text-xs/6">
              &nbsp;
            </div>
          </div>
        </div>
      </div>
      <div className="w-[300px] flex-none">
        <div className="h-full flex flex-col gap-2">
          <div className="flex-auto">
            <CommentList comments={comments} />
          </div>
          <div className="flex-none">
            <img src="/img/nc433974.png" width="720" height="960" className="h-70 object-cover object-top" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
