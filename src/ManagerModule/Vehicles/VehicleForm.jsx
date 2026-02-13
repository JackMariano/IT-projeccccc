import { useState } from "react";

export default function VehicleForm({ vehicle, onSuccess }) {
  const [formData, setFormData] = useState({
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    plate_number: vehicle?.plate_number || "",
    daily_rate: vehicle?.daily_rate || "",
    status: vehicle?.status || "available",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.brand || !formData.model || !formData.plate_number) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("jmtc_token");

      const url = vehicle
        ? "/.netlify/functions/updateVehicle"
        : "/.netlify/functions/createVehicle";

      const body = vehicle ? { ...formData, vehicle_id: vehicle.vehicle_id } : formData;
      const method = vehicle ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save vehicle");
      }

      alert(
        vehicle ? "Vehicle updated successfully!" : "Vehicle created successfully!"
      );
      onSuccess();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setError(err.message || "Failed to save vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = {
    background: "#fff",
    borderRadius: "6px",
    padding: "16px",
    maxWidth: "500px",
  };

  const titleStyle = {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#0e2a47",
    marginBottom: "16px",
  };

  const formGroupStyle = {
    marginBottom: "12px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#0e2a47",
    marginBottom: "4px",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "0.85rem",
    boxSizing: "border-box",
  };

  const selectStyle = {
    ...inputStyle,
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
  };

  const submitButtonStyle = {
    flex: 1,
    padding: "8px",
    background: "#e5b038",
    color: "#0e2a47",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
  };

  const cancelButtonStyle = {
    flex: 1,
    padding: "8px",
    background: "#6b7280",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
  };

  const errorStyle = {
    padding: "8px",
    background: "#fee",
    color: "#c33",
    borderRadius: "4px",
    marginBottom: "12px",
    fontSize: "0.8rem",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>
        {vehicle ? "Edit Vehicle" : "Create New Vehicle"}
      </h2>

      {error && <div style={errorStyle}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Brand *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., Toyota, Honda"
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Model *</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., Camry, Civic"
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Plate Number *</label>
          <input
            type="text"
            name="plate_number"
            value={formData.plate_number}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., ABC-1234"
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Year</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., 2024"
            min="1900"
            max="2100"
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Daily Rate (PHP)</label>
          <input
            type="number"
            name="daily_rate"
            value={formData.daily_rate}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., 1500"
            min="0"
            step="0.01"
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="available">Available</option>
            <option value="Under Repair">Under Repair</option>
            <option value="For Inspection">For Inspection</option>
            <option value="Finished Repair">Finished Repair</option>
          </select>
        </div>

        <div style={buttonGroupStyle}>
          <button
            type="submit"
            style={submitButtonStyle}
            disabled={submitting}
            onMouseOver={(e) => {
              if (!submitting) e.target.style.background = "#d4a435";
            }}
            onMouseOut={(e) => {
              if (!submitting) e.target.style.background = "#e5b038";
            }}
          >
            {submitting
              ? "Saving..."
              : vehicle
                ? "Update Vehicle"
                : "Create Vehicle"}
          </button>
          <button
            type="button"
            style={cancelButtonStyle}
            onClick={onSuccess}
            disabled={submitting}
            onMouseOver={(e) => {
              if (!submitting) e.target.style.background = "#4b5563";
            }}
            onMouseOut={(e) => {
              if (!submitting) e.target.style.background = "#6b7280";
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}