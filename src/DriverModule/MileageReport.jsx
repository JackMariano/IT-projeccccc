import React, { useState, useEffect } from "react";
import { useAuth } from "../security/AuthContext";

export default function MileageReport() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [prevOdometer, setPrevOdometer] = useState(0);
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [calculatedMileage, setCalculatedMileage] = useState(0);
  const [currentFuel, setCurrentFuel] = useState(""); // Fuel level BEFORE refill
  const [addedFuel, setAddedFuel] = useState(""); // Fuel added during refill
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSubmittedMileage, setLastSubmittedMileage] = useState(0); // Store the mileage that was submitted

  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!user?.user_ID) return;
      
      setLoading(true);
      try {
        const vehicleRes = await fetch(
          `/.netlify/functions/getDriverVehicle?driver_id=${user.user_ID}`
        );
        const data = await vehicleRes.json();
        
        console.log("API Response:", data);
        
        if (data.vehicle) {
          setVehicle(data.vehicle);
          const prevOdo = data.prevOdometer || 0;
          setPrevOdometer(prevOdo);
          setCurrentOdometer(prevOdo);
          // Initialize with 0 mileage since we'll calculate it
          setCalculatedMileage(0);
        } else {
          setVehicle(null);
          setPrevOdometer(0);
          setCurrentOdometer(0);
          setCalculatedMileage(0);
        }
      } catch (err) {
        console.error("Failed fetching vehicle:", err);
        setErrors(prev => ({
          ...prev,
          fetchError: "Failed to load vehicle data. Please try again."
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchVehicleData();
  }, [user]);

  // Calculate mileage whenever odometer changes - FIXED with rounding
  useEffect(() => {
    const currentOdo = parseFloat(currentOdometer);
    const prevOdo = parseFloat(prevOdometer);
    
    if (!isNaN(currentOdo) && !isNaN(prevOdo) && currentOdo >= prevOdo) {
      // Calculate and round to 1 decimal place to avoid floating-point errors
      const mileage = Math.round((currentOdo - prevOdo) * 10) / 10;
      setCalculatedMileage(mileage);
    } else {
      setCalculatedMileage(0);
    }
  }, [currentOdometer, prevOdometer]);

  const validate = () => {
    const errs = {};
    
    // Current Fuel validation (before refill)
    if (!currentFuel && currentFuel !== 0) {
      errs.currentFuel = "Enter current fuel level before refill (in liters)";
    } else if (isNaN(parseFloat(currentFuel)) || parseFloat(currentFuel) < 0) {
      errs.currentFuel = "Current fuel must be a valid positive number";
    }
    
    // Added Fuel validation
    if (!addedFuel && addedFuel !== 0) {
      errs.addedFuel = "Enter added fuel in liters";
    } else if (isNaN(parseFloat(addedFuel)) || parseFloat(addedFuel) < 0) {
      errs.addedFuel = "Fuel amount must be a valid positive number";
    }
    
    // Odometer validation
    const currentOdo = parseFloat(currentOdometer);
    const prevOdo = parseFloat(prevOdometer);
    
    if (!currentOdometer && currentOdometer !== 0) {
      errs.currentOdometer = "Enter new odometer reading";
    } else if (isNaN(currentOdo) || currentOdo < 0) {
      errs.currentOdometer = "Odometer must be a valid number";
    } else if (currentOdo < prevOdo) {
      errs.currentOdometer = "New odometer cannot be less than previous odometer";
    }
    
    // Validate decimal places for odometer (max 1 decimal place)
    if (currentOdometer.toString().includes('.')) {
      const decimalPlaces = currentOdometer.toString().split('.')[1].length;
      if (decimalPlaces > 1) {
        errs.currentOdometer = "Odometer should have at most 1 decimal place (e.g., 76850.5)";
      }
    }
    
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    
    if (Object.keys(errs).length === 0 && vehicle) {
      setLoading(true);
      try {
        // Store the mileage before resetting
        setLastSubmittedMileage(calculatedMileage);
        
        const res = await fetch("/.netlify/functions/logMileage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_ID,
            vehicle_id: vehicle.vehicle_id,
            prevOdometer,
            currentOdometer,
            currentMileage: calculatedMileage, // Send calculated mileage
            currentFuel: Number(currentFuel), // Fuel level BEFORE refill
            addedFuel: Number(addedFuel), // Fuel added during refill
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to submit");
        }
        
        setSent(true);
        setTimeout(() => setSent(false), 3000);

        // Update local state with new values AFTER successful submission
        setPrevOdometer(currentOdometer);
        setCurrentOdometer(currentOdometer); // Keep same value as new previous odometer
        setCurrentFuel("");
        setAddedFuel("");
        setCalculatedMileage(0); // Reset mileage calculation
        
      } catch (err) {
        console.error(err);
        setErrors(prev => ({
          ...prev,
          submitError: err.message || "Failed to submit mileage report"
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle input changes
  const handleCurrentOdometerChange = (e) => {
    let value = e.target.value;
    
    // Prevent scrolling from adding decimals
    // If value has more than 1 decimal place, round it
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 1) {
        // Round to 1 decimal place
        value = Math.round(parseFloat(value) * 10) / 10;
      }
    }
    
    setCurrentOdometer(value);
    if (errors.currentOdometer) setErrors(prev => ({ ...prev, currentOdometer: "" }));
  };

  // Prevent wheel scroll on odometer input to avoid decimal issues
  const handleOdometerWheel = (e) => {
    e.target.blur();
  };

  const handleCurrentFuelChange = (e) => {
    const value = e.target.value;
    setCurrentFuel(value);
    if (errors.currentFuel) setErrors(prev => ({ ...prev, currentFuel: "" }));
  };

  const handleAddedFuelChange = (e) => {
    const value = e.target.value;
    setAddedFuel(value);
    if (errors.addedFuel) setErrors(prev => ({ ...prev, addedFuel: "" }));
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.mainCard}>
        
        {/* Vehicle Info Panel */}
        <div style={styles.vehiclePanel}>
          <h3 style={styles.panelTitle}>You are Using</h3>
          {loading ? (
            <div style={styles.loading}>Loading vehicle data...</div>
          ) : vehicle ? (
            <div style={styles.vehicleInfo}>
              <div style={styles.vehicleDetails}>
                <div style={styles.vehicleBrand}>{vehicle.brand?.toUpperCase()}</div>
                <div style={styles.vehicleModel}>{vehicle.model?.toUpperCase()}</div>
                <div style={styles.vehiclePlate}>{vehicle.plate_number?.toUpperCase()}</div>
              </div>

              <div style={styles.instructions}>
                <div style={styles.instructionsTitle}>📝 Reporting Instructions</div>
                <ul style={styles.instructionsList}>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Report fuel consumption after each refill
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Enter fuel level BEFORE refilling
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Enter accurate fuel amounts in liters
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Submit reports within 24 hours of refueling
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    New odometer reading should not be less than previous
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Mileage is automatically calculated from odometer difference
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Use keyboard to enter odometer values (scroll disabled)
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={styles.noVehicleContainer}>
              <p style={styles.noVehicle}>No vehicle assigned</p>
              <div style={styles.instructions}>
                <div style={styles.instructionsTitle}>ℹ️ Information</div>
                <ul style={styles.instructionsList}>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Please check with your supervisor for vehicle assignment
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Vehicle assignment is required for reporting
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Form Panel */}
        <div style={styles.formPanel}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Record Vehicle Usage</h2>
            <p style={styles.formSubtitle}>Update your vehicle's mileage and fuel consumption data</p>
          </div>
          
          {errors.fetchError && (
            <div style={styles.errorBanner}>{errors.fetchError}</div>
          )}
          
          {errors.submitError && (
            <div style={styles.errorBanner}>{errors.submitError}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Odometer Row */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Previous Odometer (km)</label>
                <input 
                  style={styles.disabledInput} 
                  value={parseFloat(prevOdometer).toFixed(1)} 
                  disabled 
                />
                <div style={styles.helperText}>Last recorded value</div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>New Odometer (km)</label>
                <input 
                  type="number"
                  value={currentOdometer}
                  onChange={handleCurrentOdometerChange}
                  onWheel={handleOdometerWheel} // Disable scroll wheel
                  style={{
                    ...styles.input,
                    ...(errors.currentOdometer && styles.inputError)
                  }}
                  placeholder="Enter new odometer"
                  min={prevOdometer}
                  step="0.1"
                />
                {errors.currentOdometer && (
                  <div style={styles.errorText}>{errors.currentOdometer}</div>
                )}
                <div style={styles.helperText}>Current reading from odometer (use keyboard, scroll disabled)</div>
              </div>
            </div>

            {/* Calculated Distance Traveled */}
            <div style={styles.formRow}>
              <div style={{ ...styles.formGroup, gridColumn: "span 2" }}>
                <label style={styles.label}>Distance Traveled (km)</label>
                <div style={styles.distanceDisplay}>
                  <span style={styles.distanceValue}>{calculatedMileage.toFixed(1)} km</span>
                  <div style={styles.distanceCalculation}>
                    Calculation: {parseFloat(currentOdometer).toFixed(1)} km - {parseFloat(prevOdometer).toFixed(1)} km = {calculatedMileage.toFixed(1)} km
                  </div>
                </div>
                <div style={styles.helperText}>
                  Automatically calculated from odometer difference (rounded to 1 decimal place)
                </div>
              </div>
            </div>

            {/* Fuel Row - Current Fuel (before refill) and Added Fuel */}
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Fuel (liters)</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentFuel}
                  onChange={handleCurrentFuelChange}
                  style={{
                    ...styles.input,
                    ...(errors.currentFuel && styles.inputError)
                  }}
                  placeholder="Fuel level BEFORE refill"
                />
                {errors.currentFuel && (
                  <div style={styles.errorText}>{errors.currentFuel}</div>
                )}
                <div style={styles.helperText}>Fuel level before adding fuel (up to 2 decimal places)</div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fuel Added (liters)</label>
                <input
                  type="number"
                  step="0.01"
                  value={addedFuel}
                  onChange={handleAddedFuelChange}
                  style={{
                    ...styles.input,
                    ...(errors.addedFuel && styles.inputError)
                  }}
                  placeholder="Fuel added during refill"
                />
                {errors.addedFuel && (
                  <div style={styles.errorText}>{errors.addedFuel}</div>
                )}
                <div style={styles.helperText}>Fuel added during this refill (up to 2 decimal places)</div>
              </div>
            </div>

            {/* Note about calculations */}
            <div style={styles.noteBox}>
              <div style={styles.noteTitle}>ℹ️ Automatic Calculations</div>
              <div style={styles.noteText}>
                <strong>Distance Traveled</strong>: New Odometer - Previous Odometer (rounded to 1 decimal)
                <br />
                <strong>Previous fuel</strong>: Calculated from last report (Previous current_fuel + fuel_added)
                <br />
                <strong>Fuel efficiency</strong>: Will be calculated later (Distance Traveled ÷ Fuel Added)
                <br />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                ...(loading && styles.submitButtonDisabled)
              }}
              disabled={loading || !vehicle}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {sent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>✅</div>
            <div style={styles.modalTitle}>Report Submitted</div>
            <div style={styles.modalMessage}>
              Distance traveled: {lastSubmittedMileage.toFixed(1)} km
            </div>
            <button 
              onClick={() => setSent(false)} 
              style={styles.modalButton}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: "0",
    margin: "0",
    width: "100%",
    height: "calc(100vh - 70px)",
    backgroundColor: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  mainCard: {
    display: "flex",
    width: "95%",
    maxWidth: "1400px",
    height: "90%",
    minHeight: "500px",
    maxHeight: "700px",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    backgroundColor: "#fff"
  },
  vehiclePanel: {
    flex: "0 0 350px",
    backgroundColor: "#0e2a47",
    color: "white",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    overflow: "hidden"
  },
  panelTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    margin: "0 0 25px 0",
    color: "#fff",
    textAlign: "center"
  },
  vehicleInfo: {
    lineHeight: "1.6",
    flex: "1",
    display: "flex",
    flexDirection: "column",
    minHeight: "0"
  },
  vehicleDetails: {
    marginBottom: "30px",
    flexShrink: "0"
  },
  vehicleBrand: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#93c5fd",
    marginBottom: "8px",
    textAlign: "center"
  },
  vehicleModel: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#86efac",
    marginBottom: "8px",
    textAlign: "center"
  },
  vehiclePlate: {
    fontSize: "1.4rem",
    fontWeight: "800",
    color: "#fdba74",
    marginBottom: "0",
    textAlign: "center"
  },
  instructions: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "20px",
    borderRadius: "8px",
    margin: "0",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    flex: "1",
    minHeight: "0",
    overflow: "hidden"
  },
  instructionsTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    marginBottom: "15px",
    color: "#86efac",
    textAlign: "center",
    flexShrink: "0"
  },
  instructionsList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    opacity: "0.9",
    overflow: "hidden"
  },
  instructionItem: {
    fontSize: "0.9rem",
    marginBottom: "12px",
    display: "flex",
    alignItems: "flex-start",
    lineHeight: "1.4",
    flexShrink: "0"
  },
  checkMark: {
    color: "#86efac",
    fontWeight: "bold",
    marginRight: "10px",
    fontSize: "1rem",
    flexShrink: "0",
    marginTop: "1px"
  },
  noVehicleContainer: {
    textAlign: "center",
    flex: "1",
    display: "flex",
    flexDirection: "column",
    minHeight: "0"
  },
  noVehicle: {
    fontSize: "1.2rem",
    opacity: "0.8",
    margin: "0 0 25px 0",
    color: "#fdba74",
    fontWeight: "600",
    flexShrink: "0"
  },
  formPanel: {
    flex: "1",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    minWidth: "0"
  },
  formHeader: {
    marginBottom: "30px",
    textAlign: "center"
  },
  formTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1f2937",
    margin: "0 0 8px 0"
  },
  formSubtitle: {
    fontSize: "1rem",
    color: "#6b7280",
    margin: "0"
  },
  form: {
    width: "100%",
    maxWidth: "700px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    flex: "1"
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    marginBottom: "30px",
    width: "100%"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#374151",
    whiteSpace: "nowrap"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "1.1rem",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    boxSizing: "border-box"
  },
  disabledInput: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "1.1rem",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    boxSizing: "border-box"
  },
  inputError: {
    border: "2px solid #dc2626"
  },
  errorText: {
    color: "#dc2626",
    fontSize: "0.9rem",
    marginTop: "6px"
  },
  distanceDisplay: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "1.3rem",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f0f9ff",
    color: "#0369a1",
    textAlign: "center",
    boxSizing: "border-box"
  },
  distanceValue: {
    color: "#0369a1",
    fontSize: "1.5rem",
    fontWeight: "700",
    display: "block",
    marginBottom: "8px"
  },
  distanceCalculation: {
    fontSize: "0.9rem",
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: "5px"
  },
  submitButton: {
    padding: "14px 28px",
    backgroundColor: "#1D4ED8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    width: "180px",
    marginTop: "auto"
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "#fff",
    padding: "32px",
    borderRadius: "12px",
    textAlign: "center",
    minWidth: "300px",
    maxWidth: "350px"
  },
  modalIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px"
  },
  modalTitle: {
    fontSize: "1.4rem",
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: "15px"
  },
  modalMessage: {
    marginBottom: "25px",
    color: "#374151",
    fontSize: "1.1rem",
    lineHeight: "1.5",
    fontWeight: "500"
  },
  modalButton: {
    padding: "10px 30px",
    backgroundColor: "#1D4ED8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    minWidth: "100px"
  },
  loading: {
    textAlign: "center",
    color: "#93c5fd",
    fontSize: "1.1rem",
    margin: "20px 0"
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.95rem"
  },
  helperText: {
    fontSize: "0.8rem",
    color: "#6b7280",
    marginTop: "4px",
    fontStyle: "italic"
  },
  noteBox: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "20px"
  },
  noteTitle: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: "5px"
  },
  noteText: {
    fontSize: "0.85rem",
    color: "#0c4a6e",
    lineHeight: "1.4"
  }
};