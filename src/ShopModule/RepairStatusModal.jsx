import React, { useState } from "react";

export function UpdateStatusModal({ open, onClose, onSave, vehicle }) {
  const [status, setStatus] = useState(
    vehicle?.status === "Available" ? "Available" : "Out of Service"
  );

  if (!open) return null;

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(60, 60, 60, 0.25)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: "18px",
    padding: "2rem 2.5rem",
    minWidth: 0,
    width: "min(520px, 95%)",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 32px rgba(0, 0, 0, 0.13)",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
    alignItems: "stretch",
  };

  const titleStyle = {
    fontSize: "1.3rem",
    textAlign: "center",
    marginBottom: "1rem",
    color: "#222",
  };

  const labelStyle = { fontWeight: 500, marginBottom: "0.2rem", color: "#333" };

  const radioStyle = { marginRight: "0.5rem" };

  const actionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "0.5rem",
  };

  const buttonStyle = {
    padding: "0.5rem 1.3rem",
    borderRadius: "20px",
    border: "none",
    fontSize: "1rem",
    background: "#46644a",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "#f4f4f4",
    color: "#333",
    border: "1px solid #bbb",
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h2 style={titleStyle}>Update Status</h2>
        <div>
          <label style={labelStyle}>
            <input
              type="radio"
              checked={status === "Available"}
              onChange={() => setStatus("Available")}
              style={radioStyle}
            />
            Available
          </label>
        </div>
        <div>
          <label style={labelStyle}>
            <input
              type="radio"
              checked={status === "Out of Service"}
              onChange={() => setStatus("Out of Service")}
              style={radioStyle}
            />
            Out of Service
          </label>
        </div>
        <div style={actionsStyle}>
          <button style={cancelButtonStyle} onClick={onClose}>
            Cancel
          </button>
          <button style={buttonStyle} onClick={() => onSave(status)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecordRepairModal({ open, onClose, onConfirm, vehicle }) {
  const [repair, setRepair] = useState("");
  const [type, setType] = useState(vehicle?.type || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [plate, setPlate] = useState(vehicle?.plate || "");

  if (!open) return null;

  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(60, 60, 60, 0.25)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalStyle = {
    background: "#fff",
    borderRadius: "18px",
    padding: "2rem 2.5rem",
    minWidth: 0,
    width: "min(520px, 95%)",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 4px 32px rgba(0, 0, 0, 0.13)",
    display: "flex",
    flexDirection: "column",
    gap: "1.2rem",
    alignItems: "stretch",
  };

  const titleStyle = {
    fontSize: "1.3rem",
    textAlign: "center",
    marginBottom: "1rem",
    color: "#222",
  };

  const labelStyle = { fontWeight: 500, marginBottom: "0.2rem", color: "#333" };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.7rem",
    borderRadius: "7px",
    border: "1px solid #bbb",
    marginBottom: "0.7rem",
    fontSize: "1rem",
  };

  const actionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "0.5rem",
  };

  const buttonStyle = {
    padding: "0.5rem 1.3rem",
    borderRadius: "20px",
    border: "none",
    fontSize: "1rem",
    background: "#46644a",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: "#f4f4f4",
    color: "#333",
    border: "1px solid #bbb",
  };

  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h2 style={titleStyle}>Repair</h2>
        <div>
          <label style={labelStyle}>Repair</label>
          <input
            type="text"
            value={repair}
            onChange={(e) => setRepair(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Type Of Vehicle</label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Plate Number</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={actionsStyle}>
          <button style={cancelButtonStyle} onClick={onClose}>
            Cancel
          </button>
          <button
            style={buttonStyle}
            onClick={() =>
              onConfirm({ repair, type, date, time, plate })
            }
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
