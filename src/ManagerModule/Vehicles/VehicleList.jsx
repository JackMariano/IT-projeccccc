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
  const [showRFIDModal, setShowRFIDModal] = useState(false);
  const [rfidVehicle, setRfidVehicle] = useState(null);
  const [rfidAmount, setRfidAmount] = useState("");
  const [rfidLoading, setRfidLoading] = useState(false);
  const [rfidError, setRfidError] = useState("");
  const [rfidSuccess, setRfidSuccess] = useState(false);

  useEffect(() => {
    fetchVehicles();
    const handleVisibility = () => {
      if (!document.hidden) fetchVehicles();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [refreshTrigger]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/.netlify/functions/getVehicles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || `HTTP ${response.status}`,
        );
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      alert(`Failed to load vehicles: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const token = localStorage.getItem("token");
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
      alert("Vehicle deleted successfully!");
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("Failed to delete vehicle. Please try again.");
    }
  };

  const handleAddRFIDBalance = async () => {
    const parsed = parseFloat(rfidAmount);
    if (!rfidAmount || isNaN(parsed) || parsed <= 0) {
      setRfidError("Please enter a valid positive amount.");
      return;
    }

    setRfidLoading(true);
    setRfidError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/.netlify/functions/getRFIDBalance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          vehicle_ID: rfidVehicle.vehicle_id,
          pricePaid: parsed,
          transaction_type: "reload",
          notes: `Manager balance reload`,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add RFID balance");

      setRfidSuccess(true);
      setRfidAmount("");
      setTimeout(() => {
        setShowRFIDModal(false);
        setRfidSuccess(false);
        setRfidVehicle(null);
      }, 2000);
    } catch (err) {
      setRfidError(err.message || "Failed to add balance. Please try again.");
    } finally {
      setRfidLoading(false);
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
    return matchesSearch && (v.status || "").toLowerCase() === filterStatus;
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
  const tdStyle = { padding: "8px", borderBottom: "1px solid #eee" };
  const statusBadgeStyle = (status) => {
    const s = (status || "").toLowerCase();
    let bg = "#9ca3af";
    if (s === "available") bg = "#10b981";
    else if (s === "reserved") bg = "#3b82f6";
    else if (s === "in use") bg = "#0891b2";
    else if (s === "in_shop") bg = "#f59e0b";
    else if (s === "under repair") bg = "#ef4444";
    else if (s === "for inspection") bg = "#8b5cf6";
    else if (s === "finished repair") bg = "#059669";
    return {
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "bold",
      background: bg,
      color: "#fff",
    };
  };
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
          vehicle={
            editingId ? vehicles.find((v) => v.vehicle_id === editingId) : null
          }
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
          style={{
            padding: "8px 10px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            fontSize: "0.85rem",
          }}
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="in use">In Use</option>
          <option value="under repair">Under Repair</option>
          <option value="for inspection">For Inspection</option>
          <option value="in_shop">In Shop</option>
        </select>
      </div>

      {showRFIDModal && rfidVehicle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "24px",
              minWidth: "320px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                color: "#0e2a47",
                fontSize: "1.1rem",
              }}
            >
              Add RFID Balance
            </h3>
            <p
              style={{
                margin: "0 0 16px 0",
                color: "#374151",
                fontSize: "0.9rem",
              }}
            >
              Vehicle:{" "}
              <strong>
                {rfidVehicle.plate_number} — {rfidVehicle.brand}{" "}
                {rfidVehicle.model}
              </strong>
            </p>
            {rfidSuccess ? (
              <div
                style={{
                  color: "#16a34a",
                  fontWeight: "bold",
                  textAlign: "center",
                  padding: "16px 0",
                }}
              >
                ✅ Balance added successfully!
              </div>
            ) : (
              <>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#374151",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Amount to Add (PHP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rfidAmount}
                  onChange={(e) => {
                    setRfidAmount(e.target.value);
                    setRfidError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "0.9rem",
                    marginBottom: "12px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Enter amount"
                />
                {rfidError && (
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: "0.8rem",
                      margin: "0 0 12px 0",
                    }}
                  >
                    {rfidError}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowRFIDModal(false);
                      setRfidVehicle(null);
                      setRfidAmount("");
                      setRfidError("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      background: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRFIDBalance}
                    disabled={rfidLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "4px",
                      border: "none",
                      cursor: rfidLoading ? "not-allowed" : "pointer",
                      background: rfidLoading ? "#9ca3af" : "#e5b038",
                      color: "#0e2a47",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                  >
                    {rfidLoading ? "Adding..." : "Add Balance"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          Loading vehicles...
        </p>
      ) : filteredVehicles.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>No vehicles found.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Plate Number</th>
              <th style={thStyle}>Brand</th>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>Year</th>
              <th style={thStyle}>Daily Rate</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.vehicle_id}>
                <td style={tdStyle}>{vehicle.plate_number}</td>
                <td style={tdStyle}>{vehicle.brand}</td>
                <td style={tdStyle}>{vehicle.model}</td>
                <td style={tdStyle}>{vehicle.year}</td>
                <td style={tdStyle}>
                  {vehicle.daily_rate
                    ? `₱${Number(vehicle.daily_rate).toLocaleString()}`
                    : "N/A"}
                </td>
                <td style={tdStyle}>
                  <span style={statusBadgeStyle(vehicle.status)}>
                    {(vehicle.status || "").charAt(0).toUpperCase() +
                      (vehicle.status || "").slice(1).replace(/_/g, " ")}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button
                    style={actionButtonStyle("#3b82f6")}
                    onClick={() => {
                      setEditingId(vehicle.vehicle_id);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={actionButtonStyle("#8b5cf6")}
                    onClick={() => {
                      setRfidVehicle(vehicle);
                      setRfidAmount("");
                      setRfidError("");
                      setRfidSuccess(false);
                      setShowRFIDModal(true);
                    }}
                  >
                    RFID
                  </button>
                  <button
                    style={actionButtonStyle("#ef4444")}
                    onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                  >
                    Delete
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
