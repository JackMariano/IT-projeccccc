import React, { useState } from "react";

const plates = ["1A13212", "2B45678", "3C98765"];

export default function NotificationForm() {
  const [fuel, setFuel] = useState("");
  const [mileage, setMileage] = useState(["", "", "", "", ""]);
  const [plate, setPlate] = useState("");
  const [issue, setIssue] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const validate = () => {
    const errs = {};
    if (!fuel) errs.fuel = "Please select a fuel amount";
    if (mileage.some((m) => !m)) errs.mileage = "Please enter the current mileage";
    if (!plate) errs.plate = "Please select a plate number";
    return errs;
  };

  const handleSend = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      setFuel("");
      setMileage(["", "", "", "", ""]);
      setPlate("");
      setIssue("");
    }
  };

  // Inline styles
  const containerStyle = {
    marginLeft: 0,
    padding: 0,
    background: "transparent",
    minHeight: "auto",
    fontFamily: "Montserrat, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    boxSizing: "border-box",
  };

  const titleStyle = {
    fontSize: "2rem",
    fontWeight: 600,
    marginBottom: "24px",
    textAlign: "center",
  };

  const formStyle = {
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    padding: "32px",
    minWidth: "280px",
    maxWidth: "480px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontWeight: 500,
    marginBottom: "4px",
  };

  const inputStyle = (error) => ({
    padding: "10px 12px",
    borderRadius: "6px",
    border: `1px solid ${error ? "#d32f2f" : "#0e2a47"}`,
    fontSize: "1rem",
    marginBottom: "2px",
    background: "#f5f5f5",
    boxSizing: "border-box",
    width: "100%",
  });

  const mileageContainerStyle = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  };

  const mileageInputStyle = (error) => ({
    width: "32px",
    textAlign: "center",
    boxSizing: "border-box",
    border: `1px solid ${error ? "#d32f2f" : "#0e2a47"}`,
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "1rem",
  });

  const errorMsgStyle = {
    color: "#d32f2f",
    fontSize: "0.95rem",
    marginBottom: "4px",
  };

  const buttonStyle = {
    background: "#0e2a47",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "12px 0",
    fontSize: "1.1rem",
    fontWeight: 600,
    marginTop: "16px",
    cursor: "pointer",
    transition: "background 0.2s",
    width: "100%",
  };

  const modalStyle = {
    position: "fixed",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
    padding: "20px",
    boxSizing: "border-box",
  };

  const modalContentStyle = {
    background: "#fdf5d6",
    border: "3px solid #25472f",
    borderRadius: "8px",
    padding: "40px 30px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "90%",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    boxSizing: "border-box",
  };

  const modalCloseStyle = {
    position: "absolute",
    top: "12px",
    right: "16px",
    fontSize: "2rem",
    color: "#25472f",
    cursor: "pointer",
  };

  const modalIconStyle = {
    fontSize: "4rem",
    color: "#25472f",
    marginBottom: "32px",
  };

  const modalTextStyle = {
    fontSize: "1.8rem",
    color: "#25472f",
    fontWeight: 600,
    textAlign: "center",
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Send Notifications</div>
      <form style={formStyle} onSubmit={handleSend}>
        <label style={labelStyle}>Fuel Amount</label>
        <select
          value={fuel}
          onChange={(e) => setFuel(e.target.value)}
          style={inputStyle(errors.fuel)}
        >
          <option value="">Select fuel amount</option>
          <option>Full</option>
          <option>Half Empty</option>
          <option>Empty</option>
        </select>
        {errors.fuel && <span style={errorMsgStyle}>{errors.fuel}</span>}

        <label style={labelStyle}>Mileage</label>
        <div style={mileageContainerStyle}>
          {mileage.map((m, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={m}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setMileage(mileage.map((v, idx) => (idx === i ? val : v)));
              }}
              style={mileageInputStyle(errors.mileage)}
            />
          ))}
        </div>
        {errors.mileage && <span style={errorMsgStyle}>{errors.mileage}</span>}

        <label style={labelStyle}>Plate Number</label>
        <select
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          style={inputStyle(errors.plate)}
        >
          <option value="">Select plate number</option>
          {plates.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        {errors.plate && <span style={errorMsgStyle}>{errors.plate}</span>}

        <label style={labelStyle}>Issue</label>
        <input
          type="text"
          placeholder="Please input the issue here if necessary"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          style={inputStyle(false)}
        />

        <button type="submit" style={buttonStyle}>
          Send
        </button>
      </form>

      {sent && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <span style={modalCloseStyle} onClick={() => setSent(false)}>
              &#10005;
            </span>
            <div style={modalIconStyle}>&#x2714;</div>
            <div style={modalTextStyle}>Sent Successfully</div>
          </div>
        </div>
      )}
    </div>
  );
}
