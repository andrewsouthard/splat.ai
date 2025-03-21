import { useEffect } from "react";
import Home from "./screens/Home";
import { setupLogging } from "./lib/logging";
import "./App.css";

export default function App() {
  // Forward all console logs to persisted logs
  useEffect(() => {
    setupLogging();
  }, []);
  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      <Home />
    </div>
  );
}
