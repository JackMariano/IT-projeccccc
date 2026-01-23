import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";

import Header from "../common/components/Header";
import Sidebar from "../common/components/Sidebar";
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
      } else if (user.role.toLowerCase() !== "driver") {
        if (user.role === "Admin") navigate("/admin", { replace: true });
        else if (user.role === "Shop") navigate("/shop", { replace: true });
        else navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role.toLowerCase() !== "driver") {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <Sidebar userRole="driver" activeSection={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* DASHBOARD MAIN SCREEN */}
          {active === "dashboard" && <TripList user={user} />}

          {/* MILEAGE & FUEL REPORT SCREEN */}
          {active === "mileage" && <MileageReport />}

          {/* VEHICLE ISSUE REPORT SCREEN */}
          {active === "issues" && <VehicleIssueReport />}

          {/* RFID SCREEN */}
          {active === "rfid" && <RFID />}

          {/* LOGOUT SCREEN */}
          {active === "logout" && (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              You have been logged out.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}