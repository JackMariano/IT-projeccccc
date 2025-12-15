// components/UseInventoryModal.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";

export default function UseInventoryModal({ 
  item, 
  isOpen, 
  onClose, 
  onConfirm,
  maintenanceOptions = []
}) {
  const [quantity, setQuantity] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [currentOdometer, setCurrentOdometer] = useState("");
  const [currentFuel, setCurrentFuel] = useState("");
  const [fuelAdded, setFuelAdded] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plateNumberError, setPlateNumberError] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [latestVehicleData, setLatestVehicleData] = useState(null);
  const [previousOdometer, setPreviousOdometer] = useState(0);
  const [previousFuel, setPreviousFuel] = useState(0);

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen && item) {
      setQuantity("");
      setPlateNumber("");
      setMaintenanceType("");
      setCurrentOdometer("");
      setCurrentFuel("");
      setFuelAdded("");
      setError("");
      setPlateNumberError("");
      setVehicleInfo(null);
      setLatestVehicleData(null);
      setPreviousOdometer(0);
      setPreviousFuel(0);
    }
  }, [isOpen, item]);

  // Load latest vehicle data when a vehicle is found
  useEffect(() => {
    if (vehicleInfo) {
      loadLatestVehicleData(vehicleInfo.vehicle_id);
    }
  }, [vehicleInfo]);

  const loadLatestVehicleData = async (vehicleId) => {
    try {
      const endpoint = `/.netlify/functions/getVehicleLatestData?vehicle_id=${vehicleId}`;
      const res = await fetch(endpoint);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          console.log("Vehicle data received:", data.data); // Debug log
          setLatestVehicleData(data.data);
          // Store previous values but DON'T pre-fill current odometer
          const odometerValue = Number(data.data.current_odometer) || 0;
          const fuelValue = Number(data.data.current_fuel) || 0;
          console.log("Setting previousOdometer to:", odometerValue); // Debug log
          setPreviousOdometer(odometerValue);
          setPreviousFuel(fuelValue);
          // Clear current odometer field so user has to enter new value
          setCurrentOdometer("");
        }
      }
    } catch (err) {
      console.error("Error loading vehicle data:", err);
    }
  };

  const searchVehicle = async () => {
    if (!plateNumber.trim()) {
      setPlateNumberError("Please enter a plate number");
      setVehicleInfo(null);
      setLatestVehicleData(null);
      setPreviousOdometer(0);
      setPreviousFuel(0);
      return;
    }

    setSearchingVehicle(true);
    setPlateNumberError("");
    
    try {
      const endpoint = `/.netlify/functions/getVehicles`;
      const res = await fetch(endpoint);
      
      if (res.ok) {
        const data = await res.json();
        
        // Find vehicle by plate number (case-insensitive)
        const foundVehicle = data.vehicles?.find(vehicle => 
          vehicle.plate_number.toLowerCase() === plateNumber.trim().toLowerCase()
        );
        
        if (foundVehicle) {
          setVehicleInfo({
            vehicle_id: foundVehicle.vehicle_id,
            plate_number: foundVehicle.plate_number,
            brand: foundVehicle.brand,
            model: foundVehicle.model,
            status: foundVehicle.status,
            odometer: foundVehicle.odometer
          });
          setPlateNumberError("");
        } else {
          setVehicleInfo(null);
          setLatestVehicleData(null);
          setPreviousOdometer(0);
          setPreviousFuel(0);
          setPlateNumberError(`Vehicle with plate number "${plateNumber}" not found`);
        }
      } else {
        setPlateNumberError("Failed to search for vehicle");
      }
    } catch (err) {
      console.error("Error searching vehicle:", err);
      setPlateNumberError("Error searching for vehicle");
    } finally {
      setSearchingVehicle(false);
    }
  };

  const handlePlateNumberChange = (e) => {
    const value = e.target.value;
    setPlateNumber(value);
    setVehicleInfo(null);
    setLatestVehicleData(null);
    setPreviousOdometer(0);
    setPreviousFuel(0);
    setPlateNumberError("");
  };

  const handlePlateNumberKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchVehicle();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate quantity
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      setError(`Please enter a valid whole number quantity in ${item.measurement.toLowerCase()}`);
      return;
    }

    const qty = parseInt(quantity);
    if (qty > item.current_quantity) {
      setError(`Cannot use ${qty} ${item.measurement.toLowerCase()} - only ${item.current_quantity} available`);
      return;
    }

    // Validate plate number if provided
    if (plateNumber.trim() && !vehicleInfo) {
      setError("Please verify the plate number or leave it empty");
      return;
    }

    // If maintenance type is provided but no plate number
    if (maintenanceType && !plateNumber.trim()) {
      setError("Please enter a plate number when logging maintenance");
      return;
    }

    // If plate number is provided but not found
    if (plateNumber.trim() && plateNumberError) {
      setError(plateNumberError);
      return;
    }

    // Validate odometer and fuel if vehicle is provided
    let odometerNum = null;
    let fuelNum = null;
    let fuelAddedNum = null;
    
    if (vehicleInfo) {
      // ODOMETER IS NOW REQUIRED WHEN VEHICLE IS SELECTED
      if (!currentOdometer) {
        setError("Current odometer reading is required for vehicle maintenance");
        return;
      }
      
      odometerNum = parseFloat(currentOdometer);
      if (isNaN(odometerNum) || odometerNum < 0) {
        setError("Current odometer must be a non-negative number");
        return;
      }
      
      // Check if odometer is less than or equal to previous (with tolerance for floating point)
      if (odometerNum <= previousOdometer) {
        // Use Math.round to handle floating point comparison issues
        const roundedOdometer = Math.round(odometerNum * 10) / 10;
        const roundedPrevious = Math.round(previousOdometer * 10) / 10;
        
        if (roundedOdometer <= roundedPrevious) {
          setError(`Current odometer (${odometerNum}) must be greater than previous odometer (${previousOdometer})`);
          return;
        }
      }
      
      if (currentFuel) {
        fuelNum = parseFloat(currentFuel);
        if (isNaN(fuelNum) || fuelNum < 0) {
          setError("Current fuel level must be a non-negative number");
          return;
        }
      }
      
      if (fuelAdded) {
        fuelAddedNum = parseFloat(fuelAdded);
        if (isNaN(fuelAddedNum) || fuelAddedNum < 0) {
          setError("Fuel added must be a non-negative number");
          return;
        }
      }
    }

    setLoading(true);
    setError("");

    try {
      await onConfirm({
        partId: item.part_id,
        quantity: qty,
        measurement: item.measurement,
        vehicleId: vehicleInfo?.vehicle_id || null,
        maintenanceType: maintenanceType || null,
        currentOdometer: odometerNum,
        currentFuel: fuelNum,
        fuelAdded: fuelAddedNum
      });
      
      // Reset form on successful submission
      setQuantity("");
      setPlateNumber("");
      setMaintenanceType("");
      setCurrentOdometer("");
      setCurrentFuel("");
      setFuelAdded("");
      setVehicleInfo(null);
      setLatestVehicleData(null);
      setPlateNumberError("");
      setPreviousOdometer(0);
      setPreviousFuel(0);
    } catch (err) {
      setError(err.message || "Failed to consume inventory");
    } finally {
      setLoading(false);
    }
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: isOpen ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalContentStyle = {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e9ecef",
  };

  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#0e2a47",
    margin: 0,
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "#6c757d",
    cursor: "pointer",
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  };

  const formGroupStyle = {
    marginBottom: "16px",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#495057",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };

  const selectStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    background: "#fff",
    cursor: "pointer",
    boxSizing: "border-box",
  };

  const errorStyle = {
    color: "#dc3545",
    fontSize: "0.85rem",
    marginTop: "4px",
  };

  const successStyle = {
    color: "#28a745",
    fontSize: "0.85rem",
    marginTop: "4px",
  };

  const buttonContainerStyle = {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #e9ecef",
  };

  const cancelButtonStyle = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #6c757d",
    background: "#fff",
    color: "#6c757d",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    flex: 1,
  };

  const submitButtonStyle = {
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #dc3545",
    background: "#dc3545",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    flex: 1,
  };

  const disabledButtonStyle = {
    ...submitButtonStyle,
    opacity: 0.6,
    cursor: "not-allowed",
  };

  const itemInfoStyle = {
    background: "#f8f9fa",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
  };

  const infoRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  };

  const infoLabelStyle = {
    fontSize: "0.9rem",
    color: "#6c757d",
    fontWeight: 500,
  };

  const infoValueStyle = {
    fontSize: "0.9rem",
    color: "#212529",
    fontWeight: 600,
  };

  const vehicleInfoStyle = {
    background: "#e8f5e9",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "8px",
    border: "1px solid #c3e6cb",
  };

  const searchButtonStyle = {
    marginLeft: "8px",
    padding: "10px 16px",
    borderRadius: "6px",
    border: "1px solid #007bff",
    background: "#007bff",
    color: "white",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
  };

  const plateNumberContainerStyle = {
    display: "flex",
    gap: "8px",
  };

  const plateInputContainerStyle = {
    flex: 1,
  };

  const odometerFuelContainerStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "8px",
  };

  const odometerFuelGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const previousValueStyle = {
    fontSize: "0.75rem",
    color: "#6c757d",
    fontStyle: "italic",
  };

  if (!isOpen || !item) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Use Inventory Item</h2>
          <button 
            onClick={onClose} 
            style={closeButtonStyle}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={itemInfoStyle}>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Part Name:</span>
            <span style={infoValueStyle}>{item.part_name}</span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Current Stock:</span>
            <span style={infoValueStyle}>
              {item.current_quantity} {item.measurement.toLowerCase()}
            </span>
          </div>
          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Category:</span>
            <span style={infoValueStyle}>{item.part_category}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Quantity to Use ({item.measurement.toLowerCase()})*
            </label>
            <input
              type="number"
              min="1"
              max={item.current_quantity}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              required
              placeholder={`Enter quantity in ${item.measurement.toLowerCase()}`}
              onKeyPress={(e) => {
                if (e.key === '.' || e.key === ',') {
                  e.preventDefault();
                }
              }}
              disabled={searchingVehicle || loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Vehicle Plate Number (Optional)</label>
            <div style={plateNumberContainerStyle}>
              <div style={plateInputContainerStyle}>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={handlePlateNumberChange}
                  onKeyPress={handlePlateNumberKeyPress}
                  style={inputStyle}
                  placeholder="Enter plate number (e.g., ABC-123)"
                  disabled={searchingVehicle || loading}
                />
                {plateNumberError && (
                  <div style={errorStyle}>{plateNumberError}</div>
                )}
                {vehicleInfo && (
                  <div style={successStyle}>✓ Vehicle found</div>
                )}
              </div>
              <button
                type="button"
                onClick={searchVehicle}
                style={searchButtonStyle}
                disabled={searchingVehicle || loading || !plateNumber.trim()}
              >
                {searchingVehicle ? "Searching..." : "Search"}
              </button>
            </div>
            
            {vehicleInfo && (
              <div style={vehicleInfoStyle}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Vehicle:</span>
                  <span style={infoValueStyle}>
                    {vehicleInfo.plate_number} - {vehicleInfo.brand} {vehicleInfo.model}
                  </span>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>Status:</span>
                  <span style={infoValueStyle}>{vehicleInfo.status}</span>
                </div>
                {latestVehicleData && (
                  <>
                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Previous Odometer:</span>
                      <span style={infoValueStyle}>
                        {previousOdometer?.toLocaleString() || '0'} km
                      </span>
                    </div>
                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Previous Fuel:</span>
                      <span style={infoValueStyle}>
                        {previousFuel?.toLocaleString() || '0'} L
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {vehicleInfo && (
            <>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Vehicle Readings</label>
                <div style={odometerFuelContainerStyle}>
                  <div style={odometerFuelGroupStyle}>
                    <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Current Odometer (km)*</label>
                    <input
                      type="number"
                      step="1"
                      value={currentOdometer}
                      onChange={(e) => setCurrentOdometer(e.target.value)}
                      style={inputStyle}
                      placeholder="Enter current odometer"
                      disabled={loading}
                      required
                    />
                    <div style={previousValueStyle}>
                      Previous: {previousOdometer.toLocaleString()} km (must be greater)
                    </div>
                  </div>
                  <div style={odometerFuelGroupStyle}>
                    <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Current Fuel (L)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={currentFuel}
                      onChange={(e) => setCurrentFuel(e.target.value)}
                      style={inputStyle}
                      placeholder="Enter current fuel level"
                      disabled={loading}
                    />
                    <div style={previousValueStyle}>
                      Previous: {previousFuel.toLocaleString()} L
                    </div>
                  </div>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Fuel Added (L) - Optional</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={fuelAdded}
                  onChange={(e) => setFuelAdded(e.target.value)}
                  style={inputStyle}
                  placeholder="Enter fuel added (if any)"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div style={formGroupStyle}>
            <label style={labelStyle}>Maintenance Type (Optional)</label>
            <select
              value={maintenanceType}
              onChange={(e) => setMaintenanceType(e.target.value)}
              style={selectStyle}
              disabled={loading}
            >
              <option value="">Select maintenance type...</option>
              {maintenanceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ 
              padding: "12px", 
              backgroundColor: "#f8d7da", 
              color: "#721c24", 
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "0.85rem"
            }}>
              {error}
            </div>
          )}

          <div style={buttonContainerStyle}>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={loading ? disabledButtonStyle : submitButtonStyle}
              disabled={loading}
            >
              {loading ? "Processing..." : "Use Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}