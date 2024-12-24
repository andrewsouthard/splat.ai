import { useState } from "react";
import "./App.css";
import Toolbar from "./components/Toolbar";
import Home from "./screens/home";
import Settings from "./screens/Settings";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleSidebar = () => {
    setIsMenuOpen((prev) => !prev);
  };


  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      <Toolbar toggleSidebar={toggleSidebar} setShowSettings={setShowSettings} />
      {showSettings ? (
        <Settings />
      ) : (
        <Home isMenuOpen={isMenuOpen} />
      )}
    </div>
  );
}
