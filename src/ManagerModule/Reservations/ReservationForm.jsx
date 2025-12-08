import { useState, useEffect } from "react";

export default function ReservationForm({ reservation, onSuccess }) {
  const [formData, setFormData] = useState({
    customer_id: "",
    vehicle_id: "",
    startdate: "",
    enddate: "",
    handled_by: "",
    driver_id: "",
  });

  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomersAndVehicles();
    if (reservation) {
      setFormData({
        customer_id: reservation.customer_id || "",
        vehicle_id: reservation.vehicle_id || "",
        startdate: reservation.startdate ? reservation.startdate.split("T")[0] : "",
        enddate: reservation.enddate ? reservation.enddate.split("T")[0] : "",
        handled_by: reservation.handled_by || "",
        driver_id: reservation.driver_id || "",
      });
    }
  }, [reservation]);

  const fetchCustomersAndVehicles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");

      // Fetch customers - implement this Netlify function
      const customersResponse = await fetch("/.netlify/functions/getCustomers", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (customersResponse.ok) {
        const data = await customersResponse.json();
        setCustomers(data.customers || []);
      }

      // Fetch vehicles
      const vehiclesResponse = await fetch("/.netlify/functions/getVehicles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (vehiclesResponse.ok) {
        const data = await vehiclesResponse.json();
        setVehicles(data.vehicles || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load customers and vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.customer_id ||
      !formData.vehicle_id ||
      !formData.startdate ||
      !formData.enddate
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startdate) >= new Date(formData.enddate)) {
      setError("Start date must be before end date");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("jmtc_token");

      const url = reservation
        ? "/.netlify/functions/updateReservation"
        : "/.netlify/functions/createReservation";

      const body = reservation
        ? { ...formData, reservation_id: reservation.reservation_id }
        : formData;

      const method = reservation ? "PUT" : "POST";

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
        throw new Error(errorData.error || "Failed to save reservation");
      }

      alert(
        reservation
          ? "Reservation updated successfully!"
          : "Reservation created successfully!"
      );
      onSuccess();
    } catch (err) {
      console.error("Error saving reservation:", err);
      setError(err.message || "Failed to save reservation");
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

  if (loading) {
    return <div style={containerStyle}>Loading form data...</div>;
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>
        {reservation ? "Edit Reservation" : "Create New Reservation"}
      </h2>

      {error && <div style={errorStyle}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label style={labelStyle}>Customer *</label>
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={handleChange}
            style={selectStyle}
            required
          >
            <option value="">Select a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || "No phone"})
              </option>
            ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Vehicle *</label>
          <select
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            style={selectStyle}
            required
          >
            <option value="">Select a vehicle</option>
            {vehicles
              .filter((v) => !v.archived)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} - {v.brand} {v.model}
                </option>
              ))}
          </select>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Start Date *</label>
          <input
            type="date"
            name="startdate"
            value={formData.startdate}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>End Date *</label>
          <input
            type="date"
            name="enddate"
            value={formData.enddate}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Handler ID</label>
          <input
            type="number"
            name="handled_by"
            value={formData.handled_by}
            onChange={handleChange}
            style={inputStyle}
            placeholder="User ID of the handler"
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Driver ID</label>
          <input
            type="number"
            name="driver_id"
            value={formData.driver_id}
            onChange={handleChange}
            style={inputStyle}
            placeholder="User ID of the driver"
          />
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
              : reservation
                ? "Update Reservation"
                : "Create Reservation"}
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