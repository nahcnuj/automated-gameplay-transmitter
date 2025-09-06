import CommentList from "./components/CommentList";
import "./index.css";

export function App() {
  return (
    <div className="w-screen max-w-[1024px] max-h-[576px] m-2 text-xl">
      <CommentList />
    </div>
  );
}

export default App;
