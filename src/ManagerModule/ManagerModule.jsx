import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

import ManagerHeaderBar from "./ManagerHeaderBar";
import ManagerSidebar from "./ManagerSidebar";
import ReservationList from "./Reservations/ReservationList";
import ReservationForm from "./Reservations/ReservationForm";
import VehicleList from "./Vehicles/VehicleList";
import VehicleForm from "./Vehicles/VehicleForm";

export default function ManagerModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("reservations");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/", { replace: true });
      } else if (user.role !== "Manager") {
        if (user.role === "Admin") navigate("/admin", { replace: true });
        else if (user.role === "Driver") navigate("/driver", { replace: true });
        else if (user.role === "Shop") navigate("/shop", { replace: true });
        else navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role !== "Manager") {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold">
        Loading Manager Dashboard...
      </div>
    );
  }

  const wrapperStyle = {
    minHeight: "100vh",
    width: "100%",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    overflow: "hidden",
  };

  const mainStyle = {
    marginLeft: "250px",
    marginTop: "60px",
    width: "calc(100% - 250px)",
    height: "calc(100vh - 60px)",
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={wrapperStyle}>
      <ManagerSidebar active={active} onNavigate={setActive} />
      <ManagerHeaderBar />
      <div style={mainStyle}>
        {active === "reservations" && (
          <div style={{ width: "100%", height: "100%", padding: "20px", overflow: "auto" }}>
            <ReservationList user={user} />
          </div>
        )}

        {active === "vehicles" && (
          <div style={{ width: "100%", height: "100%", padding: "20px", overflow: "auto" }}>
            <VehicleList user={user} />
          </div>
        )}
      </div>
    </div>
  );
}