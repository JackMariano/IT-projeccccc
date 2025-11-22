import { useState } from "react";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";
import TripList from "./TripList";
import TripDetails from "./TripDetails";
import NotificationForm from "./NotificationForm";
import RFID from "./RFID";

export default function Dashboard() {
  const [active, setActive] = useState("dashboard");
  const [selectedTrip, setSelectedTrip] = useState(null);

  const wrapperStyle = {
    minHeight: "100vh",
    width: "100%",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
  };

  const mainStyle = {
    marginLeft: "250px",
    marginTop: "70px",
    padding: "32px",
    flex: 1,
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "48px",
    backgroundColor: "#f0f0f0",
  };

  return (
    <div style={wrapperStyle}>
      <Sidebar active={active} onNavigate={setActive} />
      <HeaderBar />

      <div style={mainStyle}>

        {/* ------------------ DASHBOARD SCREEN ------------------ */}
        {active === "dashboard" && (
          <>
            <div
              style={{
                flex: 1,
                minWidth: "300px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TripList onSelect={setSelectedTrip} selectedTrip={selectedTrip} />
            </div>

            <div
              style={{
                flex: 1,
                minWidth: "300px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TripDetails trip={selectedTrip} />
            </div>
          </>
        )}

        {/* ---------------- NOTIFICATIONS SCREEN ---------------- */}
        {active === "notifications" && (
          <div style={{ flex: 1, width: "100%", maxWidth: "480px" }}>
            <NotificationForm />
          </div>
        )}

        {/* --------------------- RFID SCREEN --------------------- */}
        {active === "rfid" && (
          <div style={{ flex: 1 }}>
            <RFID />
          </div>
        )}

        {/* --------------------- LOGOUT SCREEN ------------------- */}
        {active === "logout" && (
          <div
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2rem",
              color: "#001F4D",
            }}
          >
            You have been logged out.
          </div>
        )}

      </div>
    </div>
  );
}
