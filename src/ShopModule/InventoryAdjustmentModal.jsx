// components/InventoryAdjustmentModal.jsx
import React, { useState, useEffect } from "react";

export default function InventoryAdjustmentModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  autoApprove = false,
}) {
  const [adjustmentType, setAdjustmentType] = useState("DECREASE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceDocument, setReferenceDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && item) {
      setAdjustmentType("DECREASE");
      setQuantity("");
      setReason("");
      setReferenceDocument("");
      setError("");
    }
  }, [isOpen, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      setError("Please enter a valid positive whole number quantity");
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setError("Reason is required and must be at least 10 characters");
      return;
    }

    const qty = parseInt(quantity);
    const isDecrease = adjustmentType === "DECREASE";

    // For decrease, validate quantity
    if (isDecrease && qty > item.current_quantity) {
      setError(
        `Cannot decrease by ${qty} - only ${item.current_quantity} ${item.measurement.toLowerCase()} available`,
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onConfirm({
        partId: item.part_id,
        quantity: qty,
        adjustmentType: adjustmentType,
        reason: reason.trim(),
        referenceDocument: referenceDocument.trim() || null,
        autoApprove: autoApprove,
      });

      setQuantity("");
      setReason("");
      setReferenceDocument("");
    } catch (err) {
      setError(err.message || "Failed to submit adjustment request");
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

  const radioGroupStyle = {
    display: "flex",
    gap: "20px",
    marginBottom: "16px",
  };

  const radioLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
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
    border: "1px solid #ffc107",
    background: "#ffc107",
    color: "#212529",
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

  const warningStyle = {
    background: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "16px",
    fontSize: "0.85rem",
    color: "#856404",
  };

  const requiredFieldStyle = {
    color: "#dc3545",
    marginLeft: "2px",
  };

  if (!isOpen || !item) return null;

  const newQuantity =
    adjustmentType === "DECREASE"
      ? Math.max(0, item.current_quantity - (parseInt(quantity) || 0))
      : (parseInt(quantity) || 0) + item.current_quantity;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Inventory Adjustment</h2>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
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
          {quantity && (
            <div
              style={{
                ...infoRowStyle,
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #dee2e6",
              }}
            >
              <span style={{ ...infoLabelStyle, fontWeight: 600 }}>
                New Stock (after adjustment):
              </span>
              <span
                style={{
                  ...infoValueStyle,
                  color: "#28a745",
                  fontSize: "1.1rem",
                }}
              >
                {newQuantity} {item.measurement.toLowerCase()}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Adjustment Type<span style={requiredFieldStyle}>*</span>
            </label>
            <div style={radioGroupStyle}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="adjustmentType"
                  value="INCREASE"
                  checked={adjustmentType === "INCREASE"}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  disabled={loading}
                />
                Increase Stock
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="adjustmentType"
                  value="DECREASE"
                  checked={adjustmentType === "DECREASE"}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  disabled={loading}
                />
                Decrease Stock
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="adjustmentType"
                  value="CORRECTION"
                  checked={adjustmentType === "CORRECTION"}
                  onChange={(e) => setAdjustmentType(e.target.value)}
                  disabled={loading}
                />
                Correction
              </label>
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Quantity ({item.measurement.toLowerCase()})
              <span style={requiredFieldStyle}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max={
                adjustmentType === "DECREASE"
                  ? item.current_quantity
                  : undefined
              }
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              required
              placeholder={`Enter quantity to ${adjustmentType.toLowerCase()}`}
              disabled={loading}
            />
            {adjustmentType === "DECREASE" &&
              quantity &&
              parseInt(quantity) > item.current_quantity && (
                <div
                  style={{
                    color: "#dc3545",
                    fontSize: "0.85rem",
                    marginTop: "4px",
                  }}
                >
                  Cannot decrease by more than current stock (
                  {item.current_quantity})
                </div>
              )}
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              Reason for Adjustment<span style={requiredFieldStyle}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              required
              placeholder="Enter detailed reason for this adjustment (e.g., Cycle count revealed discrepancy, Damaged goods found, Data entry error correction, etc.)"
              disabled={loading}
            />
            <div
              style={{ fontSize: "0.8rem", color: "#6c757d", marginTop: "4px" }}
            >
              Minimum 10 characters required
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Reference Document (Optional)</label>
            <input
              type="text"
              value={referenceDocument}
              onChange={(e) => setReferenceDocument(e.target.value)}
              style={inputStyle}
              placeholder="Enter document reference (e.g., Count-Sheet-001, Audit-Report-2024)"
              disabled={loading}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "0.85rem",
              }}
            >
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
              {loading
                ? "Processing..."
                : autoApprove
                  ? "Apply Adjustment"
                  : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
