import { useEffect } from "react";
import Home from "./screens/Home";
import { setupLogging } from "./lib/logging";
import { checkForUpdates } from "./lib/updater";
import "./App.css";

export default function App() {
  // Forward all console logs to persisted logs
  useEffect(() => {
    setupLogging();
    checkForUpdates();
  }, []);
  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      <Home />
    </div>
  );
}
