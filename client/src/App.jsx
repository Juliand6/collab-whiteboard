import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Boards from "./pages/boards";
import BoardEditor from "./pages/boardEditor";
import Register from "./pages/register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
        <Route path="/boards" element={<Boards />} />
        <Route path="/board/:id" element={<BoardEditor />} />
        <Route path="*" element={<Navigate to="/boards" replace />} />
       

      </Routes>
    </BrowserRouter>
  );
}
