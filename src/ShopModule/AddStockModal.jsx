// components/AddStockModal.jsx
import React, { useState } from "react";

export default function AddStockModal({ 
  item, 
  isOpen, 
  onClose, 
  onConfirm
}) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or item changes
  React.useEffect(() => {
    if (isOpen && item) {
      setQuantity("");
      setError("");
    }
  }, [isOpen, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      setError(`Please enter a valid whole number quantity in ${item.measurement.toLowerCase()}`);
      return;
    }

    const qty = parseInt(quantity);

    setLoading(true);
    setError("");

    try {
      await onConfirm({
        partId: item.part_id,
        quantity: qty,
        measurement: item.measurement
      });
      
      // Reset form on successful submission
      setQuantity("");
    } catch (err) {
      setError(err.message || "Failed to add stock");
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
    maxWidth: "400px",
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

  const errorStyle = {
    color: "#dc3545",
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

  const requiredFieldStyle = {
    color: "#dc3545",
    marginLeft: "2px",
  };

  if (!isOpen || !item) return null;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Add Stock</h2>
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
            <span style={infoLabelStyle}>Measurement Unit:</span>
            <span style={infoValueStyle}>{item.measurement}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Quantity to Add ({item.measurement.toLowerCase()})<span style={requiredFieldStyle}>*</span>
            </label>
            <input
              type="number"
              min="1"
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
              {loading ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}