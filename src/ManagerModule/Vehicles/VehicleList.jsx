import { useState, useEffect } from "react";
import VehicleForm from "./VehicleForm";
import VehicleDashboard from "./VehicleDashboard";

export default function VehicleList({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchVehicles();
  }, [refreshTrigger]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getVehicles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("Failed to fetch vehicles");

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      alert("Failed to load vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm("Are you sure you want to archive this vehicle?")) return;

    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/deleteVehicle", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ vehicle_id: id }),
      });

      if (!response.ok) throw new Error("Failed to delete vehicle");

      setRefreshTrigger((prev) => prev + 1);
      alert("Vehicle archived successfully!");
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("Failed to archive vehicle. Please try again.");
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

  let filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "archived") return matchesSearch && v.archived;
    return matchesSearch && v.status === filterStatus && !v.archived;
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
      status === "available"
        ? "#10b981"
        : status === "in_shop"
          ? "#ef4444"
          : "#9ca3af",
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
          ← Back to Vehicles
        </button>
        <VehicleForm
          vehicle={editingId ? vehicles.find((v) => v.id === editingId) : null}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <VehicleDashboard />

      <div style={headerStyle}>
        <h2 style={titleStyle}>Vehicles</h2>
        <button style={buttonStyle} onClick={() => setShowForm(true)}>
          + New
        </button>
      </div>

      <div style={filterStyle}>
        <input
          type="text"
          placeholder="Search plate, brand or model..."
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
          <option value="available">Available</option>
          <option value="in_shop">In Shop</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading vehicles...</p>
      ) : filteredVehicles.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No vehicles found.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Plate Number</th>
              <th style={thStyle}>Brand</th>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Odometer</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td style={tdStyle}>{vehicle.plate_number}</td>
                <td style={tdStyle}>{vehicle.brand}</td>
                <td style={tdStyle}>{vehicle.model}</td>
                <td style={tdStyle}>{vehicle.vehicle_type}</td>
                <td style={tdStyle}>
                  <span style={statusBadgeStyle(vehicle.status)}>
                    {vehicle.status.charAt(0).toUpperCase() +
                      vehicle.status.slice(1).replace("_", " ")}
                  </span>
                </td>
                <td style={tdStyle}>
                  {vehicle.latest_odometer ? `${vehicle.latest_odometer} km` : "N/A"}
                </td>
                <td style={tdStyle}>
                  <button
                    style={actionButtonStyle("#3b82f6")}
                    onClick={() => {
                      setEditingId(vehicle.id);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={actionButtonStyle("#ef4444")}
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    {vehicle.archived ? "Restore" : "Archive"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}