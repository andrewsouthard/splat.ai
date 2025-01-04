import React from "react";
import ReactDOM from "react-dom/client";
import Settings from "./screens/Settings";
import { Toaster } from "@/components/ui/sonner"
import "./App.css";

ReactDOM.createRoot(document.getElementById("preferences") as HTMLElement).render(
  <React.StrictMode>
    <Settings />
    <Toaster />
  </React.StrictMode>
);
