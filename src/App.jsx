import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./LandingPage/Login";
import Dashboard from "./DriverModule/Dashboard";
import ShopModule from "./ShopModule/ShopModule";
import AdminModule from "./AdminModule/AdminModule";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/driver" element={<Dashboard />} />
        <Route path="/shop" element={<ShopModule />} />
        <Route path="/admin" element={<AdminModule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
