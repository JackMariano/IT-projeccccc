import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../security/AuthContext";

export default function TripList({ onSelect, selectedTrip }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState("Weekly");

  useEffect(() => {
    if (!user?.user_ID) return;

    const loadTrips = async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/getDriverTrips?driver_id=${user.user_ID}`
        );
        if (!res.ok) throw new Error("Failed to fetch driver trips");

        const data = await res.json();
        if (!Array.isArray(data)) return;

        const formatted = data.map((item) => ({
          id: item.reservation_id,
          start: new Date(item.startdate),
          end: new Date(item.enddate),
          destination: item.destination || "N/A",
          status: item.reserv_status,
          vehiclePlate: item.plate_number || "N/A",
          vehicleBrandModel: `${item.brand || "N/A"} ${item.model || ""}`.trim(),
          customerName: item.customer_name || "N/A",
          customerContact: item.customer_contact || "N/A",
        }));

        setTrips(formatted);
      } catch (err) {
        console.error("Error loading trips:", err);
      }
    };

    loadTrips();
  }, [user]);

  // Filter trips based on start date
  const filteredTrips = useMemo(() => {
    if (!trips.length) return [];
    const now = new Date();

    // Helper: zero out time
    const normalize = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const today = normalize(now);

    return trips.filter((trip) => {
      const tripStart = normalize(trip.start);

      if (filter === "Weekly") {
        const dayOfWeek = today.getDay(); // Sunday = 0
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
    marginBottom: "18px",
    fontFamily: "Montserrat, sans-serif",
  };

  const thStyle = {
    background: "#0e2a47",
    color: "#e6e6e6",
    fontWeight: 500,
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "1.1rem",
    whiteSpace: "nowrap",
  };

  const tdStyle = {
    padding: "12px 16px",
    textAlign: "left",
    whiteSpace: "normal",
    wordWrap: "break-word",
  };

  const statusBadgeStyle = (status) => ({
    padding: "6px 16px",
    borderRadius: "16px",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.9rem",
    display: "inline-block",
    background:
      status.toLowerCase() === "upcoming"
        ? "#2ca8ff"
        : status.toLowerCase() === "ongoing"
        ? "#ffa726"
        : "#2ecc71",
  });

  const rowStyle = (trip) => ({
    background: selectedTrip && selectedTrip.id === trip.id ? "#e6f2e6" : "transparent",
    cursor: "pointer",
  });

  const formatDateTime = (date) => ({
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Scheduled Trips</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #0e2a47",
            fontSize: "1rem",
            background: "#f5f5f5",
          }}
        >
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Yearly</option>
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, minWidth: "120px" }}>Start</th>
            <th style={{ ...thStyle, minWidth: "120px" }}>End</th>
            <th style={{ ...thStyle, minWidth: "150px" }}>Destination</th>
            <th style={{ ...thStyle, minWidth: "150px" }}>Vehicle</th>
            <th style={{ ...thStyle, minWidth: "120px" }}>Plate Number</th>
            <th style={{ ...thStyle, minWidth: "150px" }}>Customer</th>
            <th style={{ ...thStyle, minWidth: "140px" }}>Contact</th>
            <th style={{ ...thStyle, minWidth: "120px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips.length === 0 ? (
            <tr>
              <td colSpan="8" style={tdStyle}>
                No trips found.
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f2e6")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      selectedTrip && selectedTrip.id === trip.id
                        ? "#e6f2e6"
                        : "transparent")
                  }
                >
                  <td style={tdStyle}>
                    {start.date}
                    <br />
                    {start.time}
                  </td>
                  <td style={tdStyle}>
                    {end.date}
                    <br />
                    {end.time}
                  </td>
                  <td style={tdStyle}>{trip.destination}</td>
                  <td style={tdStyle}>{trip.vehicleBrandModel}</td>
                  <td style={tdStyle}>{trip.vehiclePlate}</td>
                  <td style={tdStyle}>{trip.customerName}</td>
                  <td style={tdStyle}>{trip.customerContact}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(trip.status)}>{trip.status}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
