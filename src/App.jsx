import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ShopDashboard from "./pages/ShopDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/shop" element={<ShopDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
