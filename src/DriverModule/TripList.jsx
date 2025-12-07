// components/TripList.jsx (updated with Notice)
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../security/AuthContext";
import Notice from "./Notice"; // Import the Notice component

export default function TripList({ onSelect, selectedTrip }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user?.user_ID) {
      return;
    }

    const loadTrips = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = `/.netlify/functions/getDriverTrips?driver_id=${user.user_ID}`;
        const res = await fetch(endpoint);
        
        if (!res.ok) {
          throw new Error(`Failed to load trips: HTTP ${res.status}`);
        }
        
        const data = await res.json();
        
        // Process the trips data
        const tripsData = data || [];
        
        const formatted = tripsData.map((item) => {
          let startDate, endDate;
          
          try {
            startDate = item.startdate ? new Date(item.startdate) : new Date();
            endDate = item.enddate ? new Date(item.enddate) : new Date();
          } catch {
            startDate = new Date();
            endDate = new Date();
          }
          
          return {
            id: item.reservation_id,
            start: startDate,
            end: endDate,
            destination: "Not specified", // Adjust based on your actual data
            status: item.reserv_status || "unknown",
            vehiclePlate: item.plate_number || "N/A",
            vehicleBrandModel: `${item.brand || ""} ${item.model || ""}`.trim() || "N/A",
            customerName: item.customer_name || "N/A",
            customerContact: item.customer_contact || "N/A"
          };
        });

        setTrips(formatted);
        
      } catch (err) {
        console.error("Error loading trips:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [user]);

  const filteredTrips = useMemo(() => {
    if (filter === "All") {
      return trips;
    }
    
    if (!trips.length) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return trips.filter((trip) => {
      const tripStart = new Date(trip.start.getFullYear(), trip.start.getMonth(), trip.start.getDate());
      
      if (filter === "Weekly") {
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return tripStart >= weekStart && tripStart <= weekEnd;
      }

      if (filter === "Monthly") {
        return tripStart.getMonth() === today.getMonth() && tripStart.getFullYear() === today.getFullYear();
      }

      if (filter === "Yearly") {
        return tripStart.getFullYear() === today.getFullYear();
      }

      return true;
    });
  }, [trips, filter]);

  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "32px",
    maxWidth: "100%",
    boxSizing: "border-box",
    margin: "0 auto",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.3rem",
    fontWeight: 600,
    marginBottom: "24px",
    fontFamily: "Montserrat, sans-serif",
  };

  const thStyle = {
    background: "#0e2a47",
    color: "#e6e6e6",
    fontWeight: 500,
    padding: "14px 16px",
    textAlign: "left",
    fontSize: "1rem",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "14px 16px",
    textAlign: "left",
    whiteSpace: "normal",
    wordWrap: "break-word",
    borderBottom: "1px solid #eee",
  };

  const statusBadgeStyle = (status) => {
    const statusLower = status?.toLowerCase() || '';
    let backgroundColor = "#95a5a6";
    
    if (statusLower.includes('upcoming')) {
      backgroundColor = "#2ca8ff";
    } else if (statusLower.includes('ongoing') || statusLower.includes('active')) {
      backgroundColor = "#ffa726";
    } else if (statusLower.includes('complete') || statusLower.includes('completed')) {
      backgroundColor = "#2ecc71";
    } else if (statusLower.includes('cancel')) {
      backgroundColor = "#e74c3c";
    }
    
    return {
      padding: "6px 12px",
      borderRadius: "16px",
      color: "#fff",
      fontWeight: 600,
      fontSize: "0.85rem",
      display: "inline-block",
      background: backgroundColor,
      textTransform: 'capitalize'
    };
  };

  const rowStyle = (trip) => ({
    background: selectedTrip && selectedTrip.id === trip.id ? "#e6f2e6" : "transparent",
    cursor: onSelect ? "pointer" : "default",
    transition: 'background-color 0.2s'
  });

  const formatDateTime = (date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        return { date: "Invalid Date", time: "" };
      }
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "Invalid Date", time: "" };
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#0e2a47" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Loading trips...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "60px", color: "#cc0000" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
            Error Loading Trips
          </div>
          <div style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notice panel appears above TripList */}
      <Notice />
      
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>Scheduled Trips</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #0e2a47",
              fontSize: "1rem",
              background: "#f5f5f5",
              cursor: "pointer"
            }}
          >
            <option value="All">All Trips</option>
            <option value="Weekly">This Week</option>
            <option value="Monthly">This Month</option>
            <option value="Yearly">This Year</option>
          </select>
        </div>

        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse",
          fontFamily: "Arial, sans-serif"
        }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "12%" }}>Start Date & Time</th>
              <th style={{ ...thStyle, width: "12%" }}>End Date & Time</th>
              <th style={{ ...thStyle, width: "12%" }}>Destination</th>
              <th style={{ ...thStyle, width: "14%" }}>Vehicle</th>
              <th style={{ ...thStyle, width: "10%" }}>Plate No.</th>
              <th style={{ ...thStyle, width: "14%" }}>Customer</th>
              <th style={{ ...thStyle, width: "12%" }}>Contact</th>
              <th style={{ ...thStyle, width: "14%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ 
                  ...tdStyle, 
                  textAlign: "center", 
                  padding: "60px",
                  color: "#666",
                  fontSize: "1rem"
                }}>
                  {trips.length === 0 ? "No trips scheduled" : `No trips match "${filter}" filter`}
                  {trips.length > 0 && filter !== "All" && (
                    <div style={{ marginTop: "16px" }}>
                      <button
                        onClick={() => setFilter("All")}
                        style={{
                          padding: "8px 24px",
                          borderRadius: "6px",
                          border: "1px solid #0e2a47",
                          background: "#0e2a47",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "0.9rem"
                        }}
                      >
                        Show All Trips ({trips.length})
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip) => {
                const start = formatDateTime(trip.start);
                const end = formatDateTime(trip.end);
                
                return (
                  <tr
                    key={trip.id}
                    style={rowStyle(trip)}
                    onClick={() => onSelect && onSelect(trip)}
                    onMouseEnter={(e) => onSelect && (e.currentTarget.style.background = "#f5f9ff")}
                    onMouseLeave={(e) => onSelect && (e.currentTarget.style.background = 
                      selectedTrip && selectedTrip.id === trip.id ? "#e6f2e6" : "transparent")}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{start.date}</div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>{start.time}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>{end.date}</div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>{end.time}</div>
                    </td>
                    <td style={tdStyle}>{trip.destination}</td>
                    <td style={tdStyle}>{trip.vehicleBrandModel}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: "#f0f0f0",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        display: "inline-block"
                      }}>
                        {trip.vehiclePlate}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{trip.customerName}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: "0.9rem" }}>{trip.customerContact}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(trip.status)}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}