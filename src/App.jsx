import React, { useState } from "react";
import Login from "./components/Login";
import ShopDashboard from "./pages/ShopDashboard";

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {user ? (
        <ShopDashboard user={user} />
      ) : (
        <Login onLogin={(u) => setUser(u)} />
      )}
    </>
  );
}

export default App;
