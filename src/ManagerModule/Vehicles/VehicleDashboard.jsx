import { useState, useEffect } from "react";

export default function VehicleDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inShop: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getVehicles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch vehicles");

      const data = await response.json();
      const vehicles = data.vehicles || [];

      const total = vehicles.length;
      const active = vehicles.filter((v) => v.status === "available" && !v.archived).length;
      const inShop = vehicles.filter((v) => v.status === "in_shop" && !v.archived).length;
      const archived = vehicles.filter((v) => v.archived).length;

      setStats({ total, active, inShop, archived });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: "#fff",
    padding: "16px",
    borderRadius: "6px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    flex: 1,
    minWidth: "140px",
  };

  const containerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  };

  const numberStyle = {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#0e2a47",
    margin: "8px 0",
  };

  const labelStyle = {
    fontSize: "0.85rem",
    color: "#666",
    fontWeight: "500",
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "16px", color: "#0e2a47" }}>
        Dashboard
      </h2>
      <div style={containerStyle}>
        <div style={{ ...cardStyle, borderTop: "4px solid #0e2a47" }}>
          <div style={labelStyle}>Total Vehicles</div>
          <div style={numberStyle}>{stats.total}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #10b981" }}>
          <div style={labelStyle}>Active</div>
          <div style={numberStyle}>{stats.active}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #ef4444" }}>
          <div style={labelStyle}>In Shop</div>
          <div style={numberStyle}>{stats.inShop}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #9ca3af" }}>
          <div style={labelStyle}>Archived</div>
          <div style={numberStyle}>{stats.archived}</div>
        </div>
      </div>
    </div>
  );
}