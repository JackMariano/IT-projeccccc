import { useState, useEffect } from "react";
import ReservationForm from "./ReservationForm";
import ReservationDashboard from "./ReservationDashboard";

export default function ReservationList({ user }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchReservations();
  }, [refreshTrigger]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getReservations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      alert("Failed to load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (!confirm("Are you sure you want to delete this reservation?")) return;

    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/deleteReservation", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ reservation_id: id }),
      });

      if (!response.ok) throw new Error("Failed to delete reservation");

      setRefreshTrigger((prev) => prev + 1);
      alert("Reservation deleted successfully!");
    } catch (err) {
      console.error("Error deleting reservation:", err);
      alert("Failed to delete reservation. Please try again.");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleFormClose();
  };

  const getReservationStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now <= end) return "ongoing";
    return "completed";
  };

  let filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    return matchesSearch && getReservationStatus(r.startdate, r.enddate) === filterStatus;
  });

  const containerStyle = {
    background: "#fff",
    borderRadius: "6px",
    padding: "16px",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  };

  const titleStyle = {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: "#0e2a47",
  };

  const buttonStyle = {
    padding: "8px 16px",
    background: "#e5b038",
    color: "#0e2a47",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
  };

  const filterStyle = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  };

  const searchInputStyle = {
    padding: "8px 10px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "0.85rem",
    flex: 1,
    minWidth: "150px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  };

  const thStyle = {
    textAlign: "left",
    padding: "8px",
    background: "#0e2a47",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "0.8rem",
  };

  const tdStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
  };

  const statusBadgeStyle = (status) => ({
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    background:
      status === "upcoming"
        ? "#fbbf24"
        : status === "ongoing"
          ? "#3b82f6"
          : "#10b981",
    color: "#fff",
  });

  const actionButtonStyle = (color) => ({
    padding: "4px 8px",
    marginRight: "4px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: "bold",
    background: color,
    color: "#fff",
  });

  if (showForm) {
    return (
      <div>
        <button
          style={{ ...buttonStyle, marginBottom: "24px" }}
          onClick={handleFormClose}
        >
          ← Back to Reservations
        </button>
        <ReservationForm
          reservation={editingId ? reservations.find((r) => r.id === editingId) : null}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <ReservationDashboard />

      <div style={headerStyle}>
        <h2 style={titleStyle}>Reservations</h2>
        <button style={buttonStyle} onClick={() => setShowForm(true)}>
          + New
        </button>
      </div>

      <div style={filterStyle}>
        <input
          type="text"
          placeholder="Search customer or plate..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInputStyle}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "0.85rem" }}
        >
          <option value="all">All</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading reservations...</p>
      ) : filteredReservations.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No reservations found.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Vehicle Plate</th>
              <th style={thStyle}>Start Date</th>
              <th style={thStyle}>End Date</th>
              <th style={thStyle}>Handler</th>
              <th style={thStyle}>Driver</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((res) => {
              const status = getReservationStatus(res.startdate, res.enddate);
              return (
                <tr key={res.id}>
                  <td style={tdStyle}>{res.customer_name}</td>
                  <td style={tdStyle}>{res.plate_number}</td>
                  <td style={tdStyle}>{new Date(res.startdate).toLocaleDateString()}</td>
                  <td style={tdStyle}>{new Date(res.enddate).toLocaleDateString()}</td>
                  <td style={tdStyle}>{res.handled_by}</td>
                  <td style={tdStyle}>{res.driver_id || "-"}</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={actionButtonStyle("#3b82f6")}
                      onClick={() => {
                        setEditingId(res.id);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={actionButtonStyle("#ef4444")}
                      onClick={() => handleDeleteReservation(res.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}