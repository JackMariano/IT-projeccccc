import React, { useState } from "react";

const trips = [
  {
    id: 1,
    date: "July 25, 2025",
    time: "9:00 AM",
    route: "Baguio",
    status: "Upcoming",
    plate: "1A13212",
    model: "Suv",
    customer: "Manny Villarico",
    contact: "09485687535",
    destination: "Baguio",
  },
  {
    id: 2,
    date: "July 25, 2025",
    time: "9:00 AM",
    route: "Baguio",
    status: "Ongoing",
    plate: "1A13212",
    model: "Suv",
    customer: "Manny Villarico",
    contact: "09485687535",
    destination: "Baguio",
  },
  {
    id: 3,
    date: "July 25, 2025",
    time: "9:00 AM",
    route: "Baguio",
    status: "Completed",
    plate: "1A13212",
    model: "Suv",
    customer: "Manny Villarico",
    contact: "09485687535",
    destination: "Baguio",
  },
];

export default function TripList({ onSelect, selectedTrip }) {
  const [filter, setFilter] = useState("Weekly");

  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "32px",
    minWidth: "480px",
    maxWidth: "540px",
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

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "1.1rem",
    fontFamily: "Montserrat, sans-serif",
  };

  const thStyle = {
    background: "#0e2a47",
    color: "#e6e6e6",
    fontWeight: 500,
    padding: "16px 10px",
    textAlign: "left",
    fontSize: "1.1rem",
  };

  const tdStyle = {
    padding: "16px 10px",
    textAlign: "left",
  };

  const statusBadgeStyle = (status) => ({
    padding: "8px 20px",
    borderRadius: "16px",
    color: "#fff",
    fontWeight: 600,
    fontSize: "1rem",
    display: "inline-block",
    whiteSpace: "nowrap",
    background:
      status.toLowerCase() === "upcoming"
        ? "#2ca8ff"
        : status.toLowerCase() === "ongoing"
        ? "#ffa726"
        : "#2ecc71",
  });

  const rowStyle = (trip) => ({
    background:
      selectedTrip && selectedTrip.id === trip.id ? "#e6f2e6" : "transparent",
    cursor: "pointer",
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>Scheduled Trips</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
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
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date/Time</th>
            <th style={thStyle}>Route & Destination</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr
              key={trip.id}
              style={rowStyle(trip)}
              onClick={() => onSelect(trip)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f2e6")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  selectedTrip && selectedTrip.id === trip.id ? "#e6f2e6" : "transparent")
              }
            >
              <td style={tdStyle}>
                {trip.date}
                <br />
                {trip.time}
              </td>
              <td style={tdStyle}>{trip.route}</td>
              <td style={tdStyle}>
                <span style={statusBadgeStyle(trip.status)}>{trip.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
