import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../security/AuthContext";

export default function VehicleIssueReport() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [issue, setIssue] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customIssue, setCustomIssue] = useState("");
  const [severity, setSeverity] = useState(""); // Changed from "medium" to empty string
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Track if form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoad = useRef(true);

  const severityOptions = [
    { value: "low", label: "Low - Minor issue, doesn't affect operation" },
    { value: "medium", label: "Medium - Noticeable issue, monitor closely" },
    { value: "high", label: "High - Affects vehicle operation, needs attention" },
    { value: "critical", label: "Critical - Safety issue, immediate attention required" }
  ];

  const issueCategories = [
    { id: "engine", label: "Engine Issues", subcategories: [
      "Overheating", "Strange noises", "Loss of power", "Difficulty starting", "Check engine light"
    ]},
    { id: "brakes", label: "Brake System", subcategories: [
      "Squeaking/grinding", "Soft brake pedal", "Vibration when braking", "Brake warning light"
    ]},
    { id: "tires", label: "Tires & Wheels", subcategories: [
      "Uneven wear", "Low pressure", "Vibration", "Puncture/damage", "Alignment issues"
    ]},
    { id: "electrical", label: "Electrical System", subcategories: [
      "Battery problems", "Lighting issues", "Warning lights", "Electrical shorts", "Power window/lock issues"
    ]},
    { id: "suspension", label: "Suspension & Steering", subcategories: [
      "Steering vibration", "Pulling to one side", "Noise over bumps", "Uneven tire wear", "Loose steering"
    ]},
    { id: "transmission", label: "Transmission", subcategories: [
      "Slipping gears", "Delayed shifting", "Transmission fluid leak", "Grinding noises"
    ]},
    { id: "exhaust", label: "Exhaust System", subcategories: [
      "Loud exhaust", "Smoke from exhaust", "Exhaust leaks", "Reduced fuel efficiency"
    ]},
    { id: "fluid", label: "Fluid Issues", subcategories: [
      "Oil leaks", "Coolant leaks", "Brake fluid leaks", "Transmission fluid leaks", "Low fluid levels"
    ]}
  ];

  const severityLabelSelected = {
    low: {
      borderColor: "#10b981",
      backgroundColor: "#d1fae5"
    },
    medium: {
      borderColor: "#f59e0b",
      backgroundColor: "#fef3c7"
    },
    high: {
      borderColor: "#f97316",
      backgroundColor: "#ffedd5"
    },
    critical: {
      borderColor: "#dc2626",
      backgroundColor: "#fee2e2"
    }
  };

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    return (
      selectedCategories.length > 0 ||
      customIssue.trim() !== "" ||
      issue.trim() !== "" ||
      severity !== "" ||
      showCustomInput
    );
  };

  // Update hasUnsavedChanges whenever form fields change
  useEffect(() => {
    if (!initialLoad.current) {
      setHasUnsavedChanges(checkForUnsavedChanges());
    } else {
      initialLoad.current = false;
    }
  }, [selectedCategories, customIssue, issue, severity, showCustomInput]);

  // Handle page leave/refresh warning (browser default)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        // Show browser's default warning dialog
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
  }, [user]);

  const handleCategoryChange = (categoryId, subcategory) => {
    const issueKey = `${categoryId}:${subcategory}`;
    setSelectedCategories(prev => {
      if (prev.includes(issueKey)) {
        return prev.filter(item => item !== issueKey);
      } else {
        return [...prev, issueKey];
      }
    });
  };

  const validate = () => {
    const errs = {};
    
    if (!vehicle) {
      errs.vehicle = "No vehicle assigned. Please check your current reservation.";
    }
    
    if (selectedCategories.length === 0 && !customIssue.trim()) {
      errs.issues = "Please select at least one issue or describe a custom issue";
    }
    
    if (!severity) {
      errs.severity = "Please select an issue severity level";
    }
    
    if (showCustomInput && !customIssue.trim()) {
      errs.customIssue = "Please describe the custom issue";
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
        const res = await fetch("/.netlify/functions/logVehicleIssue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_ID,
            vehicle_id: vehicle.vehicle_id,
            plate: vehicle.plate_number,
            issue_categories: selectedCategories,
            custom_issue: customIssue,
            issue_description: issue,
            severity: severity,
            timestamp: new Date().toISOString()
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to submit issue");
        }
        
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        
        // Reset all form fields after successful submission
        setSelectedCategories([]);
        setCustomIssue("");
        setIssue("");
        setSeverity(""); // Reset to empty string
        setShowCustomInput(false);
        setHasUnsavedChanges(false); // No unsaved changes after submission
        
      } catch (err) {
        console.error(err);
        setErrors(prev => ({
          ...prev,
          submitError: err.message || "Failed to submit issue report"
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.mainCard}>
        
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
                    Report issues immediately when noticed
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Select all applicable issue categories
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Set appropriate severity level
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Provide detailed description of symptoms
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Report safety-critical issues as "Critical"
                  </li>
                  <li style={styles.instructionItem}>
                    <span style={styles.checkMark}>✓</span>
                    Use "Other Issue" for unlisted problems
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
                    Vehicle assignment is required for issue reporting
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formPanel}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Report Vehicle Issue</h2>
            <p style={styles.formSubtitle}>Help us maintain vehicle safety and performance through predictive maintenance</p>
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
              <div style={styles.currentVehicleInfo}>
                <div style={styles.currentVehicleLabel}>Reporting Issue For:</div>
                <div style={styles.currentVehicleDetails}>
                  {vehicle.brand} {vehicle.model} • {vehicle.plate_number}
                </div>
              </div>

              <div style={styles.singleField}>
                <label style={styles.label}>Issue Severity *</label>
                <div style={styles.severityOptions}>
                  {severityOptions.map(option => {
                    const isSelected = severity === option.value;
                    const selectedStyle = severityLabelSelected[option.value];
                    
                    return (
                      <div key={option.value} style={styles.severityOption}>
                        <input
                          type="radio"
                          id={`severity-${option.value}`}
                          name="severity"
                          value={option.value}
                          checked={isSelected}
                          onChange={(e) => setSeverity(e.target.value)}
                          style={styles.radio}
                          required
                        />
                        <label 
                          htmlFor={`severity-${option.value}`}
                          style={{
                            flex: 1,
                            padding: "12px",
                            borderRadius: "8px",
                            borderWidth: "2px",
                            borderStyle: "solid",
                            borderColor: isSelected ? selectedStyle.borderColor : "#e5e7eb",
                            backgroundColor: isSelected ? selectedStyle.backgroundColor : "#f9fafb",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={styles.severityTitle}>
                            {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                          </div>
                          <div style={styles.severityDescription}>
                            {option.label}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {errors.severity && (
                  <div style={styles.errorText}>{errors.severity}</div>
                )}
              </div>

              <div style={styles.singleField}>
                <label style={styles.label}>Select Issue Categories *</label>
                <div style={styles.categoryGrid}>
                  {issueCategories.map(category => (
                    <div key={category.id} style={styles.categoryGroup}>
                      <div style={styles.categoryTitle}>{category.label}</div>
                      <div style={styles.subcategoryList}>
                        {category.subcategories.map(subcategory => {
                          const issueKey = `${category.id}:${subcategory}`;
                          return (
                            <div key={issueKey} style={styles.checkboxItem}>
                              <input
                                type="checkbox"
                                id={issueKey}
                                checked={selectedCategories.includes(issueKey)}
                                onChange={() => handleCategoryChange(category.id, subcategory)}
                                style={styles.checkbox}
                              />
                              <label htmlFor={issueKey} style={styles.checkboxLabel}>
                                {subcategory}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.issues && (
                  <div style={styles.errorText}>{errors.issues}</div>
                )}
              </div>

              <div style={styles.singleField}>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="customIssueToggle"
                    checked={showCustomInput}
                    onChange={(e) => setShowCustomInput(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <label htmlFor="customIssueToggle" style={styles.checkboxLabel}>
                    Other Issue (not listed above)
                  </label>
                </div>
                
                {showCustomInput && (
                  <div style={styles.customInputContainer}>
                    <input
                      type="text"
                      value={customIssue}
                      onChange={(e) => setCustomIssue(e.target.value)}
                      placeholder="Describe the issue not listed above"
                      style={{
                        ...styles.input,
                        ...(errors.customIssue && styles.inputError)
                      }}
                    />
                    {errors.customIssue && (
                      <div style={styles.errorText}>{errors.customIssue}</div>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.singleField}>
                <label style={styles.label}>
                  Additional Details & Description
                  <span style={styles.helperTextInline}>
                    &nbsp;(Optional but recommended)
                  </span>
                </label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Provide additional details: When does it happen? How severe is it? Any warning lights? etc."
                  style={{
                    ...styles.input,
                    ...styles.textarea,
                    minHeight: "120px",
                    resize: "vertical"
                  }}
                />
                <div style={styles.helperText}>
                  Include details like frequency, severity, conditions when issue occurs, and any warning indicators
                </div>
              </div>

              <div style={styles.buttonContainer}>
                <button 
                  type="submit" 
                  style={{
                    ...styles.submitButton,
                    ...(loading && styles.submitButtonDisabled)
                  }}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.noVehicleMessage}>
              <div style={styles.noVehicleIcon}>🚗</div>
              <div style={styles.noVehicleText}>
                You need an active vehicle reservation to report issues.
                <br />
                Please check with your supervisor for current vehicle assignment.
              </div>
            </div>
          )}
        </div>
      </div>

      {sent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>✅ Issue Reported Successfully</div>
            <div style={styles.modalMessage}>
              Your vehicle issue has been recorded.
              <br />
              Maintenance team will be notified.
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
    maxWidth: "800px",
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
  singleField: {
    marginBottom: "25px",
    width: "100%"
  },
  label: {
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#374151",
    display: "block"
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
  textarea: {
    fontFamily: "inherit",
    lineHeight: "1.5"
  },
  inputError: {
    border: "2px solid #dc2626"
  },
  errorText: {
    color: "#dc2626",
    fontSize: "0.9rem",
    marginTop: "6px"
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "auto",
    paddingTop: "20px"
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    width: "160px",
    height: "44px"
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
    maxWidth: "400px"
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
    fontSize: "1rem",
    lineHeight: "1.5"
  },
  modalButton: {
    padding: "10px 20px",
    backgroundColor: "#6b7280",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500"
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
  helperTextInline: {
    fontSize: "0.8rem",
    color: "#6b7280",
    fontStyle: "italic",
    fontWeight: "normal"
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    maxHeight: "300px",
    overflowY: "auto",
    padding: "10px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#f9fafb"
  },
  categoryGroup: {
    marginBottom: "15px"
  },
  categoryTitle: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
    paddingBottom: "4px",
    borderBottom: "1px solid #e5e7eb"
  },
  subcategoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  checkboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer"
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer"
  },
  checkboxLabel: {
    fontSize: "0.9rem",
    color: "#4b5563",
    cursor: "pointer",
    userSelect: "none"
  },
  customInputContainer: {
    marginTop: "10px"
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
  severityOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
    marginTop: "10px"
  },
  severityOption: {
    display: "flex",
    alignItems: "flex-start"
  },
  radio: {
    marginTop: "4px",
    marginRight: "10px",
    cursor: "pointer"
  },
  severityTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "4px"
  },
  severityDescription: {
    fontSize: "0.85rem",
    color: "#6b7280",
    lineHeight: "1.4"
  }
};