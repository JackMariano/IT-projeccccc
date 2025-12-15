import { useState, useEffect } from "react";

export default function ReservationForm({ reservation, onSuccess }) {
  const [formData, setFormData] = useState({
    fullname: "",
    contactNumber: "",
    email: "",
    vehicle_id: "",
    startdate: "",
    enddate: "",
    driver_id: "",
  });

  const [newCustomer, setNewCustomer] = useState(true);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [existingReservations, setExistingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchFormData();
    if (reservation) {
      // If editing, we need to fetch the customer details
      fetchCustomerDetails(reservation.customer_id);
      setFormData({
        fullname: "",
        contactNumber: "",
        email: "",
        vehicle_id: reservation.vehicle_id || "",
        startdate: reservation.startdate ? reservation.startdate.split("T")[0] : "",
        enddate: reservation.enddate ? reservation.enddate.split("T")[0] : "",
        driver_id: reservation.driver_id || "",
      });
      setNewCustomer(false); // When editing, customer already exists
    }
  }, [reservation]);

  useEffect(() => {
    // Fetch existing reservations when dates are selected
    if (formData.startdate && formData.enddate) {
      fetchExistingReservations();
    }
  }, [formData.startdate, formData.enddate]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jmtc_token");

      // Fetch existing customers
      const customersResponse = await fetch("/.netlify/functions/getCustomers", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (customersResponse.ok) {
        const data = await customersResponse.json();
        setExistingCustomers(data.customers || []);
      }

      // Fetch vehicles
      const vehiclesResponse = await fetch("/.netlify/functions/getVehicles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (vehiclesResponse.ok) {
        const data = await vehiclesResponse.json();
        setVehicles(data.vehicles || []);
      }

      // Fetch drivers for dropdown
      const driversResponse = await fetch("/.netlify/functions/getDrivers", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (driversResponse.ok) {
        const data = await driversResponse.json();
        setDrivers(data.drivers || []);
      }

      // Fetch existing reservations for date conflict checking
      const reservationsResponse = await fetch("/.netlify/functions/getReservations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (reservationsResponse.ok) {
        const data = await reservationsResponse.json();
        setExistingReservations(data.reservations || []);
      }
    } catch (err) {
      setError("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReservations = async () => {
    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch("/.netlify/functions/getReservations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setExistingReservations(data.reservations || []);
      }
    } catch (err) {
      console.error("Error fetching reservations:", err);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const token = localStorage.getItem("jmtc_token");
      const response = await fetch(`/.netlify/functions/getCustomerById?customer_id=${customerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setFormData(prev => ({
            ...prev,
            fullname: data.customer.fullname || "",
            contactNumber: data.customer.contactnumber || data.customer.phone || "",
            email: data.customer.email || ""
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
    }
  };

  // Check if dates conflict with existing reservation
  const hasDateConflict = (startDate, endDate, existingStart, existingEnd, excludeReservationId = null) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const existingStartDate = new Date(existingStart);
    const existingEndDate = new Date(existingEnd);
    
    // Check for overlap: new reservation starts before existing ends AND ends after existing starts
    return start < existingEndDate && end > existingStartDate;
  };

  // Get available vehicles (not reserved during selected dates)
  const getAvailableVehicles = () => {
    if (!formData.startdate || !formData.enddate) {
      return vehicles.filter(v => !v.archived);
    }

    const reservedVehicleIds = existingReservations
      .filter(r => 
        r.id !== reservation?.id && // Exclude current reservation when editing
        r.vehicle_id && 
        hasDateConflict(formData.startdate, formData.enddate, r.startdate, r.enddate)
      )
      .map(r => r.vehicle_id);

    return vehicles
      .filter(v => !v.archived && !reservedVehicleIds.includes(v.id || v.vehicle_id));
  };

  // Get available drivers (not assigned during selected dates)
  const getAvailableDrivers = () => {
    if (!formData.startdate || !formData.enddate || !formData.driver_id) {
      return drivers;
    }

    const reservedDriverIds = existingReservations
      .filter(r => 
        r.id !== reservation?.id && // Exclude current reservation when editing
        r.driver_id && 
        hasDateConflict(formData.startdate, formData.enddate, r.startdate, r.enddate)
      )
      .map(r => r.driver_id);

    return drivers.filter(d => {
      const driverId = d.user_id || d.id || d.emp_id;
      return !reservedDriverIds.includes(driverId) || driverId === formData.driver_id;
    });
  };

  // Get formatted driver name
  const getDriverName = (driver) => {
    const firstName = driver.firstname || "";
    const lastName = driver.lastname || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (driver.username) {
      return driver.username;
    }
    
    return "Unknown Driver";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    
    // If vehicle or driver becomes unavailable due to date change, clear selection
    if ((name === 'startdate' || name === 'enddate') && (formData.vehicle_id || formData.driver_id)) {
      const availableVehicles = getAvailableVehicles();
      const availableDrivers = getAvailableDrivers();
      
      if (formData.vehicle_id && !availableVehicles.some(v => (v.id || v.vehicle_id) === formData.vehicle_id)) {
        updatedFormData.vehicle_id = "";
      }
      
      if (formData.driver_id && !availableDrivers.some(d => (d.user_id || d.id || d.emp_id) === formData.driver_id)) {
        updatedFormData.driver_id = "";
      }
    }
    
    setFormData(updatedFormData);
    setError("");
  };

  const handleSearchCustomer = async () => {
    if (!formData.fullname.trim()) {
      setError("Please enter a customer name to search");
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem("jmtc_token");
      
      // Search for customer by name, phone, or email
      const searchTerm = formData.fullname.toLowerCase();
      const foundCustomers = existingCustomers.filter(c => 
        c.fullname?.toLowerCase().includes(searchTerm) ||
        c.name?.toLowerCase().includes(searchTerm) ||
        c.contactnumber?.includes(searchTerm) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm)
      );

      if (foundCustomers.length === 0) {
        setError("No existing customer found. Please enter new customer details.");
        setNewCustomer(true);
      } else if (foundCustomers.length === 1) {
        // Auto-fill if exactly one match
        const customer = foundCustomers[0];
        setFormData(prev => ({
          ...prev,
          fullname: customer.fullname || customer.name || "",
          contactNumber: customer.contactnumber || customer.phone || "",
          email: customer.email || ""
        }));
        setNewCustomer(false);
      } else {
        // Multiple matches - show first one and notify
        const customer = foundCustomers[0];
        setFormData(prev => ({
          ...prev,
          fullname: customer.fullname || customer.name || "",
          contactNumber: customer.contactnumber || customer.phone || "",
          email: customer.email || ""
        }));
        setNewCustomer(false);
        setError(`Found ${foundCustomers.length} matching customers. Using first match.`);
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Error searching for customer");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullname || !formData.contactNumber || 
        !formData.vehicle_id || !formData.startdate || !formData.enddate) {
      setError("Please fill in all required fields (*)");
      return;
    }

    if (new Date(formData.startdate) >= new Date(formData.enddate)) {
      setError("Start date must be before end date");
      return;
    }

    // Check for vehicle availability
    const availableVehicles = getAvailableVehicles();
    if (!availableVehicles.some(v => (v.id || v.vehicle_id) === formData.vehicle_id)) {
      setError("Selected vehicle is not available for the chosen dates");
      return;
    }

    // Check for driver availability if driver is selected
    if (formData.driver_id) {
      const availableDrivers = getAvailableDrivers();
      if (!availableDrivers.some(d => (d.user_id || d.id || d.emp_id) === formData.driver_id)) {
        setError("Selected driver is not available for the chosen dates");
        return;
      }
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate phone number (at least 10 digits)
    const phoneDigits = formData.contactNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("jmtc_token");
      const currentUser = JSON.parse(localStorage.getItem("jmtc_user") || "{}");
      const currentTimestamp = new Date().toISOString(); // Get current timestamp in ISO format

      let customerId = null;
      
      // Step 1: Create or get customer
      if (newCustomer || !reservation) {
        // Check if customer already exists
        const existingCustomer = existingCustomers.find(c => 
          (c.contactnumber === formData.contactNumber || c.phone === formData.contactNumber) ||
          (c.email && c.email === formData.email)
        );
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const customerResponse = await fetch("/.netlify/functions/createCustomer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              fullname: formData.fullname,
              contactNumber: formData.contactNumber,
              email: formData.email
            }),
          });

          if (!customerResponse.ok) {
            const errorData = await customerResponse.json();
            throw new Error(errorData.error || "Failed to create customer");
          }

          const customerData = await customerResponse.json();
          customerId = customerData.customer_id;
        }
      } else {
        // Use existing customer ID when editing
        customerId = reservation.customer_id;
      }

      // Step 2: Create or update reservation
      const url = reservation
        ? "/.netlify/functions/updateReservation"
        : "/.netlify/functions/createReservation";

      const body = {
        customer_id: customerId,
        vehicle_id: formData.vehicle_id,
        startdate: formData.startdate,
        enddate: formData.enddate,
        driver_id: formData.driver_id || null,
        handled_by: currentUser.user_id || currentUser.id || "",
        reserv_status: "Upcoming" // Default status
      };

      // Add timestamp only for new reservations (not when updating)
      if (!reservation) {
        body.timestamp = currentTimestamp;
      }

      if (reservation) {
        body.reservation_id = reservation.id;
      }

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

  const requiredLabelStyle = {
    ...labelStyle,
  };

  const requiredAsterisk = {
    color: "#ef4444",
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

  const radioGroupStyle = {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  };

  const radioLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.85rem",
    cursor: "pointer",
  };

  const radioInputStyle = {
    margin: "0",
    cursor: "pointer",
  };

  const searchButtonStyle = {
    padding: "8px 12px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
    marginLeft: "8px",
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

  const infoStyle = {
    padding: "8px",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "4px",
    marginBottom: "12px",
    fontSize: "0.8rem",
  };

  const availabilityInfoStyle = {
    fontSize: "0.75rem",
    color: "#666",
    marginTop: "4px",
    fontStyle: "italic",
  };

  if (loading) {
    return <div style={containerStyle}>Loading form data...</div>;
  }

  const availableVehicles = getAvailableVehicles();
  const availableDrivers = getAvailableDrivers();

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>
        {reservation ? "Edit Reservation" : "New Reservation"}
      </h2>

      {error && <div style={errorStyle}>{error}</div>}

      {!reservation && (
        <div style={radioGroupStyle}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="customerType"
              checked={newCustomer}
              onChange={() => setNewCustomer(true)}
              style={radioInputStyle}
            />
            New Customer
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="customerType"
              checked={!newCustomer}
              onChange={() => setNewCustomer(false)}
              style={radioInputStyle}
            />
            Existing Customer
          </label>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Information Section */}
        <div style={formGroupStyle}>
          <label style={requiredLabelStyle}>
            Full Name <span style={requiredAsterisk}>*</span>
          </label>
          <div style={{ display: "flex" }}>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              style={{ ...inputStyle, marginRight: "8px" }}
              placeholder="Enter customer name"
              required
            />
            {!newCustomer && !reservation && (
              <button
                type="button"
                style={searchButtonStyle}
                onClick={handleSearchCustomer}
                disabled={searchLoading}
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>
            )}
          </div>
        </div>

        <div style={formGroupStyle}>
          <label style={requiredLabelStyle}>
            Contact Number <span style={requiredAsterisk}>*</span>
          </label>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            style={inputStyle}
            placeholder="e.g., 09123456789 or (123) 456-7890"
            required
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            placeholder="customer@example.com"
          />
        </div>

        <div style={formGroupStyle}>
          <label style={requiredLabelStyle}>
            Start Date <span style={requiredAsterisk}>*</span>
          </label>
          <input
            type="date"
            name="startdate"
            value={formData.startdate}
            onChange={handleChange}
            style={inputStyle}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={requiredLabelStyle}>
            End Date <span style={requiredAsterisk}>*</span>
          </label>
          <input
            type="date"
            name="enddate"
            value={formData.enddate}
            onChange={handleChange}
            style={inputStyle}
            required
            min={formData.startdate || new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Vehicle selection moved below end date */}
        <div style={formGroupStyle}>
          <label style={requiredLabelStyle}>
            Vehicle <span style={requiredAsterisk}>*</span>
          </label>
          <select
            name="vehicle_id"
            value={formData.vehicle_id}
            onChange={handleChange}
            style={selectStyle}
            required
            disabled={!formData.startdate || !formData.enddate}
          >
            <option value="">
              {!formData.startdate || !formData.enddate 
                ? "Select dates first" 
                : "Select a vehicle"}
            </option>
            {availableVehicles.map((v) => (
              <option key={v.id || v.vehicle_id} value={v.id || v.vehicle_id}>
                {v.plate_number} - {v.brand} {v.model}
              </option>
            ))}
          </select>
          {formData.startdate && formData.enddate && (
            <div style={availabilityInfoStyle}>
              Showing {availableVehicles.length} available vehicle(s) for selected dates
              {availableVehicles.length === 0 && " - No vehicles available"}
            </div>
          )}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>Driver</label>
          <select
            name="driver_id"
            value={formData.driver_id}
            onChange={handleChange}
            style={selectStyle}
            disabled={!formData.startdate || !formData.enddate}
          >
            <option value="">
              {!formData.startdate || !formData.enddate 
                ? "Select dates first" 
                : "Select a driver (optional)"}
            </option>
            {availableDrivers.map((d) => (
              <option key={d.user_id || d.id || d.emp_id} value={d.user_id || d.id || d.emp_id}>
                {getDriverName(d)}
              </option>
            ))}
          </select>
          {formData.startdate && formData.enddate && (
            <div style={availabilityInfoStyle}>
              Showing {availableDrivers.length} available driver(s) for selected dates
            </div>
          )}
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
                ? "Update"
                : "Create"}
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