import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Home />
  </BrowserRouter>,
);
