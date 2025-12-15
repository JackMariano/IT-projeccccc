// components/AddInventoryModal.jsx
import React, { useState } from "react";

export default function AddInventoryModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  categoryOptions = [],
  measurementOptions = []
}) {
  const [formData, setFormData] = useState({
    part_name: "",
    part_description: "",
    part_category: "Other",
    measurement: "Pieces",
    initial_quantity: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.part_name.trim()) {
      setError("Part name is required");
      return;
    }

    if (!formData.initial_quantity || isNaN(parseInt(formData.initial_quantity)) || parseInt(formData.initial_quantity) < 0) {
      setError("Initial quantity must be a non-negative number");
      return;
    }

    setLoading(true);

    try {
      const endpoint = `/.netlify/functions/addInventory`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          part_name: formData.part_name.trim(),
          part_description: formData.part_description.trim() || null,
          part_category: formData.part_category,
          measurement: formData.measurement,
          initial_quantity: parseInt(formData.initial_quantity)
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(`Successfully added "${formData.part_name}" to inventory`);
        // Reset form
        setFormData({
          part_name: "",
          part_description: "",
          part_category: "Other",
          measurement: "Pieces",
          initial_quantity: ""
        });
        
        // Call success callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to add inventory item');
      }
    } catch (err) {
      console.error("Error adding inventory:", err);
      setError(err.message || "Failed to add inventory item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    setFormData({
      part_name: "",
      part_description: "",
      part_category: "Other",
      measurement: "Pieces",
      initial_quantity: ""
    });
    onClose();
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

  const textareaStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    minHeight: "80px",
    resize: "vertical",
    fontFamily: "inherit",
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
    border: "1px solid #28a745",
    background: "#28a745",
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

  const requiredFieldStyle = {
    color: "#dc3545",
    marginLeft: "2px",
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle} onClick={handleClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Add New Inventory Item</h2>
          <button 
            onClick={handleClose} 
            style={closeButtonStyle}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Part Name<span style={requiredFieldStyle}>*</span>
            </label>
            <input
              type="text"
              name="part_name"
              value={formData.part_name}
              onChange={handleChange}
              style={inputStyle}
              required
              placeholder="Enter part name"
              disabled={loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Description (Optional)</label>
            <textarea
              name="part_description"
              value={formData.part_description}
              onChange={handleChange}
              style={textareaStyle}
              placeholder="Enter part description"
              disabled={loading}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Category<span style={requiredFieldStyle}>*</span>
            </label>
            <select
              name="part_category"
              value={formData.part_category}
              onChange={handleChange}
              style={selectStyle}
              required
              disabled={loading}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Measurement Unit<span style={requiredFieldStyle}>*</span>
            </label>
            <select
              name="measurement"
              value={formData.measurement}
              onChange={handleChange}
              style={selectStyle}
              required
              disabled={loading}
            >
              {measurementOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Initial Quantity<span style={requiredFieldStyle}>*</span>
            </label>
            <input
              type="number"
              name="initial_quantity"
              value={formData.initial_quantity}
              onChange={handleChange}
              style={inputStyle}
              required
              min="0"
              step="1"
              placeholder="0"
              onKeyPress={(e) => {
                if (e.key === '.' || e.key === ',') {
                  e.preventDefault();
                }
              }}
              disabled={loading}
            />
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

          {success && (
            <div style={{ 
              padding: "12px", 
              backgroundColor: "#d4edda", 
              color: "#155724", 
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "0.85rem"
            }}>
              {success}
            </div>
          )}

          <div style={buttonContainerStyle}>
            <button
              type="button"
              onClick={handleClose}
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
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}