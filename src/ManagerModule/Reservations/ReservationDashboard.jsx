import { useState, useEffect } from "react";

export default function ReservationDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getReservations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      const reservations = data.reservations || [];
      const now = new Date();

      const total = reservations.length;
      const upcoming = reservations.filter((r) => new Date(r.startdate) > now).length;
      const ongoing = reservations.filter((r) => {
        const start = new Date(r.startdate);
        const end = new Date(r.enddate);
        return start <= now && end >= now;
      }).length;
      const completed = reservations.filter((r) => new Date(r.enddate) < now).length;

      setStats({ total, upcoming, ongoing, completed });
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
          <div style={labelStyle}>Total Reservations</div>
          <div style={numberStyle}>{stats.total}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #e5b038" }}>
          <div style={labelStyle}>Upcoming</div>
          <div style={numberStyle}>{stats.upcoming}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #3b82f6" }}>
          <div style={labelStyle}>Ongoing</div>
          <div style={numberStyle}>{stats.ongoing}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: "4px solid #10b981" }}>
          <div style={labelStyle}>Completed</div>
          <div style={numberStyle}>{stats.completed}</div>
        </div>
      </div>
    </div>
  );
}