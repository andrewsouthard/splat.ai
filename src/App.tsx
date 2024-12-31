import { useState } from "react";
import "./App.css";
import Toolbar from "./elements/Toolbar";
import Home from "./screens/Home";

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleSidebar = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative">
      <Toolbar toggleSidebar={toggleSidebar} />
      <Home isMenuOpen={isMenuOpen} />
    </div>
  );
}
