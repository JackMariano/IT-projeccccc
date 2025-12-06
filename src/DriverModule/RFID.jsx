import React, { useState, useEffect } from "react";
import { useAuth } from "../security/AuthContext";

export default function RFID() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [rfidBalance, setRfidBalance] = useState(null);
  const [pricePaid, setPricePaid] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [exitLocation, setExitLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Toll gate locations
  const tollLocations = [
    "North Luzon Expressway (NLEX) - Balintawak",
    "NLEX - Mindanao Avenue",
    "NLEX - Karuhatan",
    "NLEX - Valenzuela",
    "NLEX - Meycauayan",
    "NLEX - Marilao",
    "NLEX - Bocaue",
    "NLEX - Tabang",
    "Subic–Clark–Tarlac Expressway (SCTEX) - Clark",
    "SCTEX - Concepcion",
    "SCTEX - Hacienda Luisita",
    "SCTEX - Tarlac",
    "South Luzon Expressway (SLEX) - Alabang",
    "SLEX - Calamba",
    "SLEX - Sto. Tomas",
    "SLEX - Lipa",
    "SLEX - Ibaan",
    "Cavite Expressway (CAVITEX) - Kawit",
    "CAVITEX - Longos",
    "CAVITEX - Zapote",
    "NAIA Expressway (NAIAX) - NAIA Terminal 3",
    "NAIAX - Sales Road",
    "NAIAX - Macapagal Blvd",
    "NAIAX - EDSA",
    "McArthur Highway - Bulacan",
    "McArthur Highway - Pampanga",
    "McArthur Highway - Tarlac"
  ];

  useEffect(() => {
    const fetchDriverVehicle = async () => {
      if (!user?.user_ID) return;
      
      setLoading(true);
      try {
        const res = await fetch(
          `/.netlify/functions/getDriverVehicle?driver_id=${user.user_ID}`
        );
        const data = await res.json();
        
        if (data.vehicle) {
          setVehicle(data.vehicle);
          // Load RFID balance for this vehicle
          await loadRFIDBalance(data.vehicle.vehicle_id);
        } else {
          setVehicle(null);
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
    
    fetchDriverVehicle();
    setLocations(tollLocations);
  }, [user]);

  const loadRFIDBalance = async (vehicleId) => {
    try {
      setFormLoading(true);
      const res = await fetch(
        `/.netlify/functions/getRFIDBalance?vehicle_ID=${vehicleId}`
      );
      const data = await res.json();
      setRfidBalance(data.balance ?? 0);
    } catch (err) {
      console.error("Get RFID Balance error:", err);
      setRfidBalance(0);
      setErrors(prev => ({
        ...prev,
        balanceError: "Failed to load RFID balance"
      }));
    } finally {
      setFormLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    
    if (!vehicle) {
      errs.vehicle = "No vehicle assigned. Please check your current reservation.";
    }
    
    if (!entryLocation) {
      errs.entryLocation = "Please select entry location";
    }
    
    if (!exitLocation) {
      errs.exitLocation = "Please select exit location";
    }
    
    if (!pricePaid) {
      errs.pricePaid = "Please enter toll fee amount";
    } else if (isNaN(parseFloat(pricePaid)) || parseFloat(pricePaid) <= 0) {
      errs.pricePaid = "Toll fee must be a valid positive number";
    }
    
    if (rfidBalance !== null && parseFloat(pricePaid) > rfidBalance) {
      errs.pricePaid = `Insufficient RFID balance. Current balance: ${rfidBalance} PHP`;
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
        const newBalance = rfidBalance - parseFloat(pricePaid);
        
        const res = await fetch("/.netlify/functions/updateRFID", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_ID: vehicle.vehicle_id,
            entryLocation,
            exitLocation,
            pricePaid: parseFloat(pricePaid),
            newBalance,
            user_id: user.user_ID,
            timestamp: new Date().toISOString()
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to process RFID transaction");
        }
        
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        
        // Reset form
        setPricePaid("");
        setEntryLocation("");
        setExitLocation("");
        
        // Reload balance
        await loadRFIDBalance(vehicle.vehicle_id);
        
      } catch (err) {
        console.error(err);
        setErrors(prev => ({
          ...prev,
          submitError: err.message || "Failed to process RFID transaction"
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.mainCard}>
        
        {/* Left Panel - Vehicle Info & Instructions - NO SCROLLING */}
        <div style={styles.vehiclePanel}>
          <h3 style={styles.panelTitle}>RFID Toll Payment</h3>
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
                <div style={styles.instructionsTitle}>📝 Toll Payment Instructions</div>
                <ul style={styles.instructionsList}>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Report toll payments immediately after passing through
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Select correct entry and exit locations
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Enter accurate toll fee amount
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Ensure sufficient RFID balance before travel
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Keep receipts for verification
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Report discrepancies within 24 hours
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
                    You must have an active vehicle reservation
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Check with your supervisor for current assignment
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Vehicle assignment is required for RFID transactions
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - RFID Transaction Form - WITH SCROLLING */}
        <div style={styles.formPanel}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Record Toll Payment</h2>
            <p style={styles.formSubtitle}>Record RFID transactions for accurate expense tracking</p>
          </div>
          
          {errors.fetchError && (
            <div style={styles.errorBanner}>{errors.fetchError}</div>
          )}
          
          {errors.submitError && (
            <div style={styles.errorBanner}>{errors.submitError}</div>
          )}

          {errors.vehicle && (
            <div style={styles.errorBanner}>{errors.vehicle}</div>
          )}

          {vehicle ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Current Vehicle Info */}
              <div style={styles.currentVehicleInfo}>
                <div style={styles.currentVehicleLabel}>Vehicle for Transaction:</div>
                <div style={styles.currentVehicleDetails}>
                  {vehicle.brand} {vehicle.model} • {vehicle.plate_number}
                </div>
              </div>

              {/* RFID Balance Display */}
              <div style={styles.balanceCard}>
                <div style={styles.balanceLabel}>Current RFID Balance</div>
                <div style={styles.balanceAmount}>
                  {formLoading ? "Loading..." : `${rfidBalance !== null ? rfidBalance.toFixed(2) : '0.00'} PHP`}
                </div>
                {errors.balanceError && (
                  <div style={styles.balanceError}>{errors.balanceError}</div>
                )}
              </div>

              {/* Entry and Exit Locations */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Entry Location</label>
                  <select
                    value={entryLocation}
                    onChange={(e) => setEntryLocation(e.target.value)}
                    style={{
                      ...styles.input,
                      ...styles.selectInput,
                      ...(errors.entryLocation && styles.inputError)
                    }}
                  >
                    <option value="">Select entry toll gate</option>
                    {locations.map(location => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {errors.entryLocation && (
                    <div style={styles.errorText}>{errors.entryLocation}</div>
                  )}
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Exit Location</label>
                  <select
                    value={exitLocation}
                    onChange={(e) => setExitLocation(e.target.value)}
                    style={{
                      ...styles.input,
                      ...styles.selectInput,
                      ...(errors.exitLocation && styles.inputError)
                    }}
                  >
                    <option value="">Select exit toll gate</option>
                    {locations.map(location => (
                      <option key={`${location}-exit`} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {errors.exitLocation && (
                    <div style={styles.errorText}>{errors.exitLocation}</div>
                  )}
                </div>
              </div>

              {/* Toll Fee Amount */}
              <div style={styles.singleField}>
                <label style={styles.label}>Toll Fee Amount (PHP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.pricePaid && styles.inputError)
                  }}
                  placeholder="Enter toll fee amount"
                />
                {errors.pricePaid && (
                  <div style={styles.errorText}>{errors.pricePaid}</div>
                )}
                <div style={styles.helperText}>
                  Enter the exact amount deducted from RFID
                </div>
              </div>

              {/* Transaction Summary */}
              {pricePaid && rfidBalance !== null && (
                <div style={styles.summaryBox}>
                  <div style={styles.summaryTitle}>Transaction Summary</div>
                  <div style={styles.summaryRow}>
                    <span>Current Balance:</span>
                    <span style={styles.summaryValue}>{rfidBalance.toFixed(2)} PHP</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Toll Fee:</span>
                    <span style={styles.summaryValue}>-{parseFloat(pricePaid).toFixed(2)} PHP</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>New Balance:</span>
                    <span style={{
                      ...styles.summaryValue,
                      color: (rfidBalance - parseFloat(pricePaid)) < 0 ? "#dc2626" : "#16a34a",
                      fontWeight: "bold"
                    }}>
                      {(rfidBalance - parseFloat(pricePaid)).toFixed(2)} PHP
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div style={styles.submitButtonContainer}>
                <button 
                  type="submit" 
                  style={{
                    ...styles.submitButton,
                    ...(loading && styles.submitButtonDisabled)
                  }}
                  disabled={loading || formLoading}
                >
                  {loading ? "Processing..." : "Submit Toll Payment"}
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.noVehicleMessage}>
              <div style={styles.noVehicleIcon}>🚗</div>
              <div style={styles.noVehicleText}>
                You need an active vehicle reservation to record toll payments.
                <br />
                Please check with your supervisor for current vehicle assignment.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {sent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>✅ Payment Recorded Successfully</div>
            <div style={styles.modalMessage}>
              Your toll payment has been recorded.
              <br />
              RFID balance has been updated.
            </div>
            <button 
              onClick={() => setSent(false)} 
              style={styles.modalButton}
            >
              Close
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
    height: "100%",
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
    padding: "25px", // Reduced from 30px
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  panelTitle: {
    fontSize: "1.4rem", // Reduced from 1.5rem
    fontWeight: "700",
    margin: "0 0 20px 0", // Reduced from 25px
    color: "#fff",
    textAlign: "center"
  },
  vehicleInfo: {
    lineHeight: "1.5",
    flex: "1",
    display: "flex",
    flexDirection: "column"
  },
  vehicleDetails: {
    marginBottom: "20px" // Reduced from 30px
  },
  vehicleBrand: {
    fontSize: "1.3rem", // Reduced from 1.4rem
    fontWeight: "800",
    color: "#93c5fd",
    marginBottom: "6px", // Reduced from 8px
    textAlign: "center"
  },
  vehicleModel: {
    fontSize: "1.3rem", // Reduced from 1.4rem
    fontWeight: "800",
    color: "#86efac",
    marginBottom: "6px", // Reduced from 8px
    textAlign: "center"
  },
  vehiclePlate: {
    fontSize: "1.3rem", // Reduced from 1.4rem
    fontWeight: "800",
    color: "#fdba74",
    marginBottom: "0",
    textAlign: "center"
  },
  instructions: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "15px", // Reduced from 20px
    borderRadius: "8px",
    margin: "0",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    flex: "1"
  },
  instructionsTitle: {
    fontSize: "1rem", // Reduced from 1.1rem
    fontWeight: "700",
    marginBottom: "12px", // Reduced from 15px
    color: "#86efac",
    textAlign: "center"
  },
  instructionsList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    opacity: "0.9"
  },
  instructionItem: {
    fontSize: "0.85rem", // Reduced from 0.9rem
    marginBottom: "10px", // Reduced from 12px
    display: "flex",
    alignItems: "flex-start",
    lineHeight: "1.3" // Reduced from 1.4
  },
  checkMark: {
    color: "#86efac",
    fontWeight: "bold",
    marginRight: "8px", // Reduced from 10px
    fontSize: "0.9rem", // Reduced from 1rem
    marginTop: "1px",
    flexShrink: "0"
  },
  noVehicleContainer: {
    textAlign: "center",
    flex: "1",
    display: "flex",
    flexDirection: "column"
  },
  noVehicle: {
    fontSize: "1.1rem", // Reduced from 1.2rem
    opacity: "0.8",
    margin: "0 0 20px 0", // Reduced from 25px
    color: "#fdba74",
    fontWeight: "600"
  },
  formPanel: {
    flex: "1",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
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
  currentVehicleInfo: {
    backgroundColor: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "25px",
    textAlign: "center"
  },
  currentVehicleLabel: {
    fontSize: "0.9rem",
    color: "#0369a1",
    marginBottom: "5px",
    fontWeight: "600"
  },
  currentVehicleDetails: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#0c4a6e"
  },
  balanceCard: {
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "25px",
    textAlign: "center"
  },
  balanceLabel: {
    fontSize: "0.9rem",
    color: "#92400e",
    marginBottom: "8px",
    fontWeight: "600"
  },
  balanceAmount: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#d97706"
  },
  balanceError: {
    fontSize: "0.8rem",
    color: "#dc2626",
    marginTop: "5px"
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
  singleField: {
    marginBottom: "30px",
    width: "100%"
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
  selectInput: {
    cursor: "pointer",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    backgroundSize: "1em"
  },
  inputError: {
    border: "2px solid #dc2626"
  },
  errorText: {
    color: "#dc2626",
    fontSize: "0.9rem",
    marginTop: "6px"
  },
  submitButtonContainer: {
    marginTop: "auto",
    paddingTop: "20px",
    textAlign: "center"
  },
  submitButton: {
    padding: "14px 28px",
    backgroundColor: "#e5b038",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    width: "200px"
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
    color: "#6b7280"
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
    minWidth: "300px"
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: "12px"
  },
  modalMessage: {
    marginBottom: "20px",
    color: "#374151",
    fontSize: "1rem"
  },
  modalButton: {
    padding: "10px 20px",
    backgroundColor: "#6b7280",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem"
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
  noVehicleMessage: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  noVehicleIcon: {
    fontSize: "3rem",
    marginBottom: "20px"
  },
  noVehicleText: {
    fontSize: "1.1rem",
    color: "#6b7280",
    lineHeight: "1.6"
  },
  summaryBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "30px"
  },
  summaryTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "15px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e5e7eb"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    fontSize: "0.95rem",
    color: "#4b5563"
  },
  summaryValue: {
    fontWeight: "500",
    color: "#1f2937"
  }
};