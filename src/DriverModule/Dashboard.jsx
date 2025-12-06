import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";
import TripList from "./TripList";
import RFID from "./RFID";
import MileageReport from "./MileageReport";
import VehicleIssueReport from "./VehicleIssueReport";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");

  // Redirect if not logged in or wrong role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/", { replace: true });
      } else if (user.role !== "Driver") {
        if (user.role === "Admin") navigate("/admin", { replace: true });
        else if (user.role === "Shop") navigate("/shop", { replace: true });
        else navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role !== "Driver") {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold">
        Loading Dashboard...
      </div>
    );
  }

  const wrapperStyle = {
    minHeight: "100vh",
    width: "100%",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    overflow: "hidden"
  };

  const mainStyle = {
    marginLeft: "250px",
    marginTop: "70px",
    width: "calc(100% - 250px)",
    height: "calc(100vh - 70px)",
    backgroundColor: "#f8fafc",
    overflow: "hidden",
    position: "relative"
  };

  return (
    <div style={wrapperStyle}>
      <Sidebar active={active} onNavigate={setActive} />
      <HeaderBar />
      <div style={mainStyle}>
        {/* DASHBOARD MAIN SCREEN */}
        {active === "dashboard" && (
          <div style={{ 
            width: "100%",
            height: "100%",
            padding: "32px",
            overflow: "auto"
          }}>
            <TripList user={user} />
          </div>
        )}

        {/* MILEAGE & FUEL REPORT SCREEN */}
        {active === "mileage" && (
          <div style={{ 
            width: "100%",
            height: "100%"
          }}>
            <MileageReport />
          </div>
        )}

        {/* VEHICLE ISSUE REPORT SCREEN */}
        {active === "issues" && (
          <div style={{ 
            width: "100%",
            height: "100%"
          }}>
            <VehicleIssueReport />
          </div>
        )}

        {/* RFID SCREEN */}
        {active === "rfid" && (
          <div style={{ 
            width: "100%",
            height: "100%"
          }}>
            <RFID />
          </div>
        )}

        {/* LOGOUT SCREEN */}
        {active === "logout" && (
          <div style={{ 
            fontFamily: "Montserrat, sans-serif", 
            fontSize: "2rem", 
            color: "#001F4D", 
            padding: "32px",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            You have been logged out.
          </div>
        )}
      </div>
    </div>
  );
}