// components/Notice.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../security/AuthContext";

const Notice = () => {
  const { user } = useAuth();
  const [overdueVehicles, setOverdueVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.user_ID) {
      return;
    }

    const loadOverdueVehicles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = `/.netlify/functions/checkOverdueVehicles?driver_id=${user.user_ID}`;
        const res = await fetch(endpoint);
        
        if (!res.ok) {
          throw new Error(`Failed to load overdue vehicles: HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.overdue_vehicles) {
          setOverdueVehicles(data.overdue_vehicles);
        }
        
      } catch (err) {
        console.error("Error loading overdue vehicles:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOverdueVehicles();
    
    const interval = setInterval(loadOverdueVehicles, 1800000);
    return () => clearInterval(interval);
  }, [user]);

  // Compact container style
  const containerStyle = {
    background: "#fff",
    borderRadius: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: "24px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0 auto 20px auto",
    borderLeft: "4px solid #ff9800",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "16px",
    fontFamily: "Montserrat, sans-serif",
    color: "#d84315",
  };

  const statusBadgeStyle = {
    padding: "4px 12px",
    background: "#ff9800",
    color: "white",
    borderRadius: "16px",
    fontSize: "0.75rem",
    fontWeight: "600",
  };

  const noticeItemStyle = {
    background: "#fff8e1",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #ffcc80",
  };

  const twoColumnLayout = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "16px",
    marginTop: "12px",
  };

  const leftColumnStyle = {
    paddingRight: "12px",
    borderRight: "1px dashed #ffcc80",
  };

  const rightColumnStyle = {
    paddingLeft: "12px",
  };

  const noticeTextStyle = {
    fontSize: "0.9rem",
    lineHeight: "1.5",
    color: "#5d4037",
    marginBottom: "12px",
  };

  const vehicleInfoStyle = {
    fontSize: "0.85rem",
    color: "#795548",
    lineHeight: "1.4",
  };

  const infoLabelStyle = {
    fontWeight: "600",
    color: "#d84315",
    display: "inline-block",
    minWidth: "70px",
  };

  const plateStyle = {
    background: "#ffcc80",
    padding: "3px 8px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.8rem",
    marginLeft: "6px",
    display: "inline-block",
  };

  const warningNoteStyle = {
    fontSize: "0.8rem",
    color: "#795548",
    padding: "8px 12px",
    background: "#ffecb3",
    borderRadius: "6px",
    marginTop: "12px",
    border: "1px dashed #ffb74d",
  };

  const systemInfoStyle = {
    fontSize: "0.8rem",
    color: "#2e7d32",
    padding: "10px 14px",
    background: "#e8f5e9",
    borderRadius: "6px",
    marginTop: "16px",
    border: "1px solid #c8e6c9",
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "16px", color: "#0e2a47", fontSize: "0.9rem" }}>
          Checking for pending returns...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "16px", color: "#cc0000", fontSize: "0.9rem" }}>
          Error loading notices
        </div>
      </div>
    );
  }

  if (overdueVehicles.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PH', { 
        month: 'short', 
        day: 'numeric',
      }) + " • " + date.toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch {
      return "Date N/A";
    }
  };

  const getHoursOverdue = (hours) => {
    if (!hours || hours < 2) return "Recently ended";
    if (hours < 24) return `${Math.round(hours)}h overdue`;
    return `${Math.round(hours / 24)}d overdue`;
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>📋 Vehicle Return Required</span>
        <span style={statusBadgeStyle}>
          {overdueVehicles.length} pending
        </span>
      </div>

      {overdueVehicles.map((vehicle, index) => {
        const hoursOverdue = vehicle.hours_overdue || 0;
        
        return (
          <div key={vehicle.reservation_id || index} style={noticeItemStyle}>
            {/* Two-column layout */}
            <div style={twoColumnLayout}>
              {/* Left column: Notice text */}
              <div style={leftColumnStyle}>
                <div style={noticeTextStyle}>
                  <div style={{ marginBottom: "8px", fontWeight: "500" }}>
                    Trip with {vehicle.customer_name || "customer"} has ended.
                  </div>
                  <div>
                    Please proceed to headquarters with the{" "}
                    <strong>{vehicle.brand} {vehicle.model}</strong>{" "}
                    <span style={plateStyle}>{vehicle.plate_number || "No plate"}</span>{" "}
                    and inform the manager to complete the trip record.
                  </div>
                </div>
              </div>
              
              {/* Right column: Vehicle details */}
              <div style={rightColumnStyle}>
                <div style={vehicleInfoStyle}>
                  <div style={{ marginBottom: "6px" }}>
                    <span style={infoLabelStyle}>Ended:</span>
                    {formatDate(vehicle.enddate)}
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <span style={infoLabelStyle}>Status:</span>
                    <span style={{ color: "#d84315", fontWeight: "500" }}>
                      {vehicle.reserv_status || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span style={infoLabelStyle}>Duration:</span>
                    {getHoursOverdue(hoursOverdue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning note */}
            <div style={warningNoteStyle}>
              ⚠️ If already returned, contact supervisor to update status
            </div>
          </div>
        );
      })}

      {/* System info */}
      <div style={systemInfoStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
          <div>Reminders appear 2+ hours after trip end</div>
          <div>Checked: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
    </div>
  );
};

export default Notice;