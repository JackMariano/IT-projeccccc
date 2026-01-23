import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

import Header from "../common/components/Header";
import Sidebar from "../common/components/Sidebar";
import ReservationList from "./Reservations/ReservationList";
import VehicleList from "./Vehicles/VehicleList";

export default function ManagerModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("reservations");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/", { replace: true });
      } else if (user.role.toLowerCase() !== "manager") {
        if (user.role === "Admin") navigate("/admin", { replace: true });
        else if (user.role === "Driver") navigate("/driver", { replace: true });
        else if (user.role === "Shop") navigate("/shop", { replace: true });
        else navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role.toLowerCase() !== "manager") {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold">
        Loading Manager Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <Sidebar userRole="manager" activeSection={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {active === "reservations" && <ReservationList user={user} />}
          {active === "vehicles" && <VehicleList user={user} />}
        </main>
      </div>
    </div>
  );
}