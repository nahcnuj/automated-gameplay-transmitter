import CommentList from "./components/CommentList";
import "./index.css";

export function App() {
  return (
    <div className="w-screen h-screen max-w-[1024px] max-h-[576px] overflow-hidden mx-auto my-2 text-xl">
      <CommentList />
    </div>
  );
}

export default App;
