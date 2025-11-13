import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./DriverModule/Dashboard";
import ShopModule from "./ShopModule/ShopModule";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/driver" element={<Dashboard />} />
        <Route path="/shop" element={<ShopModule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
