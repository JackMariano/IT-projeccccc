import React from "react";

export default function TripDetails({ trip }) {
  const containerStyle = {
    background: "#fff",
    borderRadius: "1.5rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.2)",
    padding: "32px",
    minWidth: "480px",
    maxWidth: "540px",
    fontSize: "1.2rem",
    color: "#0e2a47",
    fontFamily: "Montserrat, sans-serif",
    border: "2px solid rgba(37, 71, 47, 0.1)",
    boxSizing: "border-box",
    margin: "0 auto",
  };

  const titleStyle = {
    fontWeight: 600,
    fontSize: "1.25rem",
    marginTop: "16px",
    marginBottom: "10px",
    textAlign: "left",
  };

  const infoStyle = {
    marginBottom: "18px",
  };

  const emptyStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#aaa",
    height: "100%",
    minHeight: "200px",
    fontFamily: "Montserrat, sans-serif",
    fontSize: "1rem",
  };

  if (!trip) {
    return (
      <div style={emptyStyle}>
        <span>Select a trip to view details</span>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Vehicle information</div>
      <div style={infoStyle}>
        <div>Plate: {trip.plate}</div>
        <div>Model: {trip.model}</div>
      </div>

      <div style={titleStyle}>Customer information</div>
      <div style={infoStyle}>
        <div>Name: {trip.customer}</div>
        <div>Contact: {trip.contact}</div>
        <div>Destination: {trip.destination}</div>
      </div>
    </div>
  );
}
