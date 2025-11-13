import { useState } from "react";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";
import TripList from "./TripList";
import TripDetails from "./TripDetails";
import NotificationForm from "./NotificationForm";

const Dashboard = () => {
  const [active, setActive] = useState("dashboard"); // sidebar navigation
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Wrapper style for full screen, similar to Login structure
  const wrapperStyle = {
    minHeight: "100vh",
    width: "100%",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
  };

  // Main content style (adjust for fixed sidebar & header)
  const mainStyle = {
    marginLeft: "250px", // sidebar width
    marginTop: "70px", // header height
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
      {/* Sidebar and HeaderBar */}
      <Sidebar active={active} onNavigate={setActive} />
      <HeaderBar />

      {/* Main content area */}
      <div style={mainStyle}>
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

        {active === "notifications" && (
          <div style={{ flex: 1, width: "100%", maxWidth: "480px" }}>
            <NotificationForm />
          </div>
        )}

        {active === "logout" && (
          <div
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontSize: "2rem",
              color: "#001F4D",
            }}
          >
            Logged out.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
