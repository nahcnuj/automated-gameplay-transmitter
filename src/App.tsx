import { APITester } from "./APITester";
import "./index.css";

export function App() {
  return (
    <div className="w-screen">
      <h1 className="text-5xl font-bold leading-tight text-center">Test</h1>
      <APITester />
    </div>
  );
}

export default App;
